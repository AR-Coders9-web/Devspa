const path = require('path');
const pty = require('node-pty');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const sessions = new Map();
const MAX_TERMINALS = 10;

const getShell = () => {
  if (process.platform === 'win32') {
    return {
      file: process.env.DEVSPA_TERMINAL_SHELL || 'powershell.exe',
      args: ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass']
    };
  }
  return { file: process.env.SHELL || '/bin/bash', args: ['-i'] };
};

const normalizeSize = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(2, Math.floor(number)) : fallback;
};

const createTerminal = ({ id, cwd, send }) => {
  if (sessions.has(id)) return sessions.get(id);
  if (sessions.size >= MAX_TERMINALS) throw new Error('Maximum terminal sessions reached.');

  const safeCwd = path.resolve(cwd);
  const shell = getShell();
  const terminal = pty.spawn(shell.file, shell.args, {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: safeCwd,
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor', FORCE_COLOR: '1', TERM_PROGRAM: 'DEVSPA' },
    useConpty: process.platform === 'win32'
  });

  const session = { id, cwd: safeCwd, pty: terminal, send, createdAt: Date.now() };
  sessions.set(id, session);

  terminal.onData((data) => send({ type: 'output', data }));
  terminal.onExit(({ exitCode, signal }) => {
    send({ type: 'exit', code: exitCode, signal: signal || null });
    sessions.delete(id);
  });
  send({ type: 'ready', cwd: safeCwd, shell: shell.file });
  return session;
};

const writeToTerminal = (id, data) => {
  const session = sessions.get(id);
  if (!session) return false;
  try { session.pty.write(data); return true; }
  catch (error) { session.send({ type: 'error', message: error.message }); return false; }
};

const resizeTerminal = (id, cols, rows) => {
  const session = sessions.get(id);
  if (!session) return false;
  try { session.pty.resize(normalizeSize(cols, 120), normalizeSize(rows, 30)); return true; }
  catch (error) { session.send({ type: 'error', message: error.message }); return false; }
};

const destroyTerminal = (id) => {
  const session = sessions.get(id);
  if (!session) return;
  sessions.delete(id);
  try { session.pty.kill(); } catch {}
};

const destroyTerminalsForWorkspace = async (workspacePath) => {
  const target = path.resolve(workspacePath);
  const processes = [];

  for (const [id, session] of sessions) {
    const cwd = path.resolve(session.cwd);

    if (
      cwd === target ||
      cwd.startsWith(`${target}${path.sep}`)
    ) {
      sessions.delete(id);

      const pid = session.pty?.pid;

      try {
        session.pty.kill();
      } catch {}

      if (process.platform === 'win32' && pid) {
        processes.push(
          execFileAsync(
            'taskkill',
            [
              '/PID',
              String(pid),
              '/T',
              '/F'
            ],
            {
              windowsHide: true
            }
          ).catch(() => {})
        );
      }
    }
  }

  await Promise.all(processes);

  // Give Windows a moment to release filesystem handles.
  await new Promise((resolve) =>
    setTimeout(resolve, 300)
  );

  return true;
};
const destroyAllTerminals = () => {
  for (const id of [...sessions.keys()]) destroyTerminal(id);
};

process.on('SIGINT', destroyAllTerminals);
process.on('SIGTERM', destroyAllTerminals);

module.exports = {
  createTerminal,
  writeToTerminal,
  resizeTerminal,
  destroyTerminal,
  destroyTerminalsForWorkspace,
  destroyAllTerminals
};
