const express = require('express');
const {
  startGithubAuth,
  githubCallback,
  getCurrentUser,
  logout
} = require('../controllers/githubAuthController');

const router = express.Router();
router.get('/github', startGithubAuth);
router.get('/github/callback', githubCallback);
router.get('/me', getCurrentUser);
router.post('/logout', logout);
module.exports = router;
