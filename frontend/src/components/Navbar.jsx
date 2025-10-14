import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Simple navigation bar that changes links based on the logged in user's role.
 */
const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <h1 style={{ display: 'inline-block', marginRight: '2rem' }}>
        Learning Platform
      </h1>
      <ul
        style={{ listStyle: 'none', display: 'inline-block', margin: 0, padding: 0 }}
      >
        {user && user.role === 'teacher' && (
          <li style={{ display: 'inline-block', marginRight: '1rem' }}>
            <Link to="/teacher">Teacher Portal</Link>
          </li>
        )}
        {user && user.role === 'student' && (
          <li style={{ display: 'inline-block', marginRight: '1rem' }}>
            <Link to="/student">Student Portal</Link>
          </li>
        )}
        {user && user.role === 'parent' && (
          <li style={{ display: 'inline-block', marginRight: '1rem' }}>
            <Link to="/parent">Parent Portal</Link>
          </li>
        )}
        {user && user.role === 'admin' && (
          <li style={{ display: 'inline-block', marginRight: '1rem' }}>
            <Link to="/admin">Admin Dashboard</Link>
          </li>
        )}
        {user ? (
          <li style={{ display: 'inline-block', marginRight: '1rem' }}>
            <button onClick={logout}>Logout</button>
          </li>
        ) : (
          <li style={{ display: 'inline-block', marginRight: '1rem' }}>
            <Link to="/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;