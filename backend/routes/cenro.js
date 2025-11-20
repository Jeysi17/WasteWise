const express = require('express');
const router = express.Router();
const cenroController = require('../controllers/cenroController');

// CENRO-specific analytics and overview routes
router.get('/cenro/analytics', cenroController.getCenroAnalytics);
router.get('/cenro/dashboard-stats', cenroController.getCenroDashboardStats);
router.get('/cenro/waste-management', cenroController.getWasteManagementOverview);
router.get('/cenro/complaint-management', cenroController.getComplaintManagementOverview);
router.get('/cenro/user-management', cenroController.getUserManagementOverview);
router.get('/cenro/export-data', cenroController.exportCenroData);

module.exports = router;