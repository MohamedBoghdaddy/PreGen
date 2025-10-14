const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const studentController = require('../controllers/studentController');

// All student routes require authentication and student role
router.use(protect);
router.use(authorize('student'));

// Get list of assignments for the student
router.get('/assignments', studentController.getAssignments);
// Submit assignment
router.post('/assignments/submit', studentController.submitAssignment);
// Get student's results
router.get('/results', studentController.getResults);
// Get leaderboard
router.get('/leaderboard', studentController.getLeaderboard);
// Get adaptive learning path
router.get('/adaptive', studentController.getAdaptivePath);

module.exports = router;