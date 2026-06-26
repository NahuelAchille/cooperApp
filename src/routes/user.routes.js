const express = require('express');
const router = express.Router();
const registerController = require('../controllers/register.controller');
const userController = require('../controllers/user.controller');

router.post('/register', registerController.registerCooperativa);
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.get('/me', userController.me);

module.exports = router;
