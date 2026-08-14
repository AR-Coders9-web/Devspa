import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileCode2, Save, Terminal as TerminalIcon } from 'lucide-react';
import EditorHeader from './EditorHeader';
import EditorSidebar from './EditorSidebar';
import EditorTabs from './EditorTabs';
import EditorPane from './EditorPane';
import EditorStatusBar from './EditorStatusBar';
import TerminalPanel from './TerminalPanel';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const STORAGE_KEY = 'devspa.editor.workspace.v2';

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const getRepositoryUrl = (repo) => {
  if (!repo) return "";
  return String(
    repo.htmlUrl ||
    repo.html_url ||
    repo.url ||
    (repo.fullName ? `https://github.com/${repo.fullName}` : "")
  ).replace(/\\.git$/, "");
};

const getWorkspaceId = (repo, request = null) =>
  String(
    request?.workspaceId ||
    request?.currentWorkspaceId ||
    repo?.workspaceId ||
    repo?.id ||
    ""
  );

export default function CodeEditor({ externalRepository = null, externalFiles = [], openFileRequest = null, onWorkspaceChange }) {
  const stored = useMemo(() => readStored(), []);
  const [repository, setRepository] = useState(stored?.repository || null);
  const [files, setFiles] = useState(Array.isArray(stored?.files) ? stored.files : []);
  const [activeFileId, setActiveFileId] = useState(stored?.activeFileId || null);
  const [openTabIds, setOpenTabIds] = useState(Array.isArray(stored?.openTabIds) ? stored.openTabIds : []);
  const [terminalOpen, setTerminalOpen] = useState(Boolean(stored?.terminalOpen));
  const [deletedFiles, setDeletedFiles] = useState(Array.isArray(stored?.deletedFiles) ? stored.deletedFiles : []);
  const [commitRequestToken, setCommitRequestToken] = useState(0);
  const [notice, setNotice] = useState('');

  const activeFile = files.find((file) => file.id === activeFileId) || null;
  const openTabs = openTabIds.map((id) => files.find((file) => file.id === id)).filter(Boolean);
  const hasChanges = files.some((file) => file.modified) || deletedFiles.length > 0;

  // Keep the editor synchronized with the shared DEVSPA workspace.
  useEffect(() => {
    if (externalRepository) {
      setRepository((current) => ({ ...current, ...externalRepository }));
    }
    if (Array.isArray(externalFiles) && externalFiles.length) {
      setFiles((current) => {
        const byId = new Map(current.map((file) => [file.id || file.path, file]));
        return externalFiles.map((incoming) => ({
          ...(byId.get(incoming.id || incoming.path) || {}),
          ...incoming,
          id: incoming.id || incoming.path,
        }));
      });
    }
  }, [externalRepository, externalFiles]);

  // Explorer can request a file while the editor window is already open.
  useEffect(() => {
    if (!openFileRequest?.file) return;
    const incoming = openFileRequest.file;
    const incomingPath = String(incoming.path || incoming.name || '').replace(/^\/+/, '');
    if (!incomingPath) return;

    const requestRepository =
      openFileRequest.repository ||
      openFileRequest.currentRepository ||
      null;

    if (requestRepository) {
      setRepository((current) => ({ ...current, ...requestRepository }));
    }

    if (Array.isArray(openFileRequest.files) && openFileRequest.files.length) {
      setFiles((current) => {
        const byId = new Map(current.map((file) => [file.id || file.path, file]));
        return openFileRequest.files.map((file) => ({
          ...(byId.get(file.id || file.path) || {}),
          ...file,
          id: file.id || file.path,
        }));
      });
    }

    setFiles((current) => {
      const existing = current.find((file) =>
        String(file.path || '').replace(/^\/+/, '') === incomingPath
      );
      const nextFile = existing || {
        ...incoming,
        id: incoming.id || incomingPath,
        path: incomingPath,
        name: incoming.name || incomingPath.split('/').pop(),
      };
      if (!existing) return [...current, nextFile];
      return current;
    });

    const requestedId = incoming.id || incomingPath;
    setActiveFileId(requestedId);
    setOpenTabIds((tabs) => tabs.includes(requestedId) ? tabs : [...tabs, requestedId]);

    // Explorer metadata intentionally contains no source body. Load the real
    // source from the workspace API when the requested file is opened.
    const workspaceId = getWorkspaceId(
      requestRepository || repository,
      openFileRequest
    );
    const hasContent = typeof incoming.content === 'string' && incoming.content.length > 0;
    if (!hasContent && !incoming.binary && workspaceId) {
      fetch(`${API_URL}/api/github/workspace/${encodeURIComponent(workspaceId)}/file?path=${encodeURIComponent(incomingPath)}`, { credentials: 'include' })
        .then(async (response) => {
          if (!response.ok) throw new Error('Unable to load file content.');
          return response.text();
        })
        .then((content) => {
          setFiles((current) => current.map((file) =>
            (file.id === requestedId || file.path === incomingPath)
              ? { ...file, content, contentLoaded: true }
              : file
          ));
        })
        .catch((error) => {
          setNotice(error.message || 'Unable to load file.');
          setTimeout(() => setNotice(''), 2500);
        });
    }
  }, [openFileRequest]);

  useEffect(() => {
    const snapshot = { repository, files, activeFileId, openTabIds, terminalOpen, deletedFiles };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch {
      // Quota errors must never crash the editor.
    }
  }, [repository, files, activeFileId, openTabIds, terminalOpen, deletedFiles]);

  const loadFile = useCallback(async (file) => {
    if (!file) return;
    setActiveFileId(file.id);
    setOpenTabIds((tabs) => tabs.includes(file.id) ? tabs : [...tabs, file.id]);
    if (file.binary || file.contentLoaded || (typeof file.content === 'string' && file.content.length > 0)) return;
    const workspaceId = getWorkspaceId(repository);
    if (!workspaceId) return;
    try {
      const response = await fetch(
        `${API_URL}${file.contentUrl || `/api/github/workspace/${encodeURIComponent(workspaceId)}/file?path=${encodeURIComponent(file.path)}`}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Unable to load file content.');
      const content = await response.text();
      setFiles((current) => current.map((item) => item.id === file.id ? { ...item, content, contentLoaded: true } : item));
    } catch (error) {
      setNotice(error.message || 'Unable to load file.');
      setTimeout(() => setNotice(''), 2500);
    }
  }, [repository?.workspaceId, repository?.id]);

  const handleFileChange = (content) => {
    if (!activeFile) return;

    setFiles((current) => {
      const nextFiles = current.map((file) =>
        file.id === activeFile.id
          ? {
              ...file,
              content,
              contentLoaded: true,
              modified: true,
            }
          : file
      );

      // Keep Explorer/DEVSPA aware of edits made inside the Editor.
      onWorkspaceChange?.({
        repository,
        workspaceId: getWorkspaceId(repository),
        files: nextFiles,
      });

      return nextFiles;
    });
  };

  const handleTabClose = (id) => {
    setOpenTabIds((tabs) => {
      const index = tabs.indexOf(id);
      const next = tabs.filter((tabId) => tabId !== id);
      if (activeFileId === id) setActiveFileId(next[index - 1] || next[index] || null);
      return next;
    });
  };

  const handleImport = (data) => {
    const imported = Array.isArray(data.files) ? data.files : [];
    const repo = data.repository
      ? {
          ...data.repository,
          htmlUrl:
            data.repository.htmlUrl ||
            data.repository.html_url ||
            data.repository.url ||
            (data.repository.fullName
              ? `https://github.com/${data.repository.fullName}`
              : ""),
          defaultBranch:
            data.repository.defaultBranch ||
            data.repository.default_branch ||
            "main",
          workspaceId:
            data.workspaceId ||
            data.repository.workspaceId ||
            data.repository.id ||
            "",
        }
      : null;
    setRepository(repo);
    setFiles(imported);
    setOpenTabIds([]);
    setActiveFileId(null);
    setTerminalOpen(false);
    setDeletedFiles([]);
    onWorkspaceChange?.({ repository: repo, workspaceId: repo?.workspaceId, files: imported });
    setNotice(`Imported ${imported.length} files from ${repo?.fullName || 'repository'}.`);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleClear = () => {
    setRepository(null); setFiles([]); setOpenTabIds([]); setActiveFileId(null); setTerminalOpen(false); setDeletedFiles([]); localStorage.removeItem(STORAGE_KEY);
    setNotice('Workspace cleared.'); setTimeout(() => setNotice(''), 2500);
  };

  const handleDeleteFile = async (file) => {
    const workspaceId = getWorkspaceId(repository);
    if (!workspaceId) throw new Error('Workspace ID is missing.');

    try {
      const response = await fetch(`${API_URL}/api/github/workspace/file`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, path: file.path }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Delete failed.');
      }

      setFiles((current) => current.filter((item) => item.id !== file.id));
      setOpenTabIds((tabs) => tabs.filter((id) => id !== file.id));
      setActiveFileId((current) => current === file.id ? null : current);
      setDeletedFiles((current) => current.includes(file.path) ? current : [...current, file.path]);

      onWorkspaceChange?.({
        repository,
        workspaceId,
        files: files.filter((item) => item.id !== file.id),
        deletedFiles: [...deletedFiles, file.path],
      });

      setNotice(`Deleted ${file.path}. Commit & Push to remove it from GitHub.`);
      setTimeout(() => setNotice(''), 3000);
    } catch (error) {
      setNotice(error.message || 'Delete failed.');
      setTimeout(() => setNotice(''), 3000);
      throw error;
    }
  };

  const save = async ({ silent = false } = {}) => {
    const workspaceId = getWorkspaceId(repository);
    if (!workspaceId) throw new Error('Workspace ID is missing.');

    const changed = files.filter(
      (file) =>
        file.modified &&
        !file.binary &&
        typeof file.content === 'string'
    );

    if (!changed.length) return { count: 0 };

    const response = await fetch(`${API_URL}/api/github/workspace`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        files: changed.map(({ path, content }) => ({ path, content })),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Save failed.');
    }

    setFiles((current) => {
      const nextFiles = current.map((file) =>
        changed.some((item) => item.id === file.id)
          ? { ...file, modified: false }
          : file
      );

      onWorkspaceChange?.({
        repository,
        workspaceId,
        files: nextFiles,
      });

      return nextFiles;
    });

    if (!silent) {
      setNotice(
        `Saved ${data.count || changed.length} file${(data.count || changed.length) === 1 ? '' : 's'}.`
      );
      setTimeout(() => setNotice(''), 2500);
    }

    return data;
  };

  const commit = async (message) => {
    const repoUrl = getRepositoryUrl(repository);
    if (!repoUrl) throw new Error('Repository URL is missing.');

    const changed = files.filter(
      (file) =>
        file.modified &&
        !file.binary &&
        typeof file.content === 'string'
    );

    const deleted = deletedFiles.map((path) => ({ path, deleted: true }));
    const changes = [
      ...changed.map(({ path, content }) => ({ path, content })),
      ...deleted,
    ];

    if (!changes.length) {
      throw new Error('No changes to commit.');
    }

    const response = await fetch(`${API_URL}/api/github/commit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoUrl,
        branch: repository?.defaultBranch || repository?.default_branch || 'main',
        message,
        files: changes,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Commit & Push failed.');
    }

    // Do NOT call save() after a successful GitHub commit.
    // The commit already contains the edited contents. Calling save() here
    // could fail and falsely report the successful GitHub commit as a failure.
    setFiles((current) => {
      const nextFiles = current.map((file) =>
        changed.some((item) => item.id === file.id)
          ? {
              ...file,
              modified: false,
              originalContent:
                typeof file.content === 'string'
                  ? file.content
                  : file.originalContent,
            }
          : file
      );

      onWorkspaceChange?.({
        repository,
        workspaceId: getWorkspaceId(repository),
        files: nextFiles,
      });

      return nextFiles;
    });
    setDeletedFiles([]);

    setNotice(
      `Committed ${data.filesCommitted || changes.length} change${(data.filesCommitted || changes.length) === 1 ? '' : 's'} to GitHub.`
    );
    setTimeout(() => setNotice(''), 3000);
  };

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault(); save().catch((error) => setNotice(error.message));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[#090a0c] text-white">
      <EditorHeader repository={repository} repoName={repository?.name || 'No repository'} branchName={repository?.defaultBranch || 'main'} currentFilePath={activeFile?.path || ''} onSave={() => save().catch((e) => setNotice(e.message))} onCommit={commit} onCommitRequestToken={commitRequestToken} onRepositoryImport={handleImport} onRepositoryClear={handleClear} onTerminalToggle={() => setTerminalOpen((value) => !value)} terminalOpen={terminalOpen} hasChanges={hasChanges} />
      {notice && <div className="absolute left-1/2 top-[60px] z-50 -translate-x-1/2 rounded-xl border border-white/[.10] bg-[#17181c] px-4 py-2 text-xs text-white/75 shadow-2xl">{notice}</div>}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <EditorSidebar files={files} activeFileId={activeFileId} onFileOpen={loadFile} onDeleteFile={handleDeleteFile} onCommitRequest={() => setCommitRequestToken((value) => value + 1)} hasChanges={hasChanges} />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <EditorTabs tabs={openTabs} activeTabId={activeFileId} onTabSelect={(id) => { const file = files.find((item) => item.id === id); if (file) loadFile(file); }} onTabClose={handleTabClose} />
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeFile ? <EditorPane activeFile={activeFile} content={activeFile.content || ''} language={activeFile.language || 'plaintext'} onChange={handleFileChange} /> : <div className="flex h-full items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[.07] bg-white/[.025]"><FileCode2 className="h-6 w-6 text-white/20" /></div><p className="text-sm font-medium text-white/40">{repository ? 'No file is open' : 'No repository open'}</p><p className="mt-2 text-xs text-white/20">{repository ? 'Select a file from Explorer to start coding.' : 'Import a GitHub repository to create a workspace.'}</p></div></div>}
          </div>
          {terminalOpen && repository && <TerminalPanel repository={repository} workspaceId={repository.workspaceId} onClose={() => setTerminalOpen(false)} />}
        </main>
      </div>
      <EditorStatusBar branch={repository?.defaultBranch || 'main'} syncStatus={repository ? 'Local' : 'No Repository'} hasChanges={hasChanges} language={activeFile?.language || 'plaintext'} activeFile={activeFile} terminalOpen={terminalOpen} onTerminalToggle={() => setTerminalOpen((value) => !value)} />
    </div>
  );
}