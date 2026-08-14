import React from "react";
import FileTreeNode from "./FileTreeNode";

function buildTree(files) {
  const root = { name: "", path: "", folder: true, children: [] };

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const path = parts.slice(0, index + 1).join("/");
      const folder = index < parts.length - 1;
      let child = current.children.find((item) => item.name === part && item.folder === folder);

      if (!child) {
        child = {
          name: part,
          path,
          folder,
          children: folder ? [] : undefined,
          file: folder ? undefined : file,
        };
        current.children.push(child);
      }
      if (!folder) child.file = file;
      current = child;
    });
  }

  const sortTree = (node) => {
    node.children?.sort((a, b) => {
      if (a.folder !== b.folder) return a.folder ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });
    node.children?.forEach(sortTree);
  };

  sortTree(root);
  return root.children;
}

export default function FileTree({ files, selectedPath, onSelect, onContextMenu, view = "tree" }) {
  const tree = buildTree(files);

  if (!tree.length) {
    return (
      <div className="grid h-full min-h-40 place-items-center rounded-xl border border-dashed border-white/[0.07] bg-white/[0.012]">
        <div className="text-center">
          <div className="text-[10px] font-medium text-white/35">No matching files</div>
          <div className="mt-1 text-[8px] text-white/15">Try a different search term.</div>
        </div>
      </div>
    );
  }

  if (view === "list") {
    const flat = [];
    const walk = (nodes) => nodes.forEach((node) => {
      if (node.folder) walk(node.children || []);
      else flat.push(node);
    });
    walk(tree);
    return (
      <div className="grid grid-cols-1 gap-0.5 lg:grid-cols-2">
        {flat.map((node) => (
          <FileTreeNode key={node.path} node={node} depth={0} selectedPath={selectedPath} onSelect={onSelect} onContextMenu={onContextMenu} />
        ))}
      </div>
    );
  }

  return (
    <div className="select-none">
      {tree.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} selectedPath={selectedPath} onSelect={onSelect} onContextMenu={onContextMenu} />
      ))}
    </div>
  );
}
