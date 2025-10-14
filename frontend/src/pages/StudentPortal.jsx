import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Leaderboard from '../components/Leaderboard';

/**
 * Student portal page. Shows assignments, results, personalised path and leaderboard.
 */
const StudentPortal = () => {
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [adaptivePath, setAdaptivePath] = useState([]);

  const fetchData = () => {
    api
      .get('/student/assignments')
      .then((res) => setAssignments(res.data))
      .catch((err) => console.error(err));

    api
      .get('/student/results')
      .then((res) => setResults(res.data))
      .catch((err) => console.error(err));

    api
      .get('/student/adaptive')
      .then((res) => setAdaptivePath(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (assignmentId) => {
    const answers = window.prompt('Enter your answers:');
    if (!answers) return;
    try {
      await api.post('/student/assignments/submit', { assignmentId, answers });
      alert('Submitted!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting assignment');
    }
  };

  return (
    <div>
      <h2>Student Portal</h2>
      <section>
        <h3>Your Assignments</h3>
        <ul>
          {assignments.map((a) => (
            <li key={a._id}>
              <strong>{a.title}</strong> – Due:{' '}
              {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}
              <button style={{ marginLeft: '1rem' }} onClick={() => handleSubmit(a._id)}>
                Submit
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Your Results</h3>
        <ul>
          {results.map((r) => (
            <li key={r.assignmentId}>
              {r.title}: {r.score != null ? r.score : 'Not graded yet'}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Personalised Learning Path</h3>
        <ul>
          {adaptivePath.map((item, idx) => (
            <li key={idx}>
              {item.topic} – {item.recommendedResources.join(', ')}
            </li>
          ))}
        </ul>
      </section>
      <Leaderboard />
    </div>
  );
};

export default StudentPortal;