const Leaderboard = require('../models/leaderboardModel');

/**
 * Retrieve a leaderboard sorted by points. Optionally filter by class or subject.
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