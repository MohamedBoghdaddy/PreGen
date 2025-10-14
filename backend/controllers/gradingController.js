const Assignment = require('../models/assignmentModel');
const Leaderboard = require('../models/leaderboardModel');
const aiGrader = require('../utils/aiGrader');

/**
 * Generic grading function that can be reused outside teacher context.
 * Expects assignmentId in the body.
 */
exports.gradeAssignment = async (req, res) => {
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
        let entry = await Leaderboard.findOne({ student: submission.student });
        if (!entry) {
          entry = new Leaderboard({ student: submission.student, points: 0 });
        }
        entry.points += score;
        await entry.save();
      }
    }
    await assignment.save();
    res.json({ message: 'Assignment graded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};