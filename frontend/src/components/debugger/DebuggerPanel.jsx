import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://127.0.0.1:5000'
).replace(/\/$/, '');

const DEMO_ERROR = {
  type: 'TypeError',
  message: "Cannot read properties of undefined (reading 'name')",
  file: 'src/App.jsx',
  line: 42,
  column: 18,
  command: 'npm run dev',
  time: 'Just now',
  severity: 'error',
  codeBefore: 'const name = user.name;',
  codeAfter: 'const name = user?.name;',
  stack: [
    { file: 'src/App.jsx', line: 42, function: 'handleSubmit' },
    { file: 'src/components/Form.jsx', line: 18, function: 'onSubmit' },
    { file: 'src/main.jsx', line: 7, function: 'render' },
  ],
};

const cx = (...items) => items.filter(Boolean).join(' ');

/**
 * React must never receive a raw AI object as a child.
 * Gemini may return fix/code/message fields as either strings or objects,
 * so normalize all user/AI supplied display values at the UI boundary.
 */
const toDisplayText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item)).filter(Boolean).join('\\n');
  }

  if (typeof value === 'object') {
    const preferred =
      value.newCode ??
      value.code ??
      value.codeAfter ??
      value.content ??
      value.message ??
      value.summary ??
      value.explanation ??
      value.text ??
      value.value;

    if (preferred !== undefined && preferred !== value) {
      return toDisplayText(preferred, fallback);
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return fallback;
    }
  }

  return String(value);
};

const safeJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      success: false,
      message: text || `Request failed with status ${response.status}.`,
    };
  }
};

const fetchWorkspaceFiles = async (workspaceId) => {
  if (!workspaceId) return [];

  const response = await fetch(
    `${API_BASE}/api/github/workspace/${encodeURIComponent(
      workspaceId
    )}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    }
  );

  const result = await safeJson(response);

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Failed to load workspace files.'
    );
  }

  return Array.isArray(result.files)
    ? result.files
    : Array.isArray(result.workspace?.files)
      ? result.workspace.files
      : [];
};

const STORAGE_PREFIX = 'devspa-debugger:';

const readStored = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {}
};

const removeStored = (key) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {}
};

const extractAnalysisText = (analysis) => {
  if (!analysis) return '';
  if (typeof analysis === 'object') {
    return toDisplayText(
      analysis.message ??
        analysis.summary ??
        analysis.explanation ??
        analysis.analysis ??
        analysis
    );
  }
  return toDisplayText(analysis);
};

const Icon = ({ children, className = '' }) => (
  <span className={cx('inline-flex items-center justify-center', className)}>
    {children}
  </span>
);


const getFilePath = (file) => {
  if (!file) return '';
  if (typeof file === 'string') return file.replace(/^\/+/, '');
  return String(file.path || file.name || file.file || file.relativePath || '').replace(/^\/+/, '');
};

const getFileContent = (file) => {
  if (!file || typeof file === 'string') return '';
  return String(
    file.content ??
      file.text ??
      file.source ??
      file.code ??
      file.contents ??
      ''
  );
};

const normalizeWorkspaceFiles = (payload) => {
  const candidates = [
    payload?.files,
    payload?.workspace?.files,
    payload?.workspace?.tree,
    payload?.tree,
    payload?.repository?.files,
    payload?.repository?.tree,
  ];

  const rawCollections = candidates.filter(Array.isArray);

  // Some GitHub responses expose `files` as a flat list while `tree` contains
  // the real repository paths. Merge every available collection instead of
  // stopping at the first one so directory hierarchy and source content are
  // both preserved.
  const raw = rawCollections.flat();

  const result = [];
  const walk = (items, prefix = '') => {
    items.forEach((item) => {
      if (typeof item === 'string') {
        const path = item.replace(/^\/+/, '');
        if (path) result.push({ path, content: '' });
        return;
      }

      if (!item || typeof item !== 'object') return;

      const name = String(item.name || item.path || '').replace(/^\/+/, '');
      const isDirectory =
        item.type === 'tree' ||
        item.type === 'directory' ||
        item.type === 'dir' ||
        item.isDirectory === true ||
        Array.isArray(item.children);

      const path = name.includes('/')
        ? name
        : [prefix, name].filter(Boolean).join('/');

      if (isDirectory && Array.isArray(item.children)) {
        walk(item.children, path);
        return;
      }

      if (!isDirectory && path) {
        result.push({
          path,
          content: getFileContent(item),
          language: item.language || item.lang || '',
        });
      }
    });
  };

  walk(raw);

  const unique = new Map();
  result.forEach((file) => {
    if (!file.path) return;
    const existing = unique.get(file.path);
    if (!existing || (!existing.content && file.content)) {
      unique.set(file.path, file);
    }
  });

  return [...unique.values()].sort((a, b) =>
    a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' })
  );
};

const languageFromPath = (path = '') => {
  const ext = path.split('.').pop()?.toLowerCase();
  return {
    js: 'JavaScript',
    jsx: 'React JSX',
    ts: 'TypeScript',
    tsx: 'React TSX',
    css: 'CSS',
    html: 'HTML',
    json: 'JSON',
    md: 'Markdown',
    py: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    h: 'C/C++ Header',
    sh: 'Shell',
  }[ext] || 'Text';
};

const iconForPath = (path = '', folder = false) => {
  if (folder) return '▾';
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'js' || ext === 'jsx') return 'JS';
  if (ext === 'ts' || ext === 'tsx') return 'TS';
  if (ext === 'css') return '◉';
  if (ext === 'html') return '◇';
  if (ext === 'json') return '{}';
  if (ext === 'md') return 'M';
  return '·';
};

const buildFileTree = (files) => {
  const root = { name: '', path: '', folder: true, children: [] };

  files.forEach((file) => {
    const parts = file.path.split('/').filter(Boolean);
    let node = root;

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join('/');
      const folder = index < parts.length - 1;
      let child = node.children.find((item) => item.name === part);

      if (!child) {
        child = {
          name: part,
          path,
          folder,
          children: folder ? [] : undefined,
          file: folder ? undefined : file,
        };
        node.children.push(child);
      }

      node = child;
    });
  });

  const sort = (node) => {
    node.children?.sort((a, b) => {
      if (a.folder !== b.folder) return a.folder ? -1 : 1;
      // GitHub-like deterministic ordering: folders first, then names.
      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
    node.children?.forEach(sort);
  };

  sort(root);
  return root.children;
};


const parseAiFinding = (analysis) => {
  if (!analysis) return null;

  // Gemini/backend responses can wrap the actual finding several different ways.
  if (typeof analysis === 'object') {
    const candidate =
      analysis.finding ||
      analysis.error ||
      analysis.issue ||
      analysis.result?.finding ||
      analysis.result?.error ||
      analysis.analysis?.finding ||
      analysis.analysis?.error ||
      analysis;

    if (candidate && typeof candidate === 'object') {
      const fix =
        candidate.fix && typeof candidate.fix === 'object'
          ? candidate.fix
          : null;

      const file =
        candidate.file ||
        candidate.path ||
        candidate.filename ||
        candidate.filePath ||
        fix?.file ||
        '';

      const line = Number(
        candidate.line ||
          candidate.lineNumber ||
          candidate.location?.line ||
          candidate.position?.line ||
          0,
      );

      const codeBefore = toDisplayText(
        candidate.codeBefore ??
          candidate.before ??
          candidate.oldCode ??
          fix?.oldCode ??
          fix?.before ??
          fix?.codeBefore ??
          '',
      );

      const codeAfter = toDisplayText(
        candidate.codeAfter ??
          candidate.after ??
          candidate.newCode ??
          (typeof candidate.fix === 'string'
            ? candidate.fix
            : fix?.newCode ??
              fix?.after ??
              fix?.codeAfter ??
              fix?.code ??
              ''),
      );

      const message = toDisplayText(
        candidate.message ??
          candidate.summary ??
          candidate.explanation ??
          candidate.description ??
          candidate.analysis ??
          'AI found a possible issue.',
      );

      if (file || line || codeBefore || codeAfter) {
        return {
          file: String(file || ''),
          line: Number.isFinite(line) ? line : 0,
          column: Number(candidate.column || candidate.location?.column || 0) || 0,
          severity: toDisplayText(candidate.severity, 'warning'),
          message,
          reason: toDisplayText(fix?.reason || candidate.reason || '', ''),
          confidence: Number(candidate.confidence || 0),
          needsMoreContext: Boolean(candidate.needsMoreContext),
          codeBefore,
          codeAfter,
        };
      }
    }
  }

  const text =
    typeof analysis === 'object'
      ? toDisplayText(
          analysis.analysis ??
            analysis.message ??
            analysis.summary ??
            analysis.explanation ??
            analysis.text ??
            analysis,
        )
      : toDisplayText(analysis);
  const filePatterns = [
    /['"`]([^'"`\n]+\.(?:jsx?|tsx?|css|html|json|py|java|c|cpp|md))['"`]/i,
    /\b((?:src|app|components|pages|public|lib|utils|services)\/[A-Za-z0-9_./-]+\.(?:jsx?|tsx?|css|html|json|py|java|c|cpp|md))\b/i,
    /\b([A-Za-z0-9_.-]+\.(?:jsx?|tsx?|css|html|json|py|java|c|cpp|md))\b/i,
  ];

  let file = '';
  for (const pattern of filePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      file = match[1].replace(/^\.?\//, '');
      break;
    }
  }

  const lineMatch =
    text.match(/\bline\s*(?:number\s*)?[:#]?\s*(\d+)\b/i) ||
    text.match(/:(\d+)(?::\d+)?\b/);

  const line = lineMatch ? Number(lineMatch[1]) : 0;

  // Recover a simple unified diff when the backend returned text instead
  // of a structured finding.
  let codeBefore = '';
  let codeAfter = '';
  const diffBlocks = text.match(/```(?:diff|patch)?\s*([\s\S]*?)```/gi) || [];
  const patchText = diffBlocks.length
    ? diffBlocks[0].replace(/^```(?:diff|patch)?\s*/i, '').replace(/```$/i, '')
    : text;

  const removed = [];
  const added = [];
  patchText.split(/\r?\n/).forEach((rawLine) => {
    if (/^---\s/.test(rawLine) || /^\+\+\+\s/.test(rawLine)) return;
    if (/^-\s?/.test(rawLine)) removed.push(rawLine.replace(/^-\s?/, ''));
    if (/^\+\s?/.test(rawLine)) added.push(rawLine.replace(/^\+\s?/, ''));
  });
  if (removed.length) codeBefore = removed.join('\n');
  if (added.length) codeAfter = added.join('\n');

  // Common prose fallback: "X should be Y" / "change X to Y".
  if (!codeBefore || !codeAfter) {
    const proseFix =
      text.match(/(?:change|replace|correct|update)\s+[`'\"]([^`'\"]+)[`'\"]\s+(?:to|with)\s+[`'\"]([^`'\"]+)[`'\"]/i) ||
      text.match(/[`'\"]([^`'\"]+)[`'\"]\s+(?:should be|must be)\s+[`'\"]([^`'\"]+)[`'\"]/i);
    if (proseFix) {
      codeBefore ||= proseFix[1];
      codeAfter ||= proseFix[2];
    }
  }

  if (!file && !line && !codeBefore && !codeAfter) return null;

  return {
    file,
    line,
    column: 0,
    severity: 'warning',
    message:
      text.split(/\n+/).map((item) => item.trim()).find(Boolean)?.slice(0, 240) ||
      'AI found a possible issue.',
    codeBefore,
    codeAfter,
  };
};

const requestWorkspaceFiles = async (workspaceId) => {
  if (!workspaceId) return [];

  // These are intentionally best-effort. A missing endpoint must not break
  // the debugger; the UI will simply show the workspace tree as unavailable.
  const endpoints = [
    `${API_BASE}/api/github/workspace/${encodeURIComponent(workspaceId)}`,
    `${API_BASE}/api/github/workspace/${encodeURIComponent(workspaceId)}/files`,
    `${API_BASE}/api/github/workspace/${encodeURIComponent(workspaceId)}/tree`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) continue;

      const result = await safeJson(response);
      const files = normalizeWorkspaceFiles(result);
      if (files.length) return files;
    } catch {
      // Ignore optional tree endpoints.
    }
  }

  return [];
};

export default function DebuggerPanel({
  error = null,
  onRunAgain,
  onClear,
  onOpenFile,
  onApplyFix,
  onSendMessage,
  onRepositoryImport,
  onCommit,
  openRequest = null,
  className = '',
}) {
  const [tab, setTab] = useState('overview');
  const [status, setStatus] = useState(error ? 'error' : 'ready');
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState('');
  const [showFix, setShowFix] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [repository, setRepository] = useState(null);
  const [workspaceId, setWorkspaceId] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [originalWorkspaceFiles, setOriginalWorkspaceFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [changedLines, setChangedLines] = useState({});
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('Fix: apply AI debugger patch');
  const [commitError, setCommitError] = useState('');
  const [commitSuccess, setCommitSuccess] = useState('');
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesUnavailable, setFilesUnavailable] = useState(false);
  const [aiFinding, setAiFinding] = useState(null);
  const [fixPreview, setFixPreview] = useState(null);
  const [fixSuccess, setFixSuccess] = useState(false);

  const data = error?.message ? error : null;

  const displayData = data || {
    ...DEMO_ERROR,
    message: repository
      ? 'Repository imported. Run the project to capture a real runtime error.'
      : 'No runtime error captured yet.',
    file: repository ? 'Waiting for runtime error…' : DEMO_ERROR.file,
    line: repository ? '-' : DEMO_ERROR.line,
    column: repository ? '-' : DEMO_ERROR.column,
    codeBefore: repository
      ? 'Run the imported workspace to capture the failing source line.'
      : DEMO_ERROR.codeBefore,
    codeAfter: repository
      ? 'DEVSPA will show the AI-generated correction here.'
      : DEMO_ERROR.codeAfter,
    stack: repository ? [] : DEMO_ERROR.stack,
    severity: repository ? 'info' : DEMO_ERROR.severity,
    time: repository ? 'Imported' : DEMO_ERROR.time,
  };

  useEffect(() => {
    const saved = readStored('workspace');
    if (saved) {
      if (saved.repository) setRepository(saved.repository);
      if (saved.workspaceId) setWorkspaceId(String(saved.workspaceId));
      if (Array.isArray(saved.workspaceFiles)) setWorkspaceFiles(saved.workspaceFiles);
      if (Array.isArray(saved.originalWorkspaceFiles)) {
        setOriginalWorkspaceFiles(saved.originalWorkspaceFiles);
      }
      if (saved.selectedFile) setSelectedFile(saved.selectedFile);
      if (saved.aiAnalysis) setAiAnalysis(saved.aiAnalysis);
      if (saved.aiFinding) setAiFinding(saved.aiFinding);
      if (saved.changedLines) setChangedLines(saved.changedLines);
      if (Array.isArray(saved.chat)) setChat(saved.chat);
      if (saved.tab) setTab(saved.tab);
    }
    setRestoredFromStorage(true);
  }, []);

  useEffect(() => {
    if (!restoredFromStorage) return;
    writeStored('workspace', {
      repository,
      workspaceId,
      workspaceFiles,
      originalWorkspaceFiles,
      selectedFile,
      changedLines,
      aiAnalysis,
      aiFinding,
      chat,
      tab,
      savedAt: Date.now(),
    });
  }, [
    restoredFromStorage,
    repository,
    workspaceId,
    workspaceFiles,
    originalWorkspaceFiles,
    selectedFile,
    changedLines,
    aiAnalysis,
    aiFinding,
    chat,
    tab,
  ]);

  const dirtyFiles = useMemo(() => {
    const original = new Map(
      originalWorkspaceFiles.map((file) => [file.path, String(file.content || '')])
    );
    return workspaceFiles.filter(
      (file) => String(file.content || '') !== (original.get(file.path) ?? '')
    );
  }, [workspaceFiles, originalWorkspaceFiles]);

  const dirtyCount = dirtyFiles.length;

  const filteredFiles = useMemo(() => {
    const query = fileSearch.trim().toLowerCase();
    if (!query) return workspaceFiles;
    return workspaceFiles.filter((file) =>
      file.path.toLowerCase().includes(query)
    );
  }, [workspaceFiles, fileSearch]);

  const activeFile = useMemo(() => {
    const normalizePath = (value = '') =>
      String(value).replace(/^\.\//, '').replace(/^\/+/, '');

    const selected = normalizePath(selectedFile);
    const display = normalizePath(displayData.file);

    return (
      workspaceFiles.find((file) => normalizePath(file.path) === selected) ||
      workspaceFiles.find((file) => normalizePath(file.path) === display) ||
      workspaceFiles.find(
        (file) =>
          normalizePath(file.path).endsWith(`/${selected}`) ||
          selected.endsWith(`/${normalizePath(file.path)}`)
      ) ||
      null
    );
  }, [workspaceFiles, selectedFile, displayData.file]);

  useEffect(() => {
    if (!aiFinding?.file || !workspaceFiles.length) return;
    const target = aiFinding.file.replace(/^\.\//, '');
    const match = workspaceFiles.find(
      (file) =>
        file.path === target ||
        file.path.endsWith(`/${target}`) ||
        target.endsWith(`/${file.path}`)
    );
    if (match && selectedFile !== match.path) setSelectedFile(match.path);
  }, [aiFinding, workspaceFiles, selectedFile]);

  const timeline = useMemo(
    () => [
      {
        label: repository ? 'Repository imported' : 'Error detected',
        meta: repository
          ? repository.fullName || repository.name || 'GitHub repository'
          : displayData?.time || 'Waiting',
        state: repository ? 'done' : data ? 'error' : 'ready',
      },
      {
        label: 'Workspace context',
        meta: workspaceId ? `Workspace ${workspaceId}` : 'Waiting',
        state: workspaceId ? 'done' : 'ready',
      },
      {
        label: 'AI analysis',
        meta: aiAnalysis ? 'Analysis ready' : 'Ready',
        state: aiAnalysis ? 'done' : 'ready',
      },
      {
        label: 'Fix verification',
        meta: status === 'fixing' ? 'Applying patch…' : 'Waiting',
        state: status === 'fixing' ? 'active' : 'ready',
      },
    ],
    [repository, workspaceId, aiAnalysis, displayData?.time, data, status]
  );

  const handleClear = async () => {
    setStatus('running');
    setFixSuccess(false);
    setAiError('');

    try {
      if (workspaceId) {
        const response = await fetch(`${API_BASE}/api/github/workspace`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId }),
        });

        const result = await safeJson(response);
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to clear workspace.');
        }
      }

      setRepository(null);
      setWorkspaceId('');
      setWorkspaceFiles([]);
      setSelectedFile('');
      setFileSearch('');
      setFilesUnavailable(false);
      setAiAnalysis('');
      setAiFinding(null);
      setFixPreview(null);
      setChat([]);
      setMessage('');
      setImportError('');
      setShowFix(false);
      setTab('overview');
      setStatus('ready');

      await onClear?.();
    } catch (err) {
      setAiError(err?.message || 'Failed to clear workspace.');
      setStatus('error');
    }
  };

  const runAgain = async () => {
    setFixSuccess(false);
    setStatus('running');
    try {
      await onRunAgain?.();
      setStatus(error?.message ? 'error' : 'ready');
    } catch {
      setStatus('error');
    }
  };

  const applyFix = async () => {
    setFixSuccess(false);
    setStatus('fixing');
    setAiError('');
    setCommitError('');
    setCommitSuccess('');

    try {
      const normalizePath = (value = '') =>
        String(value).replace(/^\.\//, '').replace(/^\/+/, '');

      const payload = {
        ...displayData,
        ...(aiFinding || {}),
        ...(fixPreview || {}),
        aiAnalysis,
        workspaceId,
        repository,
        file:
          fixPreview?.file ||
          aiFinding?.file ||
          displayData.file ||
          activeFile?.path ||
          '',
      };

      if (!workspaceId) {
        throw new Error('Workspace ID is missing. Import the repository again before applying a fix.');
      }

      const targetPath = normalizePath(payload.file);
      const targetFile =
        workspaceFiles.find((file) => normalizePath(file.path) === targetPath) ||
        workspaceFiles.find(
          (file) =>
            normalizePath(file.path).endsWith(`/${targetPath}`) ||
            targetPath.endsWith(`/${normalizePath(file.path)}`)
        ) ||
        activeFile;

      if (!targetFile?.path) {
        throw new Error(`Could not find ${payload.file || 'the target file'} in the workspace.`);
      }

      // Never patch from stale React state. The backend is the source of truth.
      const latestResponse = await fetch(
        `${API_BASE}/api/github/workspace/${encodeURIComponent(workspaceId)}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );
      const latestResult = await safeJson(latestResponse);

      if (!latestResponse.ok || !latestResult.success) {
        throw new Error(
          latestResult.message || 'Could not refresh the workspace before applying the fix.'
        );
      }

      const latestFiles = normalizeWorkspaceFiles(latestResult);
      const latestTarget =
        latestFiles.find((file) => normalizePath(file.path) === targetPath) ||
        latestFiles.find(
          (file) =>
            normalizePath(file.path).endsWith(`/${targetPath}`) ||
            targetPath.endsWith(`/${normalizePath(file.path)}`)
        );

      if (!latestTarget?.path) {
        throw new Error(`The target file ${payload.file || targetPath} no longer exists in the workspace.`);
      }

      setWorkspaceFiles(latestFiles);
      const currentContent = String(latestTarget.content ?? '');

      const before = toDisplayText(
        fixPreview?.codeBefore ??
          aiFinding?.codeBefore ??
          ''
      );
      const after = toDisplayText(
        fixPreview?.codeAfter ??
          aiFinding?.codeAfter ??
          displayData.codeAfter ??
          ''
      );

      if (!after.trim()) {
        throw new Error('Gemini returned a fix without replacement code.');
      }

      let oldCode = before;
      let newCode = after;
      let appliedLine = Number(payload.line || 0);

      // Prefer an exact snippet replacement. If the AI returned only the
      // replacement line, derive the old line from the loaded workspace.
      if (!oldCode && appliedLine > 0) {
        const fileLines = currentContent.split(/\r?\n/);
        const index = appliedLine - 1;
        if (index >= 0 && index < fileLines.length) {
          oldCode = fileLines[index];
        }
      }

      if (!oldCode || !currentContent.includes(oldCode)) {
        throw new Error(
          'Gemini returned a fix, but the original code could not be matched safely in the loaded file.'
        );
      }

      // Apply the same patch on the backend workspace. The backend validates
      // the path and requires exactly one oldCode occurrence before writing.
      const response = await fetch(`${API_BASE}/api/ai/debugger/apply-fix`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          file: latestTarget.path,
          oldCode,
          newCode,
        }),
      });

      const result = await safeJson(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to apply the AI fix on the backend workspace.');
      }

      // Keep the in-memory editor state synchronized with the backend file.
      const nextContent = currentContent.replace(oldCode, newCode);
      if (nextContent === currentContent) {
        throw new Error('The backend reported success, but no local source change was detected.');
      }

      const updatedFile = {
        ...latestTarget,
        content: nextContent,
        modified: true,
        isModified: true,
        status: 'modified',
      };

      setWorkspaceFiles((files) =>
        files.map((file) =>
          normalizePath(file.path) === normalizePath(latestTarget.path)
            ? updatedFile
            : file
        )
      );

      if (appliedLine <= 0) {
        const beforeOffset = currentContent.indexOf(oldCode);
        appliedLine = beforeOffset >= 0
          ? currentContent.slice(0, beforeOffset).split(/\r?\n/).length
          : 0;
      }

      if (appliedLine > 0) {
        setChangedLines((current) => ({
          ...current,
          [latestTarget.path]: appliedLine,
        }));
      }

      setSelectedFile(latestTarget.path);

      const updatePayload = {
        ...payload,
        file: latestTarget.path,
        oldCode,
        newCode,
        oldContent: currentContent,
        content: nextContent,
        updatedContent: nextContent,
        newContent: nextContent,
        line: appliedLine || payload.line,
        backendResult: result,
      };

      if (onApplyFix) {
        await onApplyFix(updatePayload);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('devspa:debugger-file-updated', {
            detail: updatePayload,
          })
        );
      }

      // Successful backend patch: remove the stale finding/fix UI and show
      // an explicit success state. The actual runtime can be verified with Run.
      setFixPreview(null);
      setShowFix(false);
      setAiFinding(null);
      setAiError('');
      setFixSuccess(true);
      setStatus('success');
    } catch (err) {
      setAiError(err?.message || 'Failed to apply the AI fix.');
      setStatus('error');
    }
  };

  const commitChanges = async () => {
    if (!workspaceId || !dirtyFiles.length || commitLoading) return;

    setCommitLoading(true);
    setCommitError('');
    setCommitSuccess('');

    try {
      const changes = dirtyFiles.map((file) => ({
        path: file.path,
        content: String(file.content || ''),
        originalContent: String(
          originalWorkspaceFiles.find((item) => item.path === file.path)?.content || ''
        ),
      }));

      const repoUrl =
        repository?.htmlUrl ||
        repository?.html_url ||
        repository?.url ||
        (repository?.fullName ? `https://github.com/${repository.fullName}` : '');

      if (!repoUrl) throw new Error('Repository URL is missing.');

      const payload = {
        repoUrl,
        branch: repository?.defaultBranch || repository?.default_branch || 'main',
        message: commitMessage.trim() || 'Fix: apply AI debugger patch',
        files: changes.map(({ path, content }) => ({ path, content })),
        workspaceId,
      };

      let result;
      if (onCommit) {
        result = await onCommit(payload);
      } else {
        const response = await fetch(`${API_BASE}/api/github/commit`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await safeJson(response);
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to commit changes to GitHub.');
        }
      }

      if (result?.success === false) {
        throw new Error(result.message || 'GitHub commit failed.');
      }

      setOriginalWorkspaceFiles(workspaceFiles.map((file) => ({ ...file })));
      setChangedLines({});
      setCommitSuccess(
        result?.commit?.sha
          ? `Committed · ${String(result.commit.sha).slice(0, 7)}`
          : 'Changes committed to GitHub.'
      );
    } catch (err) {
      setCommitError(err?.message || 'Unable to commit changes.');
    } finally {
      setCommitLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || aiLoading) return;

    setMessage('');
    setChat((items) => [...items, { role: 'user', content: text }]);

    try {
      setAiLoading(true);
      setAiError('');

      try {
        const response = await fetch(`${API_BASE}/api/ai/debugger/chat`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: workspaceId || undefined,
            files: workspaceFiles,
            message: text,
            history: chat.map((item) => ({
              role: item.role,
              content: item.content,
            })),
            error: data || undefined,
            currentFile: activeFile?.path || data?.file || undefined,
            currentFileContent: activeFile?.content || undefined,
          }),
        });

        const result = await safeJson(response);

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'AI debugger chat failed.');
        }

        setChat((items) => [
          ...items,
          {
            role: 'assistant',
            content: result.message || 'AI response received.',
          },
        ]);
      } catch (backendError) {
        if (onSendMessage) {
          const fallback = await onSendMessage(text);
          if (fallback) {
            setChat((items) => [
              ...items,
              {
                role: 'assistant',
                content:
                  typeof fallback === 'string'
                    ? fallback
                    : fallback.message ||
                      fallback.content ||
                      'Analysis received.',
              },
            ]);
            return;
          }
        }
        throw backendError;
      }
    } catch (err) {
      setAiError(err?.message || 'Unable to contact the AI debugger.');
      setChat((items) => [
        ...items,
        {
          role: 'assistant',
          content: err?.message || 'Unable to contact the AI debugger.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const validateGithubUrl = (url) => {
    const match = String(url || '')
      .trim()
      .match(
        /^https:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\/)?(?:[#?].*)?$/
      );

    if (!match) return null;

    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  };

  const analyzeWorkspace = async (
  nextWorkspaceId,
  importedRepo
) => {
  if (!nextWorkspaceId) return;

  setAiLoading(true);
  setFixSuccess(false);
  setAiError('');
  setAiAnalysis('');

  try {
    // 1. Fetch the real imported workspace
    const workspaceFiles =
      await fetchWorkspaceFiles(nextWorkspaceId);

    if (!workspaceFiles.length) {
      throw new Error(
        'Workspace was imported, but no files were found.'
      );
    }

    // 2. Send complete workspace to AI
    const analysisError = data || {
      type: 'RepositoryAnalysis',
      message:
        'Repository imported successfully. Inspect the workspace for build, runtime, dependency, and obvious code issues. Do not invent an error that is not present.',
      file: '',
      line: 0,
      column: 0,
      severity: 'info',
      command: 'Repository import',
      time: new Date().toISOString(),
    };

    const response = await fetch(
      `${API_BASE}/api/ai/debugger/analyze`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: nextWorkspaceId,

          error: analysisError,

          currentFile:
            analysisError.file || '',

          message: `Analyze the imported GitHub repository ${
            importedRepo?.fullName || ''
          }. Focus on real bugs, build/runtime problems, dependency issues, and safe fixes. If there is no confirmed bug, clearly say that instead of inventing one.`,

          // 🔥 THIS WAS MISSING
          files: workspaceFiles,
        }),
      }
    );

    const result = await safeJson(response);

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
          'AI repository analysis failed.'
      );
    }

    const analysisSource = result.analysis ?? result;
    const text = extractAnalysisText(analysisSource);
    const finding =
      parseAiFinding(result.finding) ||
      parseAiFinding(analysisSource) ||
      parseAiFinding(result.error) ||
      parseAiFinding(result.issue);

    setAiAnalysis(
      text || 'Gemini returned an empty analysis.'
    );

    // Keep the structured finding separately so Review/Apply can target
    // the actual workspace file instead of only showing the analysis text.
    setAiFinding(finding);

    if (finding?.file) {
      const normalizedTarget = String(finding.file)
        .replace(/^\.\//, '')
        .replace(/^\/+/, '');

      const matchedFile = workspaceFiles.find(
        (file) =>
          file.path === normalizedTarget ||
          file.path.endsWith(`/${normalizedTarget}`) ||
          normalizedTarget.endsWith(`/${file.path}`),
      );

      if (matchedFile) setSelectedFile(matchedFile.path);
    }

    setTab('overview');
  } catch (err) {
    console.error(
      'Debugger AI analysis error:',
      err
    );

    setAiError(
      err?.message ||
        'AI analysis failed.'
    );
  } finally {
    setAiLoading(false);
  }
};

  // Bridge Explorer -> Debugger. The desktop shell keeps one workspace, while
  // this panel keeps its own editable/debug state for fast local interactions.
useEffect(() => {
  if (!openRequest?.nonce) return;

  const incomingFiles = Array.isArray(openRequest.files)
    ? normalizeWorkspaceFiles({ files: openRequest.files })
    : [];

  const incomingRepository = openRequest.repository || null;

  const nextWorkspaceId = String(
    openRequest.workspaceId ||
      incomingRepository?.workspaceId ||
      ''
  );

  // A debugger instance belongs to exactly one workspace. Never merge files
  // from a previous repository into a newly opened repository. This is
  // especially important when the new request arrives without its file tree
  // and the tree has to be fetched asynchronously.
  const workspaceChanged =
    Boolean(nextWorkspaceId) &&
    Boolean(workspaceId) &&
    String(nextWorkspaceId) !== String(workspaceId);

  if (workspaceChanged) {
    setRepository(null);
    setWorkspaceId('');
    setWorkspaceFiles([]);
    setOriginalWorkspaceFiles([]);
    setSelectedFile('');
    setFileSearch('');
    setFilesUnavailable(false);
    setAiAnalysis('');
    setAiFinding(null);
    setChangedLines({});
    setFixPreview(null);
  }

  const focusFile =
    typeof openRequest.file === 'string'
      ? openRequest.file
      : openRequest.file?.path ||
        openRequest.file?.name ||
        '';

  if (incomingRepository) {
    setRepository((current) => ({
      ...current,
      ...incomingRepository,
    }));
  }

  if (nextWorkspaceId) {
    setWorkspaceId(nextWorkspaceId);
  }

  if (incomingFiles.length) {
    setWorkspaceFiles(incomingFiles);

    setOriginalWorkspaceFiles(
      incomingFiles.map((file) => ({ ...file }))
    );

    setFilesUnavailable(false);
  }

  if (focusFile) {
    const normalizedFocus = String(focusFile).replace(/^\/+/, '').replace(/^\.\//, '');
    const matchingFile = incomingFiles.find((file) => {
      const filePath = String(file.path || '').replace(/^\/+/, '').replace(/^\.\//, '');
      return (
        filePath === normalizedFocus ||
        filePath.endsWith(`/${normalizedFocus}`) ||
        normalizedFocus.endsWith(`/${filePath}`)
      );
    });

    setSelectedFile(matchingFile?.path || normalizedFocus);
  }

  setTab('overview');

  // 🔥 Async work ko separate function mein rakho
  const loadWorkspaceFiles = async () => {
    if (!nextWorkspaceId || incomingFiles.length) return;

    setFilesLoading(true);

    try {
      const fetched = await requestWorkspaceFiles(nextWorkspaceId);

      if (fetched.length) {
        setWorkspaceFiles(fetched);

        setOriginalWorkspaceFiles(
          fetched.map((file) => ({ ...file }))
        );

        setSelectedFile((current) => {
          if (current) {
            const normalizedCurrent = String(current).replace(/^\/+/, '').replace(/^\.\//, '');
            const match = fetched.find((file) => {
              const filePath = String(file.path || '').replace(/^\/+/, '').replace(/^\.\//, '');
              return (
                filePath === normalizedCurrent ||
                filePath.endsWith(`/${normalizedCurrent}`) ||
                normalizedCurrent.endsWith(`/${filePath}`)
              );
            });
            if (match) return match.path;
          }
          return fetched[0]?.path || '';
        });

        setFilesUnavailable(false);
      } else {
        setFilesUnavailable(true);
      }
    } catch (error) {
      console.error('Failed to load workspace files:', error);
      setFilesUnavailable(true);
    } finally {
      setFilesLoading(false);
    }
  };

  loadWorkspaceFiles();

  if (openRequest.analyze && nextWorkspaceId) {
    analyzeWorkspace(
      nextWorkspaceId,
      incomingRepository,
      focusFile
    );
  }
}, [openRequest]);

  const handleImportRepository = async (event) => {
    event.preventDefault();

    const url = repoUrl.trim();
    setImportError('');

    if (!url) {
      setImportError('Please enter a GitHub repository URL.');
      return;
    }

    const parsed = validateGithubUrl(url);

    if (!parsed) {
      setImportError(
        'Invalid GitHub URL. Example: https://github.com/owner/repository'
      );
      return;
    }

    setImportLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/github/import`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      });

      const result = await safeJson(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to import GitHub repository.'
        );
      }

      const importedRepository = result.repository || {
        fullName: `${parsed.owner}/${parsed.repo}`,
        name: parsed.repo,
      };

      const nextWorkspaceId =
        result.workspaceId ||
        result.workspace?.id ||
        result.workspace?.workspaceId ||
        '';

      setRepository(importedRepository);
      setWorkspaceId(String(nextWorkspaceId || ''));
      setShowImport(false);
      setRepoUrl('');

      const importedFiles = normalizeWorkspaceFiles(result);
      if (importedFiles.length) {
        setWorkspaceFiles(importedFiles);
        setSelectedFile(importedFiles[0].path);
        setFilesUnavailable(false);
      } else if (nextWorkspaceId) {
        setFilesLoading(true);
        const fetchedFiles = await requestWorkspaceFiles(String(nextWorkspaceId));
        setWorkspaceFiles(fetchedFiles);
        setSelectedFile(fetchedFiles[0]?.path || '');
        setFilesUnavailable(fetchedFiles.length === 0);
        setFilesLoading(false);
      }

      onRepositoryImport?.(result);

      if (nextWorkspaceId) {
        await analyzeWorkspace(String(nextWorkspaceId), importedRepository);
      } else {
        setAiError(
          'Repository imported, but the backend did not return a workspaceId.'
        );
      }
    } catch (err) {
      setImportError(
        err?.message || 'Unable to import this GitHub repository.'
      );
    } finally {
      setImportLoading(false);
    }
  };

  const openImport = () => {
    setRepoUrl('');
    setImportError('');
    setShowImport(true);
  };

  const closeImport = () => {
    if (importLoading) return;
    setRepoUrl('');
    setImportError('');
    setShowImport(false);
  };

  const currentFile = activeFile?.path || selectedFile || displayData.file || 'No file selected';

  const openWorkspaceFile = (file) => {
    const path = typeof file === 'string' ? file : file?.path;
    if (!path) return;
    setSelectedFile(path);
    onOpenFile?.(path, path === displayData.file ? displayData.line : undefined);
  };

  return (
    <section
      className={cx(
        'flex h-full min-h-0 flex-col overflow-hidden bg-[#07090c] text-white',
        className
      )}
    >
      {/* IDE TOP BAR */}
      <header className="flex h-12 shrink-0 items-center border-b border-white/[0.07] bg-[#0b0d11]">
        <div className="flex h-full items-center gap-3 px-3">
          <div className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-[12px]">
            ◇
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold">Debugger</span>
              <StatusPill status={status} />
            </div>
          </div>
        </div>

        <div className="ml-auto flex h-full items-center gap-1 px-2">
          <button
            onClick={openImport}
            className="cursor-pointer rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            ◈ Import GitHub
          </button>
          <button
            onClick={runAgain}
            disabled={status === 'running' || status === 'fixing'}
            className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] text-white/50 hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
          >
            ▶ Run
          </button>
          <button
            onClick={() => data && !fixSuccess && setShowFix(true)}
            disabled={!data || fixSuccess}
            className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] text-emerald-300/70 hover:bg-emerald-400/[0.07] disabled:opacity-25"
          >
            ✦ Fix
          </button>

          <button
            onClick={commitChanges}
            disabled={commitLoading || !workspaceId || dirtyCount === 0}
            className="cursor-pointer rounded-md border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-35"
            title={
              !workspaceId
                ? 'Import a GitHub repository first'
                : dirtyCount === 0
                  ? 'No changes to commit'
                  : `Commit ${dirtyCount} changed file${dirtyCount === 1 ? '' : 's'} to GitHub`
            }
          >
            {commitLoading ? 'Committing…' : dirtyCount > 0 ? `✓ Commit ${dirtyCount}` : 'Commit'}
          </button>
          <button
            onClick={handleClear}
            className="cursor-pointer rounded-md px-3 py-1.5 text-[11px] text-white/35 hover:bg-red-400/[0.07] hover:text-red-300"
          >
            Clear
          </button>
        </div>
      </header>

      {/* WORKSPACE BAR */}
      <div className="flex h-9 shrink-0 items-center border-b border-white/[0.06] bg-[#090b0f] px-3">
        <div className="flex min-w-0 items-center gap-2 text-[10px] text-white/35">
          <span className="text-white/20">DEBUG</span>
          <span>/</span>
          <span className="truncate text-white/55">
            {repository?.fullName || 'No repository imported'}
          </span>
          {workspaceId && (
            <>
              <span>/</span>
              <span className="font-mono text-white/25">{workspaceId}</span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/25">
            <i
              className={cx(
                'h-1.5 w-1.5 rounded-full',
                aiLoading ? 'bg-amber-400' : 'bg-emerald-400'
              )}
            />
            {aiLoading ? 'AI working' : 'AI ready'}
          </span>
          <span className="text-[9px] text-white/20">
            {displayData.command || 'Runtime'}
          </span>
        </div>
      </div>

      {/* IDE BODY */}
      <div className="grid min-h-0 flex-1 grid-cols-[250px_minmax(0,1fr)_410px] overflow-hidden">
        {/* LEFT EXPLORER */}
        <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#090b0f]">
          <div className="flex h-10 items-center border-b border-white/[0.06] px-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Explorer
            </span>
            <span className="ml-auto text-[9px] text-white/20">
              {workspaceFiles.length || 0}
            </span>
          </div>

          <div className="border-b border-white/[0.06] p-2">
            <div className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-black/20 px-2">
              <span className="text-[10px] text-white/20">⌕</span>
              <input
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                placeholder="Search files"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[10px] text-white/65 outline-none placeholder:text-white/20"
              />
              {fileSearch && (
                <button
                  onClick={() => setFileSearch('')}
                  className="text-[10px] text-white/20 hover:text-white/60"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {!repository && (
              <EmptyExplorer
                title="No workspace"
                text="Import a GitHub repository to browse its real files."
              />
            )}

            {repository && filesLoading && (
              <div className="space-y-1 p-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="h-6 animate-pulse rounded bg-white/[0.03]"
                  />
                ))}
              </div>
            )}

            {repository && !filesLoading && workspaceFiles.length > 0 && (
              <FileTree
                nodes={buildFileTree(filteredFiles)}
                selectedFile={selectedFile}
                onSelect={openWorkspaceFile}
              />
            )}

            {repository && !filesLoading && workspaceFiles.length === 0 && (
              <div className="m-2 rounded-lg border border-amber-400/10 bg-amber-400/[0.025] p-3">
                <div className="text-[9px] font-medium text-amber-200/65">
                  Files not available
                </div>
                <div className="mt-1 text-[9px] leading-4 text-white/25">
                  The repository imported successfully, but the backend did not
                  return a file tree/content endpoint.
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] p-2">
            <div className="mb-1 px-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Debug
            </div>
            {[
              ['overview', '●', 'Overview'],
              ['timeline', '◷', 'Timeline'],
              ['fix', '✦', 'AI Fix'],
            ].map(([key, icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cx(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[9px]',
                  tab === key
                    ? 'bg-white/[0.07] text-white/75'
                    : 'text-white/30 hover:bg-white/[0.04] hover:text-white/60'
                )}
              >
                <span className="w-3 text-center">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER CODE / ERROR */}
        <main className="flex min-w-0 min-h-0 flex-col overflow-hidden bg-[#0a0c10]">
          <div className="flex h-10 shrink-0 items-center border-b border-white/[0.06] bg-[#0c0f14]">
            <div className="flex min-w-0 items-center gap-2 px-3">
              <span className="text-[9px] text-white/20">
                {iconForPath(currentFile)}
              </span>
              <span className="max-w-[420px] truncate text-[10px] text-white/65">
                {currentFile}
              </span>
              {activeFile && (
                <span className="text-[8px] text-white/20">
                  {languageFromPath(activeFile.path)}
                </span>
              )}
              {data && currentFile === data.file && (
                <span className="rounded border border-red-400/15 bg-red-400/[0.06] px-1.5 py-0.5 text-[8px] text-red-300/60">
                  ERROR
                </span>
              )}
              {aiFinding && currentFile === aiFinding.file && (
                <span className="rounded border border-amber-400/15 bg-amber-400/[0.06] px-1.5 py-0.5 text-[8px] text-amber-300/60">
                  AI FINDING
                </span>
              )}
            </div>

            <div className="ml-auto flex items-center gap-3 px-3 text-[8px] text-white/20">
              {activeFile ? (
                <>
                  <span>Ln {data && currentFile === data.file ? data.line : 1}</span>
                  <span>Spaces: 2</span>
                  <span>UTF-8</span>
                </>
              ) : (
                <span>Select a file</span>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {activeFile ? (
              <EditorSurface
                file={activeFile}
                  changedLine={changedLines[activeFile.path] || 0}
                error={
                  data && currentFile === data.file
                    ? data
                    : aiFinding &&
                        (aiFinding.file === activeFile.path ||
                          activeFile.path.endsWith(`/${aiFinding.file}`) ||
                          aiFinding.file.endsWith(`/${activeFile.path}`))
                      ? aiFinding
                      : null
                }
                onOpenFile={onOpenFile}
              />
            ) : (
              <EditorWelcome
                repository={repository}
                filesUnavailable={filesUnavailable}
                onImport={openImport}
              />
            )}
          </div>

          <div className="shrink-0 border-t border-white/[0.07] bg-[#090b0f]">
            <div className="flex h-8 items-center gap-4 border-b border-white/[0.05] px-3">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-white/35">
                Problems
              </span>
              <span className="text-[9px] text-white/20">Terminal</span>
              <span className="text-[9px] text-white/20">Output</span>
              <span className="ml-auto flex items-center gap-1.5 text-[8px] text-white/25">
                <i
                  className={cx(
                    'h-1.5 w-1.5 rounded-full',
                    data ? 'bg-red-400' : 'bg-emerald-400'
                  )}
                />
                {data ? '1 error' : '0 problems'}
              </span>
            </div>
            <div className="max-h-12 overflow-auto px-3 py-2 font-mono text-[9px] text-white/30">
              {data
                ? `${data.file}:${data.line}:${data.column || 1} — ${data.message}`
                : aiFinding
                  ? `${aiFinding.file || 'AI finding'}${aiFinding.line ? `:${aiFinding.line}` : ''} — ${toDisplayText(aiFinding.message)}`
                  : repository
                    ? 'Workspace ready. Run the project to capture runtime errors.'
                    : 'DEVSPA debugger is waiting for a workspace.'}
            </div>
          </div>
        </main>

        {/* RIGHT AI */}
        <aside className="flex min-h-0 flex-col border-l border-white/[0.06] bg-[#080a0e]">
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-white/80">
                  AI Debugger
                </span>
                <span className="rounded border border-emerald-400/15 bg-emerald-400/[0.06] px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-emerald-300/60">
                  Gemini
                </span>
              </div>
              <div className="mt-0.5 text-[9px] text-white/25">
                Repository-aware code analysis
              </div>
            </div>
            <span
              className={cx(
                'h-1.5 w-1.5 rounded-full',
                aiLoading ? 'bg-amber-400' : 'bg-emerald-400'
              )}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">

            {repository && (
              <div className="mb-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.025] p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[8px] font-semibold uppercase tracking-widest text-emerald-300/55">
                      Uncommitted changes
                    </div>
                    <div className="mt-1 text-[9px] text-white/35">
                      {dirtyCount} edited file{dirtyCount === 1 ? '' : 's'} ready for GitHub
                    </div>
                  </div>
                  <span className="rounded border border-emerald-400/15 bg-emerald-400/[0.06] px-1.5 py-0.5 text-[8px] text-emerald-300/60">
                    LOCAL
                  </span>
                </div>
                <input
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message"
                  className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-[9px] text-white/65 outline-none placeholder:text-white/20 focus:border-white/20"
                />
                <button
                  onClick={commitChanges}
                  disabled={commitLoading || !workspaceId}
                  className="mt-2 w-full rounded-md bg-emerald-300 py-1.5 text-[9px] font-semibold text-black hover:bg-emerald-200 disabled:opacity-35"
                >
                  {commitLoading ? 'Committing to GitHub…' : 'Commit edited files'}
                </button>
                {commitError && (
                  <div className="mt-2 text-[9px] leading-4 text-red-300/70">{commitError}</div>
                )}
                {commitSuccess && (
                  <div className="mt-2 text-[9px] leading-4 text-emerald-300/70">{commitSuccess}</div>
                )}
              </div>
            )}

            {repository && (
              <div className="mb-3 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.025] p-2.5">
                <div className="text-[8px] font-semibold uppercase tracking-widest text-emerald-300/45">
                  Workspace
                </div>
                <div className="mt-1 truncate text-[10px] text-white/60">
                  {repository.fullName || repository.name}
                </div>
                <button
                  onClick={() =>
                    workspaceId && analyzeWorkspace(workspaceId, repository)
                  }
                  disabled={!workspaceId || aiLoading}
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/[0.04] py-1.5 text-[9px] text-white/55 hover:bg-white/[0.08] disabled:opacity-30"
                >
                  {aiLoading ? 'Analyzing workspace…' : 'Analyze with AI'}
                </button>
              </div>
            )}

            {aiError && (
              <div className="mb-3 rounded-lg border border-red-400/15 bg-red-400/[0.05] p-2.5 text-[10px] leading-4 text-red-200/70">
                {aiError}
              </div>
            )}

            {fixSuccess && (
              <div className="mb-3 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/15 text-[11px] text-emerald-300">
                    ✓
                  </span>
                  <div>
                    <div className="text-[10px] font-semibold text-emerald-200">
                      Fix applied successfully
                    </div>
                    <div className="mt-0.5 text-[9px] leading-4 text-emerald-200/55">
                      The fix is now in the local workspace. Run again to verify the error is resolved.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {chat.length === 0 && !aiAnalysis && (
              <div className="mb-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="mb-2 text-[9px] uppercase tracking-widest text-white/25">
                  Quick actions
                </div>
                {[
                  'Explain this error',
                  'Find the root cause',
                  'Suggest the safest fix',
                  'Inspect this repository',
                ].map((item) => (
                  <button
                    key={item}
                    onClick={() => setMessage(item)}
                    className="mb-1 block w-full rounded-md px-2 py-1.5 text-left text-[10px] text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                  >
                    {item}
                    <span className="float-right text-white/15">→</span>
                  </button>
                ))}
              </div>
            )}

            {chat.map((item, index) => (
              <div
                key={index}
                className={cx(
                  'mb-2 rounded-lg border p-2.5 text-[10px] leading-5',
                  item.role === 'user'
                    ? 'ml-8 border-white/10 bg-white/[0.06] text-white/65'
                    : 'mr-3 border-white/[0.06] bg-white/[0.025] text-white/55'
                )}
              >
                {toDisplayText(item.content)}
              </div>
            ))}

            {aiFinding && !fixSuccess && (
            <div className="mb-3 overflow-hidden rounded-lg border border-amber-400/15 bg-amber-400/[0.025]">
              <div className="flex items-center gap-2 border-b border-amber-400/[0.08] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-200/60">
                  AI finding
                </span>
                {aiFinding.file && (
                  <span className="ml-auto max-w-[150px] truncate font-mono text-[8px] text-white/25">
                    {aiFinding.file}{aiFinding.line ? `:${aiFinding.line}` : ''}
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="text-[10px] leading-5 text-white/55">
                  {toDisplayText(aiFinding.message)}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
               onClick={() => {
  if (aiFinding?.file) {
    const target = workspaceFiles.find(
      (file) =>
        file.path === aiFinding.file ||
        file.path.endsWith(`/${aiFinding.file}`)
    );

    setSelectedFile(target?.path || aiFinding.file);
  }

  setFixPreview({
    file: aiFinding?.file || activeFile?.path || displayData.file,
    line: aiFinding?.line || displayData.line,
    message: toDisplayText(
      aiFinding?.message ||
                      (aiFinding?.reason ? aiFinding.reason : '') ||
                      aiAnalysis ||
                      'AI analysis completed.',
    ),
    codeBefore: toDisplayText(
      aiFinding?.codeBefore ?? displayData.codeBefore ?? '',
    ),
    codeAfter: toDisplayText(
      aiFinding?.codeAfter ?? displayData.codeAfter ?? '',
    ),
  });

  setShowFix(true);
}}
                  >
                    Review fix
                  </button>
                  {aiFinding.file && (
                    <button
                      onClick={() => {
                        const target = workspaceFiles.find(
                          (file) =>
                            file.path === aiFinding.file ||
                            file.path.endsWith(`/${aiFinding.file}`)
                        );
                        if (target) setSelectedFile(target.path);
                      }}
                      className="cursor-pointer rounded-md border border-white/10 px-2.5 py-1.5 text-[9px] text-white/40 hover:bg-white/[0.05]"
                    >
                      Open file
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {aiAnalysis && (
              <div className="mb-2 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.025] p-2.5">
                <div className="mb-2 text-[8px] font-semibold uppercase tracking-widest text-emerald-300/50">
                  Gemini analysis
                </div>
                <div className="whitespace-pre-wrap text-[10px] leading-5 text-white/55">
                  {toDisplayText(aiAnalysis)}
                </div>
              </div>
            )}

            {data && !fixSuccess && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-widest text-white/25">
                    Suggested patch
                  </span>
                  <span className="text-[8px] text-emerald-300/50">
                    Safe preview
                  </span>
                </div>

                <div className="overflow-hidden rounded border border-white/[0.05] bg-black/20 font-mono text-[9px] leading-5">
                  <div className="border-b border-white/[0.04] px-2 py-1.5 text-white/25">
                    {data.file}:{data.line}
                  </div>
                  <div className="bg-red-400/[0.04] px-2 text-red-300/70">
                    − {toDisplayText(aiFinding?.codeBefore ?? data?.codeBefore ?? 'AI is preparing the original code.')}
                  </div>
                  <div className="bg-emerald-400/[0.04] px-2 text-emerald-300/75">
                    + {toDisplayText(aiFinding?.codeAfter ?? data?.codeAfter ?? 'Ask Gemini for a concrete patch before applying.')}
                  </div>
                </div>

                <button
                  onClick={() => setShowFix(true)}
                  className="mt-2 w-full rounded-md bg-white py-1.5 text-[9px] font-semibold text-black hover:bg-white/85"
                >
                  Review & Apply Fix
                </button>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-white/[0.06] p-2.5">
            <div className="flex items-end gap-2 rounded-lg border border-white/10 bg-black/20 p-1.5 focus-within:border-white/20">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={2}
                placeholder={
                  workspaceId
                    ? 'Ask AI about this code…'
                    : 'Import a repository first…'
                }
                className="min-h-[38px] flex-1 resize-none bg-transparent px-2 py-1 text-[10px] leading-4 text-white outline-none placeholder:text-white/20"
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || aiLoading}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-black disabled:opacity-25"
              >
                ↑
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between px-1 text-[8px] text-white/15">
              <span>Enter to send</span>
              <span>DEVSPA AI</span>
            </div>
          </div>
        </aside>
      </div>

      {/* IMPORT MODAL */}
      {showImport && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[#0b0e13] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Import GitHub Repository</h3>
                <p className="mt-0.5 text-[9px] text-white/25">
                  Create a workspace and analyze it with Gemini.
                </p>
              </div>
              <button
                onClick={closeImport}
                disabled={importLoading}
                className="text-white/30 hover:text-white disabled:opacity-30"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportRepository} className="p-4">
              <label className="mb-2 block text-[9px] font-semibold uppercase tracking-widest text-white/30">
                Repository URL
              </label>

              <input
                autoFocus
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={importLoading}
                className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 font-mono text-[10px] text-white outline-none placeholder:text-white/20 focus:border-white/25"
              />

              {importError && (
                <div className="mt-2 rounded-lg border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-[10px] leading-4 text-red-200/75">
                  {importError}
                </div>
              )}

              <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-[9px] leading-4 text-white/30">
                GitHub → workspace → runtime context → Gemini.
                <br />
                The Gemini API key remains on the backend.
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeImport}
                  disabled={importLoading}
                  className="cursor-pointer rounded-md border border-white/10 px-3 py-2 text-[10px] text-white/45 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !repoUrl.trim()}
                  className="cursor-pointer rounded-md bg-white px-3 py-2 text-[10px] font-semibold text-black disabled:opacity-35"
                >
                  {importLoading ? 'Importing…' : 'Import & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX MODAL */}
      {showFix && (
        <div className="fixed inset-0 z-[999] grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-[#0b0e13] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Review AI Fix</h3>
                <p className="mt-0.5 text-[9px] text-white/25">
                  {displayData.file}:{displayData.line}
                </p>
              </div>
              <button
                onClick={() => setShowFix(false)}
                className="cursor-pointer text-white/35 hover:text-white"
              >
                ✕
              </button>
            </div>

            <FixPreview
              error={{
                ...displayData,
                ...(aiFinding || {}),
                ...(fixPreview || {}),
                file:
                  fixPreview?.file ||
                  aiFinding?.file ||
                  displayData.file,
                line:
                  fixPreview?.line ||
                  aiFinding?.line ||
                  displayData.line,
                message: toDisplayText(
                  fixPreview?.message ??
                    aiFinding?.message ??
                    displayData.message ??
                    '',
                ),
                codeBefore: toDisplayText(
                  fixPreview?.codeBefore ??
                    aiFinding?.codeBefore ??
                    displayData.codeBefore ??
                    '',
                ),
                codeAfter: toDisplayText(
                  fixPreview?.codeAfter ??
                    aiFinding?.codeAfter ??
                    displayData.codeAfter ??
                    '',
                ),
              }}
              disabled={!data && !aiFinding}
            />

            <div className="flex justify-end gap-2 border-t border-white/[0.07] p-3">
              <button
                onClick={() => setShowFix(false)}
                className="cursor-pointer rounded-md border border-white/10 px-3 py-2 text-[10px] text-white/45"
              >
                Cancel
              </button>
              <button
                onClick={applyFix}
                disabled={!data && !aiFinding}
                className="cursor-pointer rounded-md bg-white px-3 py-2 text-[10px] font-semibold text-black disabled:opacity-35"
              >
                Apply Fix
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }) {
  const label =
    status === 'error'
      ? 'ERROR'
      : status === 'running'
        ? 'RUNNING'
        : status === 'fixing'
          ? 'FIXING'
          : status === 'success'
            ? 'SOLVED'
            : 'READY';

  return (
    <span
      className={cx(
        'rounded-full border px-1.5 py-0.5 text-[8px] font-semibold tracking-wider',
        status === 'error'
          ? 'border-red-400/20 bg-red-400/10 text-red-300'
          : status === 'running' || status === 'fixing'
            ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
            : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
      )}
    >
      {label}
    </span>
  );
}

function ExplorerItem({ icon, label, folder = false, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px]',
        active
          ? 'bg-red-400/[0.07] text-red-200'
          : 'text-white/35 hover:bg-white/[0.04] hover:text-white/60'
      )}
    >
      <span className="w-4 text-center text-[8px] text-white/20">
        {folder ? '⌄' : icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function EditorWelcome({ repository, filesUnavailable, onImport }) {
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/30">
          ◇
        </div>
        <h3 className="mt-4 text-sm font-semibold text-white/65">
          {repository ? 'Workspace imported' : 'Debugger workspace'}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[10px] leading-5 text-white/25">
          {filesUnavailable
            ? 'GitHub imported the repository, but the backend has not exposed its file tree yet. Connect the workspace files endpoint and the real source will appear here.'
            : 'Choose a file from Explorer to inspect the source, runtime error, stack trace and AI correction in one place.'}
        </p>
        {!repository && (
          <button
            onClick={onImport}
            className="mt-4 rounded-md bg-white px-3 py-2 text-[10px] font-semibold text-black hover:bg-white/85"
          >
            Import GitHub Repository
          </button>
        )}
      </div>
    </div>
  );
}

function EditorSurface({ file, error, changedLine = 0, onOpenFile }) {
  const content = String(file?.content ?? '');
  const rawLines = content.split(/\r?\n/);
  const lines = rawLines.length ? rawLines : [''];
  const errorLine = Number(error?.line) > 0 ? Number(error.line) : -1;
  const fixedLine = Number(changedLine) > 0 ? Number(changedLine) : -1;

  // Render the complete file. The previous implementation intentionally
  // sliced to ~14 lines around the error, which made large files look
  // truncated. The parent already provides an overflow container, so the
  // whole source can scroll naturally like an editor.
  return (
    <div className="min-w-0 w-full font-mono text-[11px] leading-6">
      <div className="sticky top-0 z-10 border-b border-white/[0.04] bg-[#0a0c10]/95 px-4 py-1.5 text-[8px] text-white/20 backdrop-blur">
        {file.path}
        {errorLine > 0 && <span className="ml-2 text-red-300/50">• runtime error at line {errorLine}</span>}
        {fixedLine > 0 && <span className="ml-2 text-emerald-300/65">• changed at line {fixedLine}</span>}
      </div>

      <div className="min-w-max pb-8 pt-1">
        {lines.map((text, index) => {
          const lineNumber = index + 1;
          const isError = lineNumber === errorLine;
          const isChanged = lineNumber === fixedLine;

          return (
            <div
              key={`${file.path}:${lineNumber}`}
              className={cx(
                'grid min-h-6 grid-cols-[58px_minmax(0,1fr)]',
                isError
                  ? 'bg-red-400/[0.075] shadow-[inset_2px_0_0_rgba(248,113,113,0.9)]'
                  : isChanged
                    ? 'bg-emerald-400/[0.10] shadow-[inset_2px_0_0_rgba(52,211,153,0.9)]'
                    : ''
              )}
            >
              <div
                className={cx(
                  'select-none border-r border-white/[0.035] pr-4 text-right text-white/15',
                  isError ? 'text-red-300/75' : isChanged ? 'text-emerald-300/80' : ''
                )}
              >
                {lineNumber}
              </div>

              <div className="relative whitespace-pre px-4 text-white/45">
                {isError && <span className="absolute left-1 top-0 text-red-400">●</span>}
                {isChanged && !isError && <span className="absolute left-1 top-0 text-emerald-400">●</span>}
                <span className={isError ? 'text-red-100/90' : isChanged ? 'text-emerald-100/90' : ''}>
                  {text || ' '}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mx-4 my-5 overflow-hidden rounded-lg border border-red-400/10 bg-red-400/[0.025]">
          <div className="flex items-center justify-between border-b border-red-400/[0.08] px-3 py-2">
            <div>
              <div className="text-[8px] font-semibold uppercase tracking-widest text-red-300/60">Runtime error</div>
              <div className="mt-1 text-[10px] text-white/55">{toDisplayText(error.message)}</div>
            </div>
            <button
              type="button"
              onClick={() => onOpenFile?.(error.file, error.line)}
              className="cursor-pointer rounded-md border border-white/10 px-2 py-1 text-[8px] text-white/45 hover:bg-white/[0.05]"
            >
              Jump to line
            </button>
          </div>
          <div className="grid grid-cols-2 text-[9px]">
            <div className="border-r border-white/[0.05] bg-red-400/[0.03] p-3 text-red-200/65">
              <div className="mb-1 text-[8px] uppercase tracking-widest text-white/20">Current</div>
              {toDisplayText(error.codeBefore, 'No source snippet')}
            </div>
            <div className="bg-emerald-400/[0.025] p-3 text-emerald-200/70">
              <div className="mb-1 text-[8px] uppercase tracking-widest text-white/20">AI suggestion</div>
              {toDisplayText(error.codeAfter, 'No proposed fix')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyExplorer({ title, text }) {
  return (
    <div className="m-2 rounded-lg border border-dashed border-white/[0.07] p-3">
      <div className="text-[9px] text-white/45">{title}</div>
      <div className="mt-1 text-[9px] leading-4 text-white/20">{text}</div>
    </div>
  );
}

function FileTree({ nodes, selectedFile, onSelect, depth = 0 }) {
  const [openFolders, setOpenFolders] = useState(() => new Set());

  const toggleFolder = (path) => {
    setOpenFolders((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="space-y-0.5 pb-3">
      {nodes.map((node) => {
        const open = openFolders.has(node.path) || depth === 0;
        const active = !node.folder && selectedFile === node.path;

        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => node.folder ? toggleFolder(node.path) : onSelect(node.file)}
              title={node.path}
              className={cx(
                'group flex w-full cursor-pointer items-center gap-1.5 rounded-md py-1 text-left text-[10px] transition',
                active ? 'bg-white/[0.08] text-white/85' : 'text-white/38 hover:bg-white/[0.04] hover:text-white/70'
              )}
              style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: 6 }}
            >
              <span className="w-3 shrink-0 text-center text-[8px] text-white/20">
                {node.folder ? (open ? '▾' : '▸') : ''}
              </span>
              <span className={cx('w-4 shrink-0 text-center text-[8px]', node.folder ? 'text-amber-200/45' : 'text-white/25')}>
                {iconForPath(node.path, node.folder)}
              </span>
              <span className="min-w-0 flex-1 truncate">{node.name}</span>
              {!node.folder && active && <span className="mr-1 h-1 w-1 rounded-full bg-emerald-400" />}
            </button>

            {node.folder && open && node.children?.length > 0 && (
              <FileTree
                nodes={node.children}
                selectedFile={selectedFile}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TimelineView({ timeline }) {
  return (
    <div className="p-5">
      <div className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        Debug Timeline
      </div>

      <div className="max-w-xl">
        {timeline.map((item, index) => (
          <div key={item.label} className="relative flex gap-3 pb-7">
            {index < timeline.length - 1 && (
              <span className="absolute left-[5px] top-3 h-full w-px bg-white/[0.07]" />
            )}
            <span
              className={cx(
                'relative z-10 mt-0.5 h-3 w-3 shrink-0 rounded-full border',
                item.state === 'error'
                  ? 'border-red-300/50 bg-red-400/30'
                  : item.state === 'done'
                    ? 'border-emerald-300/50 bg-emerald-400/30'
                    : item.state === 'active'
                      ? 'border-amber-300/50 bg-amber-400/30'
                      : 'border-white/20 bg-white/[0.06]'
              )}
            />
            <div>
              <div className="text-[11px] text-white/65">{item.label}</div>
              <div className="mt-1 font-mono text-[9px] text-white/25">
                {item.meta}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FixPreview({ error, disabled = false, onApply }) {
  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            AI Fix Preview
          </div>
          <div className="mt-1 text-[10px] text-white/25">
            {error?.file || 'No file'}:{error?.line || '-'}
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[8px] uppercase tracking-wider text-emerald-300/60">
          Safe patch
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#06080b] font-mono text-[11px] leading-6">
        <div className="border-b border-white/[0.05] px-3 py-2 text-[9px] text-white/20">
          {error?.file || 'source'} · line {error?.line || '-'}
        </div>
        <div className="bg-red-400/[0.045] px-3 text-red-300/75">
          − {toDisplayText(error?.codeBefore, 'No old code available.')}
        </div>
        <div className="bg-emerald-400/[0.045] px-3 text-emerald-300/80">
          + {toDisplayText(error?.codeAfter, 'No proposed fix available.')}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[10px] leading-5 text-white/30">
        The patch should be reviewed before applying. After applying, DEVSPA
        can run the workspace again to verify whether the error is resolved.
      </div>

      {onApply && (
        <button
          onClick={onApply}
          disabled={disabled}
          className="mt-3 rounded-md bg-white px-3 py-2 text-[10px] font-semibold text-black disabled:opacity-30"
        >
          Review & Apply Fix
        </button>
      )}
    </div>
  );
}