const Assignment = require('../models/assignmentModel');
const Leaderboard = require('../models/leaderboardModel');
const aiGrader = require('../utils/aiGrader');

/**
 * Create a new assignment. Expects title, description and dueDate in body.
 */
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const assignment = new Assignment({
      title,
      description,
      dueDate,
      teacher: req.user._id,
    });
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Upload materials to an existing assignment. Accepts assignmentId and an array of material URLs.
 */
exports.uploadMaterials = async (req, res) => {
  try {
    const { assignmentId, materials } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    assignment.materials.push(...materials);
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Grade all ungraded submissions for a given assignment. Calculates scores via aiGrader.
 */
exports.gradeSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    for (const submission of assignment.submissions) {
      if (!submission.graded) {
        const score = await aiGrader.grade(submission.answers);
        submission.score = score;
        submission.graded = true;
        // update leaderboard
        let entry = await Leaderboard.findOne({ student: submission.student });
        if (!entry) {
          entry = new Leaderboard({ student: submission.student, points: 0 });
        }
        entry.points += score;
        await entry.save();
      }
    }
    await assignment.save();
    res.json({ message: 'Submissions graded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Compute basic statistics for assignments created by the logged in teacher.
 */
exports.getStatistics = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user._id });
    const stats = assignments.map((assignment) => {
      const scores = assignment.submissions
        .filter((s) => s.graded)
        .map((s) => s.score);
      const averageScore =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;
      return {
        assignmentId: assignment._id,
        title: assignment.title,
        averageScore,
        submissions: scores.length,
      };
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get global leaderboard for teacher view.
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