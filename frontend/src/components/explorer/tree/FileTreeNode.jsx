import React, { useState } from "react";
import FolderNode from "./FolderNode";
import FileNode from "./FileNode";

export default function FileTreeNode({ node, depth, selectedPath, onSelect, onContextMenu }) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.folder) {
    return (
      <FolderNode
        node={node}
        depth={depth}
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
        selectedPath={selectedPath}
        onSelect={onSelect}
        onContextMenu={onContextMenu}
      />
    );
  }

  return (
    <FileNode
      file={node.file}
      depth={depth}
      selected={selectedPath === node.path}
      onSelect={() => onSelect?.(node.file)}
      onContextMenu={(event) => onContextMenu?.(event, node.file)}
    />
  );
}
