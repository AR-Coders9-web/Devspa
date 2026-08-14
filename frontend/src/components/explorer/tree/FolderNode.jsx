import React from "react";
import FileTreeNode from "./FileTreeNode";
import FileIcon from "./FileIcon";

export default function FolderNode({
  node, depth, expanded, onToggle, selectedPath, onSelect, onContextMenu,
}) {
  const countFiles = (items = []) => items.reduce((total, item) =>
    total + (item.folder ? countFiles(item.children) : 1), 0);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenu?.(event, { ...node, type: "folder" });
        }}
        title={`${expanded ? "Collapse" : "Expand"} ${node.path}`}
        className="group flex w-full cursor-pointer items-center gap-1.5 rounded-lg py-[5px] text-left text-[9px] text-white/45 transition hover:bg-white/[0.045] hover:text-white/80"
        style={{ paddingLeft: 5 + depth * 16, paddingRight: 8 }}
      >
        <span className="grid w-3 place-items-center text-[8px] text-white/25 transition group-hover:text-white/45">
          {expanded ? "▾" : "▸"}
        </span>
        <FileIcon path={node.path} folder expanded={expanded} />
        <span className="min-w-0 flex-1 truncate font-medium">{node.name}</span>
        <span className="mr-1 hidden text-[7px] text-white/15 group-hover:block">{countFiles(node.children)}</span>
      </button>

      {expanded && (
        <div className="relative">
          <div className="pointer-events-none absolute bottom-1 left-0 top-0 w-px bg-white/[0.035]" style={{ marginLeft: 11 + depth * 16 }} />
          {node.children?.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} onContextMenu={onContextMenu} />
          ))}
        </div>
      )}
    </div>
  );
}
