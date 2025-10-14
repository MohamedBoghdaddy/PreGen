import React from 'react';

/**
 * Generic dashboard component placeholder.
 * Could be used to display high-level information.
 */
const Dashboard = ({ title, children }) => {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default Dashboard;