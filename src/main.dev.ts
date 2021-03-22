/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import inbox from 'inbox-2';
import { simpleParser } from 'mailparser';
import smtp from 'nodemailer';
import MenuBuilder from './menu';
import { Actions, Errors } from './utils/ipcCommunication';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1200,
    height: 800,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

let imapClient: any = null;
let smtpClient: any = null;

function openImapConnection(
  event: Electron.IpcMainEvent,
  user: any,
  callback: () => void
) {
  if (imapClient) {
    callback();
    return;
  }

  imapClient = inbox.createConnection(false, user.imap, {
    secureConnection: true,
    auth: {
      user: user.email,
      pass: user.password,
    },
  });

  imapClient.once('connect', callback);

  imapClient.once('error', (error: any) => {
    console.error(error);
    event.reply(Errors.LOGIN_FAILED, 'Invalid credentials');
  });

  imapClient.on('new', (message: any) => {
    event.reply(Actions.NEW_MESSAGE, message);
  });

  imapClient.connect();
}

function closeImapConnection() {
  try {
    imapClient?.close();
  } catch (error) {
    console.error(error);
  } finally {
    imapClient = null;
  }
}

function openSmtpConnection(user: any) {
  if (smtpClient) {
    return;
  }

  smtpClient = smtp.createTransport({
    host: user.smtp,
    port: user.smtpPort ?? undefined,
    auth: {
      user: user.email,
      pass: user.password,
    },
  });
}

function closeSmtpConnection() {
  try {
    smtpClient?.close();
  } catch (error) {
    console.error(error);
  } finally {
    smtpClient = null;
  }
}

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    closeImapConnection();
    closeSmtpConnection();
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipcMain.on(Actions.GET_ALL_MESSAGES, (event, user) => {
  const getMessages = () => {
    imapClient.openMailbox('INBOX', (error: any) => {
      if (error) console.error(error);
      imapClient.listMessages(-100, (_: any, messages: any[]) =>
        event.reply(Actions.GET_ALL_MESSAGES, messages.reverse())
      );
    });
  };

  openImapConnection(event, user, getMessages);
});

ipcMain.on(Actions.GET_MESSAGE, (event, user, uid) => {
  const getMessage = () => {
    imapClient.openMailbox('INBOX', async (error: any) => {
      if (error) console.error(error);
      const message = await simpleParser(imapClient.createMessageStream(uid));
      event.reply(Actions.GET_MESSAGE, message);
      imapClient.addFlags(uid, ['\\Seen'], () => {});
    });
  };

  openImapConnection(event, user, getMessage);
});

ipcMain.handle(Actions.LOGOUT, () => {
  closeImapConnection();
  closeSmtpConnection();
});

ipcMain.handle(Actions.SEND_MESSAGE, (_event, user, message) => {
  openSmtpConnection(user);

  message.from = user.email;

  return smtpClient.sendMail(message);
});
