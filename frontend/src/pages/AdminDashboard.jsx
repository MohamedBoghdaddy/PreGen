import React, { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Admin dashboard page. Lists all users in the system.
 */
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api
      .get('/admin/users')
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <ul>
        {users.map((u) => (
          <li key={u._id}>
            {u.name} – {u.role}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;