import React from 'react';
import { Redirect } from 'react-router';

export default function Logout({ logout }) {
  logout();
  return <Redirect to="/login" />;
}
