import React, { useState } from "react";
import axios from "axios";
import "../../styles/QuizGenerator.css";

const QuizGenerator = () => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/ai/generate-quiz",
        {
          topic,
          difficulty,
        }
      );
      setQuiz(res.data.questions);
    } catch (err) {
      console.error(err);
      alert("Error generating quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-generator">
      <h1>🎯 AI Quiz Generator</h1>
      <div className="quiz-controls">
        <input
          type="text"
          placeholder="Enter topic (e.g. Trigonometry, Photosynthesis)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button onClick={generateQuiz}>Generate Quiz</button>
      </div>

      {loading && <p>Generating quiz with Gemini...</p>}

      {quiz.length > 0 && (
        <div className="quiz-list">
          {quiz.map((q, index) => (
            <div key={index} className="quiz-question">
              <p>
                <strong>Q{index + 1}:</strong> {q.question}
              </p>
              {q.options.map((opt, i) => (
                <div key={i}>
                  <input type="radio" name={`q${index}`} /> {opt}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;
