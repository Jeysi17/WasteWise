const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedulesController');

// Schedules routes
router.get('/schedules', schedulesController.getSchedules);
router.post('/schedules', schedulesController.createSchedule);
router.delete('/schedules/:id', schedulesController.deleteSchedule);
router.patch('/schedules/:id/complete', schedulesController.completeSchedule);
router.post('/schedules/:id/remind', schedulesController.sendReminder);
router.post('/register-device', schedulesController.registerDevice);

module.exports = router;