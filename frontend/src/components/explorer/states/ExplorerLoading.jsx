import React from "react";

export default function ExplorerLoading() {
  return (
    <div className="h-full overflow-hidden p-2">
      {[...Array(12)].map((_, index) => (
        <div
          key={index}
          className="mb-1.5 h-6 animate-pulse rounded-md bg-white/[0.035]"
          style={{ marginLeft: `${(index % 4) * 12}px` }}
        />
      ))}
    </div>
  );
}
