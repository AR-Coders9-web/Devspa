import React from "react";
import ModifiedBadge from "./ModifiedBadge";
import ErrorBadge from "./ErrorBadge";
import AIFixedBadge from "./AIFixedBadge";

export default function FileStatus({ file }) {
  const status = file?.status;

  if (status === "error") return <ErrorBadge />;
  if (status === "ai-fixed" || status === "fixed") return <AIFixedBadge />;
  if (status === "modified" || file?.modified) return <ModifiedBadge />;

  return null;
}
