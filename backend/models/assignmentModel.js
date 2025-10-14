const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: String,
    score: Number,
    graded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    materials: [String],
    submissions: [submissionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);