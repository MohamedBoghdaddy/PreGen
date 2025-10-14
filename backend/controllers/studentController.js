const Assignment = require('../models/assignmentModel');
const Leaderboard = require('../models/leaderboardModel');
const adaptivePathEngine = require('../utils/adaptivePathEngine');

/**
 * Retrieve all assignments. In a real system this would filter by class or user.
 */
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('teacher', 'name')
      .sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Submit an assignment. Takes assignmentId and answers in body.
 */
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, answers } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    // Prevent multiple submissions
    const existing = assignment.submissions.find(
      (s) => s.student.toString() === req.user._id.toString()
    );
    if (existing) {
      return res.status(400).json({ error: 'Assignment already submitted' });
    }
    assignment.submissions.push({
      student: req.user._id,
      answers,
    });
    await assignment.save();
    res.json({ message: 'Assignment submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get results for assignments submitted by the logged in student.
 */
exports.getResults = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      'submissions.student': req.user._id,
    });
    const results = assignments.map((assignment) => {
      const submission = assignment.submissions.find(
        (s) => s.student.toString() === req.user._id.toString()
      );
      return {
        assignmentId: assignment._id,
        title: assignment.title,
        score: submission.score,
      };
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get global leaderboard for students.
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find()
      .populate('student', 'name')
      .sort({ points: -1 });
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Generate an adaptive learning path for the student.
 */
exports.getAdaptivePath = async (req, res) => {
  try {
    const path = await adaptivePathEngine.generatePath(req.user);
    res.json(path);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};