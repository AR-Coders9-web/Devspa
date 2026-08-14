const { chatAssistant, executeAssistantAction } = require('../services/assistantService');

const health = (_req, res) => res.json({ success: true, provider: 'gemini' });

const chat = async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ success: false, error: 'Message is required.' });
    const result = await chatAssistant({
      message,
      history: req.body?.history,
      context: req.body?.context,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('[assistant/chat]', error);
    return res.status(error.status || 500).json({ success: false, error: error.message || 'Assistant request failed.' });
  }
};

const command = async (req, res) => {
  try {
    const result = await executeAssistantAction({ action: req.body?.action, context: req.body?.context });
    return res.json(result);
  } catch (error) {
    console.error('[assistant/command]', error);
    return res.status(error.status || 500).json({ success: false, error: error.message || 'Assistant action failed.' });
  }
};

module.exports = { health, chat, command };
