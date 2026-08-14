const { buildWorkspaceContext } = require('../services/workspaceContextService');
const { parseErrorOutput, buildDebuggerPrompt } = require('../services/debuggerService');
const { analyzeDebugger, chatDebugger, getModel } = require('../services/aiDebuggerService');
const { applyTextPatch } = require('../utils/sanitizePatch');

const getWorkspaceForRequest = async (req) => {
  const workspaceId = req.body?.workspaceId || req.session?.workspaceId;

  if (!workspaceId) {
    throw Object.assign(new Error('Workspace ID is required.'), { status: 400 });
  }

  return workspaceId;
};

const analyze = async (req, res) => {
  try {
    const workspaceId = await getWorkspaceForRequest(req);
    const output = String(
      req.body?.terminalOutput || req.body?.error?.rawOutput || ''
    ).slice(-12000);

    const suppliedError =
      req.body?.error && typeof req.body.error === 'object'
        ? req.body.error
        : null;

    const error = suppliedError || parseErrorOutput(output);

    if (!error?.message) {
      return res.status(400).json({
        success: false,
        message: 'Debugger error information is required.',
      });
    }

    const workspaceContext = await buildWorkspaceContext({
      workspaceId,
      files: req.body?.files,
      currentFile: req.body?.currentFile || error.file || '',
    });

    const prompt = buildDebuggerPrompt({
      error,
      workspaceContext,
      userMessage: req.body?.message,
    });

    const analysis = await analyzeDebugger({ prompt });

    // Normalize Gemini's structured response into the exact contract the
    // frontend debugger consumes. Gemini's schema is:
    // { summary, rootCause, confidence, explanation, fix: { file, oldCode, newCode, reason }, needsMoreContext }
    // Keeping this normalization on the server prevents UI-specific parsing
    // assumptions from breaking the safe patch flow.
    const fix = analysis?.fix && typeof analysis.fix === 'object'
      ? analysis.fix
      : null;

    const finding = fix
      ? {
          file: String(fix.file || ''),
          line: Number(error?.line || 0),
          column: Number(error?.column || 0),
          severity: String(error?.type || 'warning'),
          message: String(
            analysis?.summary ||
            analysis?.rootCause ||
            analysis?.explanation ||
            'AI identified a possible issue.'
          ),
          reason: String(fix.reason || ''),
          confidence: Number(analysis?.confidence || 0),
          needsMoreContext: Boolean(analysis?.needsMoreContext),
          codeBefore: String(fix.oldCode || ''),
          codeAfter: String(fix.newCode || ''),
        }
      : null;

    return res.json({
      success: true,
      model: getModel(),
      analysis,
      finding,
      error,
      context: {
        workspaceId: workspaceContext.workspaceId,
        currentFile: workspaceContext.currentFile,
        filesIncluded: workspaceContext.files.map((file) => file.path),
      },
    });
  } catch (error) {
    console.error('AI debugger analyze error:', error);
    const status = Number(error.status) || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Debugger analysis failed.',
    });
  }
};

const chat = async (req, res) => {
  try {
    const workspaceId = await getWorkspaceForRequest(req);
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    const suppliedError =
      req.body?.error && typeof req.body.error === 'object'
        ? req.body.error
        : null;

    const error = suppliedError || null;

    // Load the actual imported repository files.
    const workspaceContext = await buildWorkspaceContext({
      workspaceId,
      currentFile: req.body?.currentFile || error?.file || '',
    });

    const context = {
      error,
      currentFile: req.body?.currentFile || error?.file || null,
      workspace: workspaceContext,
    };

    const answer = await chatDebugger({
      history: req.body?.history,
      message,
      context,
    });

    return res.json({
      success: true,
      model: getModel(),
      message: answer,
      workspaceId,
      context: {
        filesIncluded: workspaceContext.files.map((file) => file.path),
      },
    });
  } catch (error) {
    console.error('AI debugger chat error:', error);

    const status = Number(error.status) || 500;

    return res.status(status).json({
      success: false,
      message: error.message || 'Debugger chat failed.',
    });
  }
};

const applyFix = async (req, res) => {
  try {
    const workspaceId = await getWorkspaceForRequest(req);
    const context = await buildWorkspaceContext({ workspaceId });

    const result = await applyTextPatch({
      workspacePath: context.workspacePath,
      file: req.body?.file,
      oldCode: req.body?.oldCode,
      newCode: req.body?.newCode,
    });

    return res.json({
      success: true,
      message: 'Fix applied successfully.',
      ...result,
    });
  } catch (error) {
    console.error('AI debugger apply fix error:', error);
    const status = Number(error.status) || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Could not apply fix.',
    });
  }
};

const health = async (_req, res) => {
  res.json({
    success: true,
    service: 'devspa-ai-debugger',
    provider: 'gemini',
    model: getModel(),
    configured: Boolean(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    ),
  });
};

module.exports = { analyze, chat, applyFix, health };
