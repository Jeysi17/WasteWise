const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');

// Posts routes
router.get('/pendings', postsController.getPendings);
router.post('/approve/:id', postsController.approvePost);
router.post('/solve-pending-with-remarks/:id', postsController.solvePendingWithRemarks);
router.post('/solve/:id', postsController.solvePost);
router.get('/solved-posts', postsController.getSolvedPosts);
router.get('/approved', postsController.getApprovedPosts);
router.delete('/decline/:id', postsController.declinePost);

module.exports = router;