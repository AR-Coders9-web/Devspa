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
router.post('/import', importGithubRepository);
router.get('/workspace/:workspaceId', getGithubWorkspace);
router.delete('/workspace', clearGithubWorkspace);
router.put('/workspace', saveWorkspace);
router.get('/workspace/:workspaceId/file', getWorkspaceFile);
router.delete('/workspace/:workspaceId/file', deleteWorkspaceFile);
router.post('/commit', commitGithubRepository);
module.exports = router;
