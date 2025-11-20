const express = require('express');
const router = express.Router();
const barangayController = require('../controllers/barangayController');
const { requireBarangay } = require('../middleware/auth');

// Apply barangay middleware to all routes
router.use(requireBarangay);

// Barangay-specific routes
router.get('/brgy/pendings', barangayController.getBarangayPendings);
router.get('/brgy/schedules', barangayController.getBarangaySchedules);
router.post('/brgy/schedules', barangayController.createBarangaySchedule);
router.delete('/brgy/schedules/:id', barangayController.deleteBarangaySchedule);
router.post('/brgy/waste-entries', barangayController.addBarangayWasteEntry);
router.post('/brgy/complaints', barangayController.addBarangayComplaint);
router.get('/brgy/analytics/summary', barangayController.getBarangayAnalyticsSummary);
router.get('/brgy/analytics/monthly', barangayController.getBarangayMonthlyAnalytics);
router.get('/brgy/stats/complaints', barangayController.getBarangayComplaintStats);
router.get('/brgy/solved-posts', barangayController.getBarangaySolvedPosts);
router.delete('/brgy/decline/:id', barangayController.declineBarangayPending);
router.post('/brgy/waste-entries/bulk', barangayController.bulkWasteEntries);
router.post('/brgy/complaints/bulk', barangayController.bulkComplaints);

module.exports = router;