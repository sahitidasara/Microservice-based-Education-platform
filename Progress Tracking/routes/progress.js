const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress');

router.get('/user/:userId', progressController.getUserProgress);
router.post('/register', progressController.registerCourse);
router.post('/', progressController.updateProgress);
router.delete('/', progressController.dropCourse);
router.get('/course/:courseId', progressController.getCourseProgress);
router.post('/init', progressController.initProgress);

module.exports = router;