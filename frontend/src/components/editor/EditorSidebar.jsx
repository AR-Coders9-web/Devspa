import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode2,
  FileText,
  FileJson,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  GitCommit,
} from 'lucide-react';

const getIcon = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png','jpg','jpeg','gif','webp','svg','ico','bmp','avif'].includes(ext)) return ImageIcon;
  if (ext === 'json') return FileJson;
  if (['js','jsx','ts','tsx','css','scss','html','vue','svelte'].includes(ext)) return FileCode2;
  return FileText;
};

const buildTree = (files = []) => {
  const root = [];
  files.forEach((file) => {
    const parts = String(file.path || '').split('/').filter(Boolean);
    let level = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let node = level.find((item) => item.name === part);
      if (!node) {
        node = {
          id: isFile ? file.id : `folder:${parts.slice(0, index + 1).join('/')}`,
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: [],
          ...(isFile ? file : {}),
        };
        level.push(node);
      }
      if (!isFile) level = node.children;
    });
  });

  const sort = (items) => {
    items.sort((a, b) =>
      a.type === b.type
        ? a.name.localeCompare(b.name)
        : a.type === 'folder' ? -1 : 1
    );
    items.forEach((item) => sort(item.children));
  };

  sort(root);
  return root;
};

function TreeItem({
  item,
  depth,
  activeFileId,
  selectedFileId,
  onFileSelect,
  onFileOpen,
  onContextMenu,
}) {
  const folder = item.type === 'folder';
  const [expanded, setExpanded] = useState(depth === 0);
  const Icon = folder ? (expanded ? FolderOpen : Folder) : getIcon(item.name);

  return (
    <div>
      <button
        type="button"
        title={folder ? item.path : `${item.path} — double-click to open`}
        onClick={() => {
          if (folder) setExpanded((value) => !value);
          else onFileSelect?.(item);
        }}
        onDoubleClick={(event) => {
          if (folder) return;
          event.preventDefault();
          onFileOpen?.(item);
        }}
        onContextMenu={(event) => {
          if (folder) return;
          event.preventDefault();
          onFileSelect?.(item);
          onContextMenu?.(event, item);
        }}
        className={`group flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[12px] transition ${
          item.id === activeFileId
            ? 'bg-white/[.09] text-white'
            : item.id === selectedFileId
              ? 'bg-white/[.05] text-white/85'
              : 'text-white/55 hover:bg-white/[.04] hover:text-white/85'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {folder ? (
          expanded ? (
            <ChevronDown className="h-3 w-3 text-white/30" />
          ) : (
            <ChevronRight className="h-3 w-3 text-white/30" />
          )
        ) : (
          <span className="w-3" />
        )}
        <Icon className="h-3.5 w-3.5 shrink-0 text-white/45" />
        <span className="min-w-0 flex-1 truncate">{item.name}</span>
        {item.modified && <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />}
      </button>

      {folder && expanded && (
        <div>
          {item.children.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              selectedFileId={selectedFileId}
              onFileSelect={onFileSelect}
              onFileOpen={onFileOpen}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditorSidebar({
  files = [],
  activeFileId,
  onFileSelect,
  onFileOpen,
  onDeleteFile,
  onCommitRequest,
  hasChanges = false,
}) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [selectedFileId, setSelectedFileId] = useState(activeFileId || null);
  const [contextMenu, setContextMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (activeFileId) setSelectedFileId(activeFileId);
  }, [activeFileId]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleSelect = (file) => {
    setSelectedFileId(file.id);
    onFileSelect?.(file);
  };

  const handleOpen = (file) => {
    setSelectedFileId(file.id);
    onFileOpen?.(file);
  };

  const handleContextMenu = (event, file) => {
    const menuWidth = 190;
    const menuHeight = 112;
    const left = Math.min(event.clientX, window.innerWidth - menuWidth - 8);
    const top = Math.min(event.clientY, window.innerHeight - menuHeight - 8);
    setContextMenu({ file, left: Math.max(8, left), top: Math.max(8, top) });
  };

  const deleteSelectedFile = async () => {
    if (!contextMenu?.file) return;
    const file = contextMenu.file;
    setContextMenu(null);

    const confirmed = window.confirm(
      `Delete "${file.name}" from the DEVSPA workspace?\n\nThis will not change GitHub until you Commit & Push.`
    );
    if (!confirmed) return;

    await onDeleteFile?.(file);
  };

  return (
    <aside className="relative flex h-full w-[285px] shrink-0 flex-col border-r border-white/[.06] bg-[#0b0c0f]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[.05] px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/45">Explorer</span>
        <span className="text-[10px] text-white/20">{files.length ? `${files.length} files` : 'Empty'}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2">
        {!tree.length ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <Folder className="mx-auto mb-3 h-7 w-7 text-white/15" />
              <p className="text-xs text-white/35">No repository open</p>
              <p className="mt-1 text-[10px] text-white/15">Import a GitHub repository to begin.</p>
            </div>
          </div>
        ) : (
          tree.map((item) => (
            <TreeItem
              key={item.id}
              item={item}
              depth={0}
              activeFileId={activeFileId}
              selectedFileId={selectedFileId}
              onFileSelect={handleSelect}
              onFileOpen={handleOpen}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-white/[.05] px-3 py-2.5">
        <p className="text-[9px] uppercase tracking-[.16em] text-white/20">Local Workspace</p>
        <p className="mt-1 truncate text-[11px] text-white/35">{files.length ? 'Repository Loaded' : 'No Repository'}</p>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[2000] min-w-[190px] overflow-hidden rounded-xl border border-white/[.10] bg-[#15161a] p-1 shadow-[0_18px_50px_rgba(0,0,0,.65)]"
          style={{ left: contextMenu.left, top: contextMenu.top }}
          onMouseDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            onClick={() => { const file = contextMenu.file; setContextMenu(null); handleOpen(file); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/[.06] hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5 text-white/40" />
            Open
          </button>
          <button
            type="button"
            disabled={!hasChanges}
            onClick={() => { setContextMenu(null); onCommitRequest?.(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/[.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <GitCommit className="h-3.5 w-3.5 text-white/40" />
            Commit Changes
          </button>
          <div className="my-1 h-px bg-white/[.07]" />
          <button
            type="button"
            onClick={deleteSelectedFile}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-300/80 hover:bg-red-400/[.08] hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </aside>
  );
}
