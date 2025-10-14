import React, { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Displays the leaderboard by fetching data from the backend.
 */
const Leaderboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    api
      .get('/student/leaderboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h3>Leaderboard</h3>
      <ol>
        {data.map((entry) => (
          <li key={entry._id}>
            {entry.student?.name || 'Unknown'} - {entry.points} pts
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;