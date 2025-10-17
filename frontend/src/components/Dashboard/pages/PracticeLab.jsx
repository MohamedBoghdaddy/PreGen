import React, { useState } from "react";
import axios from "axios";
import "../../styles/PracticeLab.css";

const PracticeLab = () => {
  const [subject, setSubject] = useState("");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);

  const generatePracticeSheet = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/ai/generate-practice",
        {
          subject,
        }
      );
      setProblems(res.data.problems);
    } catch (err) {
      console.error(err);
      alert("Error generating practice sheet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="practice-lab">
      <h1>🧠 Practice Lab</h1>
      <input
        type="text"
        placeholder="Enter subject (e.g. Integration, Algebra, Circuits)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <button onClick={generatePracticeSheet}>Generate Practice Sheet</button>

      {loading && <p>Generating problems...</p>}

      <div className="problem-list">
        {problems.map((p, index) => (
          <div key={index} className="problem-item">
            <p>
              <strong>{index + 1}.</strong> {p.question}
            </p>
            <details>
              <summary>Show Solution</summary>
              <p>{p.solution}</p>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeLab;
