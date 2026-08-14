import React, { useEffect, useState } from 'react';
import {
  GitBranch, Save, ArrowUpCircle, FileCode, X, Loader2,
  AlertCircle, ExternalLink, Trash2, AlertTriangle, Terminal, LogIn, LogOut
} from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const GitHubIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.49 11.49 0 0 1 3.003-.404c1.018.005 2.043.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.103.823 2.222v3.293c0 .322.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.63 0 12 0Z" />
  </svg>
);

async function readResponse(response) {
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status}).`);
  return data;
}

export default function EditorHeader({
  repository,
  repoName = 'No repository',
  branchName = 'main',
  currentFilePath = '',
  onSave,
  onCommit,
  onCommitRequestToken = 0,
  onRepositoryImport,
  onRepositoryClear,
  onTerminalToggle,
  terminalOpen = false,
  hasChanges = false,
}) {
  const [showImport, setShowImport] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [showCommit, setShowCommit] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [commitMessage, setCommitMessage] = useState('Update from DEVSPA');
  const [loading, setLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [error, setError] = useState('');
  const [clearError, setClearError] = useState('');
  const [commitError, setCommitError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!onCommitRequestToken) return;
    if (!repository || !hasChanges) return;
    setCommitError('');
    setShowCommit(true);
  }, [onCommitRequestToken]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
  if (!cancelled) {
    setUser(data?.user || null);

    console.log("DEVSPA GitHub session:", {
      authenticated: data?.authenticated,
      hasToken: data?.hasToken,
      user: data?.user?.login,
    });
  }
})
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const validateUrl = (value) => /^https:\/\/github\.com\/[^/\s]+\/[^/\s#?]+(?:\.git)?(?:[/?#].*)?$/i.test(value.trim());

  const importRepository = async (event) => {
    event.preventDefault();
    setError('');
    if (!validateUrl(repoUrl)) return setError('Enter a valid GitHub repository URL.');
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/github/import`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() })
      });
      const data = await readResponse(response);
      onRepositoryImport?.(data);
      setShowImport(false);
      setRepoUrl('');
    } catch (err) {
      setError(err.message || 'Unable to import repository.');
    } finally { setLoading(false); }
  };

  const clearWorkspace = async () => {
    const workspaceId = repository?.workspaceId || repository?.id;
    if (!workspaceId) return setClearError('No active workspace was found.');
    try {
      setClearLoading(true); setClearError('');
      const response = await fetch(`${API_URL}/api/github/workspace`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });
      const data = await readResponse(response);
      setShowClear(false);
      onRepositoryClear?.(data);
    } catch (err) { setClearError(err.message || 'Unable to clear workspace.'); }
    finally { setClearLoading(false); }
  };

  const commit = async () => {
    if (!commitMessage.trim()) return setCommitError('Commit message is required.');
    try {
      setCommitLoading(true); setCommitError('');
      await onCommit?.(commitMessage.trim());
      setShowCommit(false);
    } catch (err) { setCommitError(err.message || 'Commit & Push failed.'); }
    finally { setCommitLoading(false); }
  };

  const login = () => { window.location.href = `${API_URL}/auth/github`; };
  const logout = async () => {
    try { await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    setUser(null);
  };

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0d0e11] px-3 text-white select-none">
        <div className="flex min-w-0 items-center gap-1">
          <button onClick={() => { setError(''); setShowImport(true); }} className="group flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-white/75 transition hover:bg-white/[0.05] hover:text-white" title="Import GitHub repository">
            <GitHubIcon className="h-4 w-4 text-white/85" />
            <span className="max-w-[180px] truncate text-[13px] font-semibold">{repository?.name || repoName}</span>
          </button>
          <div className="mx-1 h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 px-2 text-white/40"><GitBranch className="h-3.5 w-3.5" /><span className="text-xs">{repository?.defaultBranch || branchName}</span></div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center px-5 md:flex">
          {currentFilePath && <div className="flex min-w-0 items-center gap-1.5 text-xs text-white/35"><FileCode className="h-3.5 w-3.5" /><span className="truncate">{currentFilePath}</span></div>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button onClick={onTerminalToggle} className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs transition ${terminalOpen ? 'bg-white/[0.10] text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white'}`} title="Toggle terminal"><Terminal className="h-3.5 w-3.5" />Terminal</button>
          <button onClick={() => setShowClear(true)} disabled={!repository} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-red-300/65 transition hover:bg-red-400/[0.08] hover:text-red-300 disabled:pointer-events-none disabled:opacity-25" title="Clear editor workspace"><Trash2 className="h-3.5 w-3.5" />Clear Editor</button>
          <button onClick={onSave} disabled={!repository || !hasChanges} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white disabled:pointer-events-none disabled:opacity-30" title="Save changes"><Save className="h-3.5 w-3.5" />Save</button>
          <button onClick={() => { setCommitError(''); setShowCommit(true); }} disabled={!repository || !hasChanges} className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.08] px-3 text-xs font-medium text-white/80 transition hover:bg-white/[0.13] disabled:pointer-events-none disabled:opacity-30" title="Commit and push"><ArrowUpCircle className="h-3.5 w-3.5" />Commit & Push</button>
          {user ? (
            <button onClick={logout} title={`Sign out ${user.login}`} className="ml-1 flex h-8 items-center gap-1.5 rounded-lg px-2 text-white/40 hover:bg-white/[0.05] hover:text-white"><LogOut className="h-3.5 w-3.5" /><span className="hidden lg:inline text-xs">{user.login}</span></button>
          ) : (
            <button onClick={login} title="Sign in with GitHub" className="ml-1 flex h-8 items-center gap-1.5 rounded-lg px-2 text-white/45 hover:bg-white/[0.05] hover:text-white"><LogIn className="h-3.5 w-3.5" /><span className="hidden lg:inline text-xs">GitHub Login</span></button>
          )}
        </div>
      </header>

      {showImport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onMouseDown={(e) => e.target === e.currentTarget && !loading && setShowImport(false)}>
          <div className="w-full max-w-[540px] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#111216] shadow-[0_30px_100px_rgba(0,0,0,.75)]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05]"><GitHubIcon className="h-5 w-5" /></div><div><h2 className="text-sm font-semibold">Import GitHub Repository</h2><p className="mt-1 text-[11px] text-white/35">Create a fresh local workspace</p></div></div><button onClick={() => !loading && setShowImport(false)} className="rounded-lg p-2 text-white/30 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button></div>
            <form onSubmit={importRepository} className="space-y-5 p-5">
              <div><label className="mb-2 block text-[10px] uppercase tracking-[.16em] text-white/40">Repository URL</label><div className="flex items-center rounded-xl border border-white/[0.10] bg-black/20 px-3 focus-within:border-white/25"><GitHubIcon className="mr-2 h-4 w-4 text-white/30" /><input autoFocus value={repoUrl} onChange={(e) => { setRepoUrl(e.target.value); setError(''); }} placeholder="https://github.com/owner/repository" disabled={loading} className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-white/20" /></div><div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/25"><ExternalLink className="h-3 w-3" />Public repositories work without login. Private repositories require GitHub login.</div></div>
              {error && <div className="flex gap-2.5 rounded-xl border border-red-400/10 bg-red-400/[.05] px-3.5 py-3 text-xs text-red-300/80"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowImport(false)} disabled={loading} className="rounded-lg border border-white/[.08] px-4 py-2.5 text-xs text-white/50 hover:bg-white/[.05]">Cancel</button><button type="submit" disabled={loading} className="flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-white/90 disabled:opacity-50">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Importing...</> : <><GitHubIcon className="h-3.5 w-3.5" />Import Repository</>}</button></div>
            </form>
          </div>
        </div>
      )}

      {showClear && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onMouseDown={(e) => e.target === e.currentTarget && !clearLoading && setShowClear(false)}>
          <div className="w-full max-w-[460px] rounded-2xl border border-white/[.10] bg-[#111216] p-5 shadow-[0_30px_100px_rgba(0,0,0,.75)]">
            <div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[.06]"><AlertTriangle className="h-5 w-5 text-red-300" /></div><div><h2 className="text-sm font-semibold">Clear workspace?</h2><p className="mt-2 text-xs leading-5 text-white/40">This removes the local workspace and installed dependencies. Your GitHub repository is not deleted.</p></div></div>
            {clearError && <div className="mt-4 rounded-xl border border-red-400/10 bg-red-400/[.05] p-3 text-xs text-red-300">{clearError}</div>}
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setShowClear(false)} disabled={clearLoading} className="rounded-lg border border-white/[.08] px-4 py-2.5 text-xs text-white/50">Cancel</button><button onClick={clearWorkspace} disabled={clearLoading} className="flex min-w-[135px] items-center justify-center gap-2 rounded-lg bg-red-400 px-4 py-2.5 text-xs font-semibold text-black">{clearLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Clearing...</> : <><Trash2 className="h-3.5 w-3.5" />Clear Workspace</>}</button></div>
          </div>
        </div>
      )}

      {showCommit && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onMouseDown={(e) => e.target === e.currentTarget && !commitLoading && setShowCommit(false)}>
          <div className="w-full max-w-[460px] rounded-2xl border border-white/[.10] bg-[#111216] p-5 shadow-[0_30px_100px_rgba(0,0,0,.75)]"><h2 className="text-sm font-semibold">Commit & Push</h2><p className="mt-1 text-xs text-white/35">Push your modified text files to the current GitHub branch.</p><input autoFocus value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !commitLoading && commit()} className="mt-5 h-11 w-full rounded-xl border border-white/[.10] bg-black/20 px-3 text-sm text-white outline-none focus:border-white/25" placeholder="Commit message" />{commitError && <div className="mt-3 rounded-xl border border-red-400/10 bg-red-400/[.05] p-3 text-xs text-red-300">{commitError}</div>}<div className="mt-5 flex justify-end gap-2"><button onClick={() => setShowCommit(false)} disabled={commitLoading} className="rounded-lg border border-white/[.08] px-4 py-2.5 text-xs text-white/50">Cancel</button><button onClick={commit} disabled={commitLoading} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black">{commitLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Pushing...</> : <><ArrowUpCircle className="h-3.5 w-3.5" />Commit & Push</>}</button></div></div>
        </div>
      )}
    </>
  );
}
