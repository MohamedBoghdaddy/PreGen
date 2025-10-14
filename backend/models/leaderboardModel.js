const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: { type: Number, default: 0 },
    subject: String,
    className: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leaderboard', leaderboardSchema);