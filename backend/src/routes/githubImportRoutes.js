const express = require('express');
const {
  importGithubRepository,
  getGithubWorkspace,
  clearGithubWorkspace,
  saveWorkspace,
  getWorkspaceFile,
  deleteWorkspaceFile,
  commitGithubRepository,
} = require('../controllers/githubImportController');

const router = express.Router();

// Workspace identity is established inside the controller so existing frontend
// URLs and route contracts remain unchanged during this migration.
router.post('/import', importGithubRepository);
router.get('/workspace/:workspaceId', getGithubWorkspace);
router.delete('/workspace', clearGithubWorkspace);
router.put('/workspace', saveWorkspace);
router.get('/workspace/:workspaceId/file', getWorkspaceFile);
router.delete('/workspace/:workspaceId/file', deleteWorkspaceFile);
router.post('/commit', commitGithubRepository);
module.exports = router;
