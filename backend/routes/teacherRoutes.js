const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const teacherController = require('../controllers/teacherController');

// All teacher routes require authentication and teacher role
router.use(protect);
router.use(authorize('teacher'));

// Create a new assignment
router.post('/assignments', teacherController.createAssignment);
// Upload materials to an assignment
router.put('/assignments/materials', teacherController.uploadMaterials);
// Grade submissions for an assignment
router.post('/assignments/grade', teacherController.gradeSubmissions);
// View class statistics
router.get('/statistics', teacherController.getStatistics);
// View leaderboard
router.get('/leaderboard', teacherController.getLeaderboard);

module.exports = router;