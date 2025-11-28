const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// CENRO Admin Auth Routes
router.post('cenro/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getMe);
router.post('/auth/logout', authController.logout);

// Barangay Admin Auth Routes
router.post('/brgy/auth/register', authController.brgyRegister);
router.post('/brgy/auth/login', authController.brgyLogin);
router.get('/brgy/auth/me', authController.brgyGetMe);
router.post('/brgy/auth/logout', authController.brgyLogout);

module.exports = router;