const express = require('express');
const controller = require('../controllers/assistantController');

const router = express.Router();
router.get('/health', controller.health);
router.post('/chat', controller.chat);
router.post('/command', controller.command);

module.exports = router;
