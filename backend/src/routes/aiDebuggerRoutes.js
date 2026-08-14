const express = require('express');
const controller = require('../controllers/aiDebuggerController');

const router = express.Router();

router.get('/health', controller.health);
router.post('/analyze', controller.analyze);
router.post('/chat', controller.chat);
router.post('/apply-fix', controller.applyFix);

module.exports = router;
