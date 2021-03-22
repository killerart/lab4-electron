import React, { useCallback, useState } from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import Login from './components/Login';
import useUser from './utils/useUser';
import Sidebar from './components/Sidebar';
import Logout from './components/Logout';
import Message from './components/Message';
import { Actions } from './utils/ipcCommunication';
import Send from './components/Send';
import './App.css';

function App() {
  const [user, setUser, removeUser] = useUser();
  const [selectedMessageUID, setSelectedMessageUID] = useState();
  const [errorMessage, setErrorMessage] = useState();

  const logout = useCallback(() => {
    ipcRenderer.invoke(Actions.LOGOUT);
    removeUser();
    setSelectedMessageUID(undefined);
  }, [removeUser]);

  if (!user) {
    return (
      <Login
        setUser={setUser}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    );
  }

  return (
    <main>
      <BrowserRouter>
        <Switch>
          <Sidebar
            user={user}
            logout={logout}
            selectedMessageUID={selectedMessageUID}
            setSelectedMessageUID={setSelectedMessageUID}
            setErrorMessage={setErrorMessage}
          >
            <Route
              path="/message/:uid"
              component={(props) => <Message user={user} {...props} />}
            />
            <Route
              path="/send"
              component={(props) => (
                <Send
                  user={user}
                  setSelectedMessageUID={setSelectedMessageUID}
                  {...props}
                />
              )}
            />
            <Route path="/logout">
              <Logout
                logout={logout}
                setSelectedMessageUID={setSelectedMessageUID}
              />
            </Route>
            <Route path="/">
              <Redirect to="/send" />
            </Route>
          </Sidebar>
        </Switch>
      </BrowserRouter>
    </main>
  );
}

export default App;
