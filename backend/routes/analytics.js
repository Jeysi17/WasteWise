const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController.js');

// Analytics routes
router.post('/waste-entries', analyticsController.addWasteEntry);
router.post('/kpis', analyticsController.upsertKPIs);
router.get('/analytics/summary', analyticsController.getAnalyticsSummary);
router.get('/analytics/periods', analyticsController.getPeriods);
router.get('/stats/total-complaints', analyticsController.getTotalComplaints);
router.get('/stats/complaints', analyticsController.getComplaints);
router.get('/stats/solved', analyticsController.getSolved);
router.get('/waste-entries/export', analyticsController.exportWasteEntries);

module.exports = router;