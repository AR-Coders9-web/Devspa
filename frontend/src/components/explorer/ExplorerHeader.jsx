import React from "react";
import { Folder, GitBranch } from "lucide-react";

export default function ExplorerHeader({ repository, fileCount = 0, folderCount = 0 }) {
  const repoName = repository?.fullName || repository?.full_name || repository?.name || "Workspace";
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[.07] bg-[#0c1016] px-4">
      <div className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-300/10 bg-cyan-300/[.05] text-cyan-200/65"><Folder size={16}/></div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-white/90">Explorer</span>
          <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[.12em] ${repository ? "border-emerald-400/20 bg-emerald-400/[.06] text-emerald-300/75" : "border-white/10 bg-white/[.03] text-white/30"}`}>
            {repository ? "SYNCED" : "LOCAL"}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[8px] text-white/30">
          <span className="max-w-[360px] truncate">{repoName}</span><span>•</span><span>{fileCount} files</span><span>•</span><span>{folderCount} folders</span>
        </div>
      </div>
      <div className="ml-auto hidden items-center gap-1.5 rounded-lg border border-white/[.06] bg-white/[.02] px-2 py-1.5 sm:flex">
        <GitBranch size={11} className={repository ? "text-emerald-300/70" : "text-white/20"}/>
        <span className="text-[8px] text-white/30">{repository ? "GitHub workspace" : "Waiting"}</span>
      </div>
    </div>
  );
}
