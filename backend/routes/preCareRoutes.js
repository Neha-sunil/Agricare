const express = require('express');
const router = express.Router();
const preCareController = require('../controllers/PreCareController');

// Define Routes
router.post('/profile', preCareController.saveProfile);
router.post('/recommend-crops', preCareController.recommendCrops);
router.post('/select-crop', preCareController.selectCrop);
router.post('/generate-plan', preCareController.generatePlan);
router.post('/generate-tasks', preCareController.generateTasks);

router.get('/dashboard/:farmerProfileId', preCareController.getDashboard);
router.patch('/task/:taskId', preCareController.updateTask);

router.post('/voice-query', preCareController.voiceQuery);

module.exports = router;
