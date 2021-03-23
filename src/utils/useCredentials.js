import { useCallback, useState } from 'react';

export default function useCredentials() {
  const getCredentials = () => {
    const credentialsJson = localStorage.getItem('credentials');
    return JSON.parse(credentialsJson);
  };

  const [credentials, setToken] = useState(getCredentials());

  const saveCredentials = useCallback((credentials) => {
    localStorage.setItem('credentials', JSON.stringify(credentials));
    setToken(credentials);
  }, []);

  const removeCredentials = useCallback(() => {
    localStorage.removeItem('credentials');
    setToken(undefined);
  }, []);

  return [credentials, saveCredentials, removeCredentials];
}
