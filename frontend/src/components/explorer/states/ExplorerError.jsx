import React from "react";

export default function ExplorerError({ message, onRetry }) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-xs rounded-lg border border-red-400/10 bg-red-400/[0.025] p-4 text-center">
        <div className="text-[10px] font-semibold text-red-300/70">
          Explorer couldn't load the workspace
        </div>
        <div className="mt-1.5 text-[9px] leading-4 text-white/30">
          {message || "Something went wrong while loading the file tree."}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[9px] text-white/50 hover:bg-white/[0.05] hover:text-white"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
