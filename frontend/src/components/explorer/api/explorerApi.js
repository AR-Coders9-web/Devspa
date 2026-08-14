export const explorerApi = (baseUrl = "http://localhost:5001/api/explorer") => ({
  importRepository: (repository) => fetch(`${baseUrl}/workspaces/import`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repository })
  }).then(async (r) => { const b = await r.json(); if (!r.ok) throw new Error(b.error || "Import failed"); return b; }),
  getWorkspace: (id) => fetch(`${baseUrl}/workspaces/${id}`).then(async (r) => { const b = await r.json(); if (!r.ok) throw new Error(b.error || "Workspace fetch failed"); return b; }),
  getFile: (id, path) => fetch(`${baseUrl}/workspaces/${id}/file?path=${encodeURIComponent(path)}`).then(async (r) => { const b = await r.json(); if (!r.ok) throw new Error(b.error || "File fetch failed"); return b; }),
  saveFile: (id, path, content) => fetch(`${baseUrl}/workspaces/${id}/files`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, content })
  }).then(async (r) => { const b = await r.json(); if (!r.ok) throw new Error(b.error || "Save failed"); return b; }),
  commit: (id, message) => fetch(`${baseUrl}/workspaces/${id}/commit`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message })
  }).then(async (r) => { const b = await r.json(); if (!r.ok) throw new Error(b.error || "Commit failed"); return b; })
});
