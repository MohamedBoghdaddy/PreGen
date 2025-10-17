import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Assignments.css";

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignments = async () => {
    const res = await axios.get("http://localhost:4000/api/assignments");
    setAssignments(res.data);
  };

  const generateAssignment = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/ai/generate-assignment"
      );
      setAssignments((prev) => [...prev, res.data.assignment]);
    } catch (err) {
      console.error(err);
      alert("Error generating assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <div className="assignments-page">
      <h1>📝 Assignments</h1>
      <button onClick={generateAssignment}>Generate AI Assignment</button>
      {loading && <p>Generating assignment...</p>}

      <div className="assignment-list">
        {assignments.map((a, i) => (
          <div key={i} className="assignment-card">
            <h3>{a.title}</h3>
            <p>{a.description}</p>
            <small>Due: {a.dueDate}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assignments;
