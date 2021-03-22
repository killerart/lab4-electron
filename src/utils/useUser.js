import { useCallback, useState } from 'react';

export default function useUser() {
  const getUser = () => {
    const userJson = localStorage.getItem('user');
    return JSON.parse(userJson);
  };

  const [user, setToken] = useState(getUser());

  const saveUser = useCallback((user) => {
    localStorage.setItem('user', JSON.stringify(user));
    setToken(user);
  }, []);

  const removeUser = useCallback(() => {
    localStorage.removeItem('user');
    setToken(undefined);
  }, []);

  return [user, saveUser, removeUser];
}
