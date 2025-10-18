import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "../../styles/QuizGenerator.css";

const QuizGenerator = () => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gradeLevel, setGradeLevel] = useState("high school");
  const [subject, setSubject] = useState("general");
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [analytics, setAnalytics] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    topicsAttempted: []
  });
  const timerRef = useRef(null);

  // Load analytics from localStorage on component mount
  useEffect(() => {
    const savedAnalytics = JSON.parse(localStorage.getItem("quizAnalytics")) || {
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: 0,
      topicsAttempted: []
    };
    setAnalytics(savedAnalytics);
  }, []);

  // Timer effect
  useEffect(() => {
    if (quizStarted && quiz.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [quizStarted, quiz.length]);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic before generating a quiz.");
      return;
    }

    setLoading(true);
    setQuizStarted(false);
    setShowResults(false);
    setUserAnswers({});
    setTimeSpent(0);

    try {
      const res = await axios.post("http://localhost:8000/api/quiz/generate", {
        topic,
        num_questions: numQuestions,
        question_type: "multiple_choice",
        difficulty,
        grade_level: gradeLevel,
        subject,
        language: "English",
      });

      const generatedQuiz = res.data.quiz || res.data.questions || res.data;
      
      // Ensure each question has an ID and proper structure
      const formattedQuiz = generatedQuiz.map((q, index) => ({
        id: index + 1,
        question: q.question || `Question ${index + 1}`,
        options: q.options || ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: q.answer || "A",
        explanation: q.explanation || "No explanation provided.",
        userAnswer: null,
        isCorrect: false
      }));

      setQuiz(formattedQuiz);
      setQuizStarted(true);

    } catch (err) {
      console.error("❌ Error generating quiz:", err);
      alert("Error generating quiz. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, selectedOption) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    const updatedQuiz = quiz.map(q => {
      const isCorrect = userAnswers[q.id] === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        ...q,
        userAnswer: userAnswers[q.id],
        isCorrect
      };
    });

    const newScore = Math.round((correct / quiz.length) * 100);
    setScore(newScore);
    setQuiz(updatedQuiz);
    setShowResults(true);
    setQuizStarted(false);

    // Update analytics
    const newAnalytics = {
      totalQuizzes: analytics.totalQuizzes + 1,
      averageScore: Math.round((analytics.averageScore * analytics.totalQuizzes + newScore) / (analytics.totalQuizzes + 1)),
      bestScore: Math.max(analytics.bestScore, newScore),
      topicsAttempted: [...new Set([...analytics.topicsAttempted, topic])]
    };

    setAnalytics(newAnalytics);
    localStorage.setItem("quizAnalytics", JSON.stringify(newAnalytics));
  };

  const downloadQuizPDF = () => {
    if (quiz.length === 0) {
      alert("No quiz to download! Generate a quiz first.");
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text("AI-Generated Quiz", 20, 30);
    
    // Quiz Information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Topic: ${topic}`, 20, 50);
    doc.text(`Difficulty: ${difficulty}`, 20, 60);
    doc.text(`Grade Level: ${gradeLevel}`, 20, 70);
    doc.text(`Number of Questions: ${quiz.length}`, 20, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 90);
    
    // Questions
    let yPosition = 110;
    quiz.forEach((question, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Question
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      const questionText = `Q${index + 1}: ${question.question}`;
      const splitQuestion = doc.splitTextToSize(questionText, 170);
      doc.text(splitQuestion, 20, yPosition);
      yPosition += splitQuestion.length * 6;
      
      // Options
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      question.options.forEach((option, optIndex) => {
        const optionText = `${String.fromCharCode(65 + optIndex)}. ${option}`;
        doc.text(optionText, 30, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    });
    
    // Answer Key
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text("Answer Key", 20, 30);
    
    yPosition = 50;
    quiz.forEach((question, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Q${index + 1}: ${question.correctAnswer}`, 20, yPosition);
      
      if (question.explanation) {
        const explanationText = doc.splitTextToSize(`Explanation: ${question.explanation}`, 170);
        doc.text(explanationText, 25, yPosition + 7);
        yPosition += explanationText.length * 5 + 10;
      } else {
        yPosition += 15;
      }
    });

    // Results Page (if quiz was completed)
    if (showResults) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text("Quiz Results", 20, 30);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Score: ${score}%`, 20, 50);
      doc.text(`Time Spent: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`, 20, 65);
      doc.text(`Correct: ${quiz.filter(q => q.isCorrect).length}/${quiz.length}`, 20, 80);
      
      yPosition = 100;
      quiz.forEach((question, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        const status = question.isCorrect ? "✓ Correct" : "✗ Incorrect";
        doc.setTextColor(question.isCorrect ? [39, 174, 96] : [231, 76, 60]);
        doc.text(`Q${index + 1}: ${status}`, 20, yPosition);
        
        doc.setTextColor(0, 0, 0);
        doc.text(`Your Answer: ${question.userAnswer || "Not answered"}`, 25, yPosition + 7);
        doc.text(`Correct Answer: ${question.correctAnswer}`, 25, yPosition + 14);
        
        yPosition += 25;
      });
    }
    
    const filename = `Quiz_${topic.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    doc.save(filename);
  };

  const resetQuiz = () => {
    setQuiz([]);
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
    setQuizStarted(false);
    setTimeSpent(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = (score) => {
    if (score >= 90) return "🎉 Excellent! You're a master!";
    if (score >= 80) return "👍 Great job! Well done!";
    if (score >= 70) return "💪 Good work! Keep it up!";
    if (score >= 60) return "📚 Not bad! Review and try again!";
    return "📖 Keep studying! You'll get better!";
  };

  return (
    <div className="quiz-generator">
      <div className="quiz-header">
        <h1>🎯 AI Quiz Generator</h1>
        <p>Generate custom quizzes powered by Google Gemini AI</p>
      </div>

      <div className="quiz-layout">
        {/* Controls Section */}
        <div className="quiz-controls-section">
          <div className="control-group">
            <label>Topic</label>
            <input
              type="text"
              placeholder="Enter topic (e.g., Trigonometry, Photosynthesis, World War II)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="topic-input"
            />
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="general">General</option>
                <option value="math">Mathematics</option>
                <option value="science">Science</option>
                <option value="history">History</option>
                <option value="english">English</option>
                <option value="programming">Programming</option>
              </select>
            </div>

            <div className="control-group">
              <label>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="control-group">
              <label>Grade Level</label>
              <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
                <option value="elementary">Elementary</option>
                <option value="middle school">Middle School</option>
                <option value="high school">High School</option>
                <option value="college">College</option>
              </select>
            </div>

            <div className="control-group">
              <label>Questions</label>
              <select 
                value={numQuestions} 
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={generateQuiz} 
              disabled={loading}
              className="generate-btn"
            >
              {loading ? "🔄 Generating..." : "🚀 Generate Quiz"}
            </button>
            
            {quiz.length > 0 && (
              <>
                <button onClick={downloadQuizPDF} className="pdf-btn">
                  📄 Download PDF
                </button>
                <button onClick={resetQuiz} className="reset-btn">
                  🔄 New Quiz
                </button>
              </>
            )}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="analytics-sidebar">
          <h3>📊 Your Quiz Analytics</h3>
          <div className="analytics-cards">
            <div className="analytics-card">
              <div className="card-value">{analytics.totalQuizzes}</div>
              <div className="card-label">Total Quizzes</div>
            </div>
            <div className="analytics-card">
              <div className="card-value">{analytics.averageScore}%</div>
              <div className="card-label">Average Score</div>
            </div>
            <div className="analytics-card">
              <div className="card-value">{analytics.bestScore}%</div>
              <div className="card-label">Best Score</div>
            </div>
          </div>

          {analytics.topicsAttempted.length > 0 && (
            <div className="topics-section">
              <h4>📚 Topics Attempted</h4>
              <div className="topics-list">
                {analytics.topicsAttempted.slice(0, 5).map((topic, index) => (
                  <span key={index} className="topic-tag">{topic}</span>
                ))}
                {analytics.topicsAttempted.length > 5 && (
                  <span className="topic-tag more">+{analytics.topicsAttempted.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {quizStarted && (
            <div className="quiz-timer">
              <h4>⏱️ Time Elapsed</h4>
              <div className="timer-display">{formatTime(timeSpent)}</div>
              <div className="progress-info">
                Progress: {Object.keys(userAnswers).length}/{quiz.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>🧠 AI is generating your quiz questions...</p>
        </div>
      )}

      {/* Quiz Content */}
      {quiz.length > 0 && !showResults && (
        <div className="quiz-content">
          <div className="quiz-header-info">
            <h2>📝 {topic} Quiz</h2>
            <div className="quiz-meta">
              <span>⏱️ {formatTime(timeSpent)}</span>
              <span>📊 {Object.keys(userAnswers).length}/{quiz.length} answered</span>
              <span>🎯 {difficulty}</span>
            </div>
          </div>

          <div className="questions-container">
            {quiz.map((question) => (
              <div key={question.id} className="question-card">
                <div className="question-header">
                  <h3>Question {question.id}</h3>
                </div>
                <p className="question-text">{question.question}</p>
                
                <div className="options-grid">
                  {question.options.map((option, index) => (
                    <label 
                      key={index} 
                      className={`option-label ${
                        userAnswers[question.id] === String.fromCharCode(65 + index) ? 'selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={String.fromCharCode(65 + index)}
                        onChange={() => handleAnswerSelect(question.id, String.fromCharCode(65 + index))}
                        checked={userAnswers[question.id] === String.fromCharCode(65 + index)}
                      />
                      <span className="option-letter">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="option-text">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="quiz-actions">
            <button 
              onClick={calculateScore}
              disabled={Object.keys(userAnswers).length !== quiz.length}
              className="submit-btn"
            >
              📊 Submit Quiz
            </button>
            <p className="completion-hint">
              {Object.keys(userAnswers).length === quiz.length 
                ? "🎉 All questions answered! Ready to submit."
                : `Answer all ${quiz.length} questions to submit.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {showResults && (
        <div className="results-section">
          <div className="results-header">
            <h2>📈 Quiz Results</h2>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-value">{score}%</span>
              </div>
              <div className="score-details">
                <p className="performance-message">{getPerformanceMessage(score)}</p>
                <p>Correct: {quiz.filter(q => q.isCorrect).length}/{quiz.length}</p>
                <p>Time: {formatTime(timeSpent)}</p>
              </div>
            </div>
          </div>

          <div className="results-breakdown">
            <h3>Question Breakdown</h3>
            {quiz.map((question, index) => (
              <div key={question.id} className={`result-item ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-header">
                  <span className="question-number">Q{index + 1}</span>
                  <span className="result-status">
                    {question.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <p className="result-question">{question.question}</p>
                <div className="answer-comparison">
                  <div className="answer-item">
                    <span className="answer-label">Your Answer:</span>
                    <span className={`answer-value ${!question.isCorrect ? 'wrong' : ''}`}>
                      {question.userAnswer || "Not answered"}
                    </span>
                  </div>
                  {!question.isCorrect && (
                    <div className="answer-item">
                      <span className="answer-label">Correct Answer:</span>
                      <span className="answer-value correct">{question.correctAnswer}</span>
                    </div>
                  )}
                </div>
                {question.explanation && (
                  <div className="explanation">
                    <strong>💡 Explanation:</strong> {question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="results-actions">
            <button onClick={downloadQuizPDF} className="pdf-btn large">
              📄 Download Detailed Report (PDF)
            </button>
            <button onClick={resetQuiz} className="generate-btn">
              🔄 Generate New Quiz
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {quiz.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>Ready to Test Your Knowledge?</h3>
          <p>Enter a topic above and generate an AI-powered quiz to challenge yourself!</p>
          <div className="features-grid">
            <div className="feature">
              <span>🤖</span>
              <h4>AI-Powered</h4>
              <p>Questions generated by Google Gemini</p>
            </div>
            <div className="feature">
              <span>📊</span>
              <h4>Detailed Analytics</h4>
              <p>Track your progress and performance</p>
            </div>
            <div className="feature">
              <span>📄</span>
              <h4>PDF Export</h4>
              <p>Download quizzes for offline use</p>
            </div>
            <div className="feature">
              <span>⚡</span>
              <h4>Instant Feedback</h4>
              <p>Get explanations and scores immediately</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;