import React from "react";
import FileIcon from "./FileIcon";
import FileStatus from "../components/FileStatus";

export default function FileNode({ file, depth, selected, onSelect, onContextMenu }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onContextMenu={onContextMenu}
      title={file?.path}
      className={[
        "group flex w-full cursor-pointer items-center gap-1.5 rounded-lg py-[5px] text-left text-[9px] transition",
        selected
          ? "bg-white/[0.085] text-white/90 shadow-[inset_2px_0_0_rgba(255,255,255,.55)]"
          : "text-white/42 hover:bg-white/[0.045] hover:text-white/80",
      ].join(" ")}
      style={{ paddingLeft: 24 + depth * 16, paddingRight: 8 }}
    >
      <FileIcon path={file?.path} />
      <span className="min-w-0 flex-1 truncate">{file?.name}</span>
      <FileStatus file={file} />
      <span className="ml-1 hidden text-[8px] text-white/15 group-hover:block">›</span>
    </button>
  );
}
