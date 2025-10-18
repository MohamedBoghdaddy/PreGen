import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "../../styles/PracticeLab.css";

const PracticeLab = () => {
  const [topics, setTopics] = useState("");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examFocus, setExamFocus] = useState("practice");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [subject, setSubject] = useState("math");

  const generatePracticeSheet = async () => {
    if (!topics.trim()) {
      alert("Please enter one or more topics.");
      return;
    }

    setLoading(true);
    try {
      // Use the assignments API to generate practice problems
      const res = await axios.post(
        "http://localhost:8000/api/assignments/generate",
        {
          topic: topics.split(",")[0].trim(), // Use first topic for assignment generation
          grade_level: "high school",
          subject: subject,
          num_questions: numQuestions,
          language: "English",
        }
      );

      const assignmentData = res.data.assignment || res.data;
      const generatedProblems = assignmentData.questions || [];

      // Transform assignment questions into practice problems
      const practiceProblems = generatedProblems.map((item, index) => ({
        id: item.id || index,
        type: item.type || "problem_solving",
        question: item.question || `Practice Problem ${index + 1}`,
        solution:
          item.correct_answer || item.explanation || "Solution not provided.",
        explanation:
          item.explanation || "Detailed explanation available after attempt.",
        options: item.options || [],
      }));

      setProblems(practiceProblems);
      console.log("✅ Practice problems generated:", practiceProblems);
    } catch (err) {
      console.error("❌ Error generating practice sheet:", err);

      // Fallback: Try using quiz generation if assignment fails
      try {
        const quizRes = await axios.post(
          "http://localhost:8000/api/quiz/generate",
          {
            topic: topics.split(",")[0].trim(),
            num_questions: numQuestions,
            difficulty: difficulty,
            grade_level: "high school",
            language: "English",
          }
        );

        const quizData = quizRes.data.quiz || [];
        const quizProblems = quizData.map((item, index) => ({
          id: index,
          type: "multiple_choice",
          question: item.question,
          solution: item.answer,
          explanation: item.explanation,
          options: item.options,
        }));

        setProblems(quizProblems);
        console.log("✅ Fallback quiz problems generated:", quizProblems);
      } catch (fallbackErr) {
        console.error("❌ Fallback also failed:", fallbackErr);
        alert("Error generating practice problems. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadAsPDF = () => {
    if (problems.length === 0) {
      alert("No problems to download! Generate some problems first.");
      return;
    }

    const doc = new jsPDF();

    // Title and Header
    doc.setFontSize(20);
    doc.text("AI Practice Lab - Practice Sheet", 20, 30);

    doc.setFontSize(12);
    doc.text(`Topics: ${topics}`, 20, 50);
    doc.text(`Subject: ${subject}`, 20, 60);
    doc.text(`Difficulty: ${difficulty}`, 20, 70);
    doc.text(`Number of Questions: ${problems.length}`, 20, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 90);

    // Problems
    let yPosition = 110;
    problems.forEach((problem, index) => {
      // Add new page if needed
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Question
      doc.setFontSize(14);
      const questionText = `Q${index + 1}: ${problem.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, 170);
      doc.text(splitQuestion, 20, yPosition);
      yPosition += splitQuestion.length * 7;

      // Options for multiple choice
      if (
        problem.type === "multiple_choice" &&
        problem.options &&
        problem.options.length > 0
      ) {
        problem.options.forEach((option, optIndex) => {
          doc.setFontSize(12);
          doc.text(
            `${String.fromCharCode(65 + optIndex)}. ${option}`,
            30,
            yPosition
          );
          yPosition += 7;
        });
      }

      // Space for answer
      doc.setFontSize(10);
      doc.text("Answer: ________________________________", 20, yPosition + 5);
      yPosition += 20;

      // Add some space between questions
      yPosition += 10;
    });

    // Solutions Page
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Practice Sheet - Solutions", 20, 30);

    yPosition = 50;
    problems.forEach((problem, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text(`Q${index + 1}: ${problem.question}`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Answer: ${problem.solution}`, 25, yPosition);
      yPosition += 7;

      if (
        problem.explanation &&
        problem.explanation !== "Detailed explanation available after attempt."
      ) {
        const explanationText = doc.splitTextToSize(
          `Explanation: ${problem.explanation}`,
          170
        );
        doc.text(explanationText, 25, yPosition);
        yPosition += explanationText.length * 5;
      }

      yPosition += 15;
    });

    // Save the PDF
    const filename = `Practice_Sheet_${topics.replace(
      /\s+/g,
      "_"
    )}_${Date.now()}.pdf`;
    doc.save(filename);
  };

  const clearProblems = () => {
    setProblems([]);
    setTopics("");
  };

  return (
    <div className="practice-lab">
      <h1>🧠 AI Practice Lab</h1>
      <p className="subtitle">
        Generate custom practice problems with AI and download as PDF
      </p>

      <div className="practice-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Enter topics (e.g., Algebra, Photosynthesis, World History)"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            className="topic-input"
          />
        </div>

        <div className="form-row">
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="math">Mathematics</option>
            <option value="science">Science</option>
            <option value="history">History</option>
            <option value="english">English</option>
            <option value="programming">Programming</option>
            <option value="general">General</option>
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
          >
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
          </select>

          <select
            value={examFocus}
            onChange={(e) => setExamFocus(e.target.value)}
          >
            <option value="practice">Practice</option>
            <option value="exam">Exam Preparation</option>
            <option value="revision">Revision</option>
            <option value="conceptual">Conceptual Understanding</option>
          </select>
        </div>

        <div className="form-actions">
          <button
            onClick={generatePracticeSheet}
            disabled={loading}
            className="generate-btn"
          >
            {loading ? "🔄 Generating..." : "🚀 Generate Practice Sheet"}
          </button>

          {problems.length > 0 && (
            <>
              <button onClick={downloadAsPDF} className="pdf-btn">
                📄 Download PDF
              </button>
              <button onClick={clearProblems} className="clear-btn">
                🗑️ Clear
              </button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <p>🧠 AI is generating your practice problems...</p>
          <div className="loading-spinner"></div>
        </div>
      )}

      {problems.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h2>📝 Your Practice Problems ({problems.length} questions)</h2>
            <div className="problem-stats">
              <span>Subject: {subject}</span>
              <span>Difficulty: {difficulty}</span>
              <span>Type: {examFocus}</span>
            </div>
          </div>

          <div className="problem-list">
            {problems.map((problem, index) => (
              <div key={problem.id || index} className="problem-item">
                <div className="problem-header">
                  <h3>Question {index + 1}</h3>
                  <span className="problem-type">{problem.type}</span>
                </div>

                <div className="problem-content">
                  <p className="question">{problem.question}</p>

                  {problem.type === "multiple_choice" && problem.options && (
                    <div className="options">
                      {problem.options.map((option, optIndex) => (
                        <div key={optIndex} className="option">
                          <span className="option-letter">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="option-text">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <details className="solution-details">
                    <summary>🎯 Show Solution & Explanation</summary>
                    <div className="solution-content">
                      <div className="correct-answer">
                        <strong>Correct Answer:</strong> {problem.solution}
                      </div>
                      {problem.explanation && (
                        <div className="explanation">
                          <strong>Explanation:</strong> {problem.explanation}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>

          <div className="practice-actions">
            <button onClick={downloadAsPDF} className="pdf-btn large">
              📄 Download Practice Sheet as PDF
            </button>
            <button onClick={generatePracticeSheet} className="generate-btn">
              🔄 Generate New Set
            </button>
          </div>
        </div>
      )}

      {problems.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No Practice Problems Yet</h3>
          <p>
            Enter a topic above and click "Generate Practice Sheet" to create
            custom AI-powered practice problems!
          </p>
          <div className="feature-list">
            <div className="feature">
              <span>🎯</span>
              <div>
                <strong>Multiple Question Types</strong>
                <p>MCQs, short answers, problem-solving</p>
              </div>
            </div>
            <div className="feature">
              <span>📊</span>
              <div>
                <strong>Adjustable Difficulty</strong>
                <p>Easy, medium, or hard problems</p>
              </div>
            </div>
            <div className="feature">
              <span>📄</span>
              <div>
                <strong>PDF Export</strong>
                <p>Download for offline practice</p>
              </div>
            </div>
            <div className="feature">
              <span>🤖</span>
              <div>
                <strong>AI-Powered</strong>
                <p>Generated by Google Gemini AI</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeLab;
