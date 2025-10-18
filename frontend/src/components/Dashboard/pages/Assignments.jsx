import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Assignments.css";
import jsPDF from "jspdf";

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("high school");
  const [subject, setSubject] = useState("general");
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [gradingResults, setGradingResults] = useState(null);

  // Load assignments from localStorage on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("ai_assignments")) || [];
    setAssignments(saved);
  }, []);

  const generateAssignment = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic for the assignment.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/api/assignments/generate",
        {
          topic,
          grade_level: gradeLevel,
          subject,
          num_questions: 5,
          language: "English",
        }
      );

      const assignmentData = res.data.assignment || res.data;

      const newAssignment = {
        id: Date.now(),
        title: assignmentData.title || `Assignment: ${topic}`,
        topic: assignmentData.topic || topic,
        grade_level: assignmentData.grade_level || gradeLevel,
        subject: assignmentData.subject || subject,
        questions: assignmentData.questions || [],
        generated_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
      };

      // Update state and localStorage
      const updatedAssignments = [...assignments, newAssignment];
      setAssignments(updatedAssignments);
      localStorage.setItem(
        "ai_assignments",
        JSON.stringify(updatedAssignments)
      );

      setCurrentAssignment(newAssignment);
      setStudentAnswers({});
      setGradingResults(null);

      console.log("✅ Assignment generated:", newAssignment);
    } catch (err) {
      console.error("❌ Error generating assignment:", err);
      alert("Error generating AI assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const submitAssignment = async () => {
    if (!currentAssignment) return;

    try {
      const res = await axios.post(
        "http://localhost:8000/api/assignments/grade",
        {
          assignment_data: currentAssignment,
          student_answers: studentAnswers,
          language: "English",
        }
      );

      setGradingResults(res.data);
      console.log("📊 Grading results:", res.data);
    } catch (err) {
      console.error("❌ Error grading assignment:", err);
      alert("Error grading assignment. Please try again.");
    }
  };

  const downloadAsPDF = (assignment) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text(assignment.title, 20, 30);

    // Metadata
    doc.setFontSize(12);
    doc.text(`Topic: ${assignment.topic}`, 20, 50);
    doc.text(`Grade Level: ${assignment.grade_level}`, 20, 60);
    doc.text(`Subject: ${assignment.subject}`, 20, 70);
    doc.text(
      `Due Date: ${new Date(assignment.due_date).toLocaleDateString()}`,
      20,
      80
    );

    // Questions
    let yPosition = 100;
    assignment.questions.forEach((question, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(`Q${index + 1}: ${question.question}`, 20, yPosition);
      yPosition += 10;

      // Options for multiple choice
      if (question.type === "multiple_choice" && question.options) {
        question.options.forEach((option, optIndex) => {
          doc.setFontSize(12);
          doc.text(
            `${String.fromCharCode(65 + optIndex)}. ${option}`,
            30,
            yPosition
          );
          yPosition += 7;
        });
      }

      yPosition += 10;
    });

    // Answers page
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Answer Key", 20, 30);

    yPosition = 50;
    assignment.questions.forEach((question, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text(`Q${index + 1}: ${question.correct_answer}`, 20, yPosition);
      if (question.explanation) {
        doc.text(`Explanation: ${question.explanation}`, 20, yPosition + 7);
        yPosition += 14;
      }
      yPosition += 15;
    });

    doc.save(`${assignment.topic.replace(/\s+/g, "_")}_assignment.pdf`);
  };

  const deleteAssignment = (assignmentId) => {
    const updatedAssignments = assignments.filter((a) => a.id !== assignmentId);
    setAssignments(updatedAssignments);
    localStorage.setItem("ai_assignments", JSON.stringify(updatedAssignments));

    if (currentAssignment && currentAssignment.id === assignmentId) {
      setCurrentAssignment(null);
      setStudentAnswers({});
      setGradingResults(null);
    }
  };

  return (
    <div className="assignments-page">
      <h1>📝 AI-Powered Assignments</h1>

      {/* Assignment Generation Form */}
      <div className="assignment-form">
        <input
          type="text"
          placeholder="Enter topic (e.g., Photosynthesis, Algebra, World War II)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="topic-input"
        />

        <select
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
        >
          <option value="elementary">Elementary School</option>
          <option value="middle school">Middle School</option>
          <option value="high school">High School</option>
          <option value="college">College</option>
        </select>

        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="general">General</option>
          <option value="math">Mathematics</option>
          <option value="science">Science</option>
          <option value="history">History</option>
          <option value="english">English</option>
          <option value="programming">Programming</option>
        </select>

        <button onClick={generateAssignment} disabled={loading}>
          {loading ? "🔄 Generating..." : "🚀 Generate AI Assignment"}
        </button>
      </div>

      {/* Current Assignment Display */}
      {currentAssignment && (
        <div className="current-assignment">
          <h2>{currentAssignment.title}</h2>
          <div className="assignment-meta">
            <span>📚 {currentAssignment.subject}</span>
            <span>🎓 {currentAssignment.grade_level}</span>
            <span>
              📅 Due:{" "}
              {new Date(currentAssignment.due_date).toLocaleDateString()}
            </span>
            <button
              onClick={() => downloadAsPDF(currentAssignment)}
              className="pdf-btn"
            >
              📄 Download PDF
            </button>
          </div>

          <div className="questions-section">
            {currentAssignment.questions.map((q, index) => (
              <div key={q.id || index} className="question-card">
                <h4>
                  Q{index + 1}: {q.question}
                </h4>

                {q.type === "multiple_choice" && q.options && (
                  <div className="options">
                    {q.options.map((option, optIndex) => (
                      <label key={optIndex} className="option">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={String.fromCharCode(65 + optIndex)}
                          onChange={(e) =>
                            handleAnswerChange(q.id, e.target.value)
                          }
                        />
                        {String.fromCharCode(65 + optIndex)}. {option}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "short_answer" && (
                  <textarea
                    placeholder="Type your answer here..."
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    rows={3}
                  />
                )}

                {q.type === "problem_solving" && (
                  <textarea
                    placeholder="Show your work and solution..."
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    rows={4}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="assignment-actions">
            <button onClick={submitAssignment} className="submit-btn">
              📊 Submit for Grading
            </button>
            <button
              onClick={() => deleteAssignment(currentAssignment.id)}
              className="delete-btn"
            >
              🗑️ Delete Assignment
            </button>
          </div>

          {/* Grading Results */}
          {gradingResults && (
            <div className="grading-results">
              <h3>📈 Grading Results</h3>
              <div className="overall-score">
                <h4>Overall Score: {gradingResults.overall_score}/100</h4>
                <p>{gradingResults.feedback}</p>
              </div>

              {gradingResults.strengths &&
                gradingResults.strengths.length > 0 && (
                  <div className="strengths">
                    <h5>✅ Strengths:</h5>
                    <ul>
                      {gradingResults.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {gradingResults.improvements &&
                gradingResults.improvements.length > 0 && (
                  <div className="improvements">
                    <h5>📝 Areas for Improvement:</h5>
                    <ul>
                      {gradingResults.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Previous Assignments List */}
      <div className="assignments-list">
        <h3>📚 Your Assignments ({assignments.length})</h3>

        {assignments.length === 0 ? (
          <p className="no-assignments">
            No assignments yet. Generate one above! 🚀
          </p>
        ) : (
          <div className="assignment-grid">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <h4>{assignment.title}</h4>
                <p>Topic: {assignment.topic}</p>
                <p>Subject: {assignment.subject}</p>
                <p>Grade: {assignment.grade_level}</p>
                <p>Questions: {assignment.questions?.length || 0}</p>

                <div className="card-actions">
                  <button
                    onClick={() => setCurrentAssignment(assignment)}
                    className="view-btn"
                  >
                    👀 View
                  </button>
                  <button
                    onClick={() => downloadAsPDF(assignment)}
                    className="pdf-btn"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => deleteAssignment(assignment.id)}
                    className="delete-btn"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
