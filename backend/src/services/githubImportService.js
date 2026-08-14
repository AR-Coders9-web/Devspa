const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');

const GITHUB_API = 'https://api.github.com';
const WORKSPACES_ROOT = path.resolve(__dirname, '..', '..', 'workspaces');
const MAX_FILES = 5000;
const MAX_INLINE_TEXT = 1024 * 1024;
const MAX_PREVIEW_IMAGE = 2 * 1024 * 1024;

const TEXT_EXTENSIONS = new Set([
  'js','jsx','ts','tsx','mjs','cjs','html','css','scss','sass','less',
  'json','md','mdx','txt','py','java','c','h','cpp','hpp','cc','cs','go',
  'rs','php','rb','sql','sh','bash','zsh','yml','yaml','xml','svg','vue',
  'svelte','astro','env','gitignore','gitattributes','editorconfig','ini',
  'toml','graphql','gql','lock','config'
]);

const IMAGE_MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
  bmp: 'image/bmp', avif: 'image/avif'
};

const sanitizeWorkspaceId = (value) =>
  String(value || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120) || 'default';

const getWorkspacePath = (workspaceId) =>
  path.resolve(WORKSPACES_ROOT, sanitizeWorkspaceId(workspaceId));

const safeWorkspaceFilePath = (root, relativePath) => {
  const normalized = String(relativePath || '').replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error('Invalid workspace file path.');
  }
  const target = path.resolve(root, ...normalized.split('/'));
  const prefix = `${path.resolve(root)}${path.sep}`;
  if (!target.startsWith(prefix)) throw new Error('Invalid workspace file path.');
  return target;
};

const getGitHubHeaders = (accessToken) => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'DEVSPA-Code-Editor'
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
};

const githubRequest = async (endpoint, accessToken, options = {}) => {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: { ...getGitHubHeaders(accessToken), ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const error = new Error(data?.message || `GitHub request failed (${response.status}).`);
    error.status = response.status;
    error.documentation_url = data?.documentation_url;
    throw error;
  }
  return data;
};

const parseRepositoryUrl = (repoUrl) => {
  try {
    const url = new URL(String(repoUrl).trim());
    if (url.hostname.toLowerCase() !== 'github.com') throw new Error();
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) throw new Error();
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/i, '')
    };
  } catch {
    throw new Error('Invalid GitHub repository URL.');
  }
};

const getLanguage = (fileName) => {
  const lower = fileName.toLowerCase();
  const extension = lower.includes('.') ? lower.split('.').pop() : lower;
  const languages = {
    js:'javascript', jsx:'javascript', mjs:'javascript', cjs:'javascript',
    ts:'typescript', tsx:'typescript', html:'html', css:'css', scss:'scss',
    sass:'scss', less:'less', json:'json', md:'markdown', mdx:'markdown',
    py:'python', java:'java', c:'c', h:'c', cpp:'cpp', hpp:'cpp', cc:'cpp',
    cs:'csharp', go:'go', rs:'rust', php:'php', rb:'ruby', sql:'sql',
    sh:'shell', bash:'shell', zsh:'shell', yml:'yaml', yaml:'yaml', xml:'xml',
    svg:'xml', vue:'html', svelte:'html', astro:'html', graphql:'graphql',
    gql:'graphql', toml:'ini', ini:'ini'
  };
  return languages[extension] || 'plaintext';
};

const isImageFile = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop();
  return Boolean(IMAGE_MIME[extension]);
};

const isTextFile = (fileName) => {
  const lower = fileName.toLowerCase();
  const extension = lower.includes('.') ? lower.split('.').pop() : lower;
  return TEXT_EXTENSIONS.has(extension) || ['.gitignore','.gitattributes','.editorconfig'].includes(lower);
};

const fileMeta = (relativePath, stat) => {
  const name = path.posix.basename(relativePath);
  const image = isImageFile(name);
  const text = isTextFile(name);
  return {
    id: relativePath,
    name,
    path: relativePath,
    type: 'file',
    language: image ? 'image' : getLanguage(name),
    binary: !text,
    isImage: image,
    modified: false,
    size: stat.size,
    content: null,
    contentLoaded: false,
    contentUrl: `/api/github/workspace/${encodeURIComponent(stat.workspaceId)}/file?path=${encodeURIComponent(relativePath)}`,
    previewUrl: image ? `/api/github/workspace/${encodeURIComponent(stat.workspaceId)}/file?path=${encodeURIComponent(relativePath)}` : null
  };
};

const walkFiles = async (root, current = root, output = []) => {
  if (output.length >= MAX_FILES) return output;
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (output.length >= MAX_FILES) break;
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.devspa.json' || entry.name === '.devspa-changes.json') continue;
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(root, full, output);
    } else if (entry.isFile()) {
      output.push(path.relative(root, full).split(path.sep).join('/'));
    }
  }
  return output;
};

const downloadArchive = async (owner, repo, branch, accessToken) => {
  const endpoint = `/repos/${owner}/${repo}/zipball/${encodeURIComponent(branch)}`;
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: getGitHubHeaders(accessToken),
    redirect: 'manual'
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) throw new Error('GitHub did not provide an archive download URL.');
    const redirected = await fetch(location);
    if (!redirected.ok) throw new Error(`Repository archive download failed (${redirected.status}).`);
    return Buffer.from(await redirected.arrayBuffer());
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try { message = JSON.parse(text)?.message || text; } catch {}
    throw new Error(message || `Repository archive download failed (${response.status}).`);
  }

  return Buffer.from(await response.arrayBuffer());
};
const importRepositoryFromGitTree = async (
  owner,
  repo,
  branch,
  accessToken,
  workspaceRoot
) => {
  // Get branch reference
  const ref = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(branch)}`,
    accessToken
  );

  const commitSha = ref.object?.sha;

  if (!commitSha) {
    throw new Error(`Could not resolve branch '${branch}'.`);
  }

  // Get complete repository tree
  const tree = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(commitSha)}?recursive=1`,
    accessToken
  );

  if (!Array.isArray(tree.tree)) {
    throw new Error('GitHub returned an invalid repository tree.');
  }

  if (tree.truncated) {
    console.warn(
      `GitHub tree was truncated for ${owner}/${repo}. Importing first ${MAX_FILES} files.`
    );
  }

  const files = tree.tree
    .filter((item) => item.type === 'blob' && item.path)
    .filter((item) => !item.path.startsWith('.git/'))
    .filter((item) => !item.path.split('/').includes('node_modules'))
    .slice(0, MAX_FILES);

  console.log(
    `GitHub tree import: ${files.length} files found in ${owner}/${repo}`
  );

  // Download blobs in small batches so we don't hammer GitHub
  const CONCURRENCY = 8;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (file) => {
        const target = safeWorkspaceFilePath(
          workspaceRoot,
          file.path
        );

        await fs.mkdir(
          path.dirname(target),
          { recursive: true }
        );

        const blob = await githubRequest(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs/${encodeURIComponent(file.sha)}`,
          accessToken
        );

        if (!blob?.content) {
          throw new Error(
            `GitHub returned no content for '${file.path}'.`
          );
        }

        let buffer;

        if (blob.encoding === 'base64') {
          const base64 = blob.content.replace(/\s/g, '');
          buffer = Buffer.from(base64, 'base64');
        } else if (typeof blob.content === 'string') {
          buffer = Buffer.from(blob.content, 'utf8');
        } else {
          throw new Error(
            `Unsupported blob encoding for '${file.path}'.`
          );
        }

        await fs.writeFile(target, buffer);
      })
    );

    console.log(
      `Imported ${Math.min(i + CONCURRENCY, files.length)}/${files.length} files`
    );
  }

  return files.length;
};
const writeArchive = async (workspaceRoot, archiveBuffer) => {
  const zip = new AdmZip(archiveBuffer);
  const entries = zip.getEntries();
  let rootPrefix = '';
  const firstFile = entries.find((entry) => !entry.isDirectory && entry.entryName);
  if (firstFile) rootPrefix = firstFile.entryName.split('/')[0];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    let relative = entry.entryName.replace(/\\/g, '/');
    if (rootPrefix && relative.startsWith(`${rootPrefix}/`)) relative = relative.slice(rootPrefix.length + 1);
    if (!relative || relative.startsWith('.git/')) continue;
    const target = safeWorkspaceFilePath(workspaceRoot, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, entry.getData());
  }
};

const createFileDescriptors = async (workspaceId) => {
  const root = getWorkspacePath(workspaceId);
  const relativePaths = await walkFiles(root);
  const files = [];
  let inlineBudget = 6 * 1024 * 1024;
  for (const relativePath of relativePaths) {
    const target = safeWorkspaceFilePath(root, relativePath);
    const stat = await fs.stat(target);
    const meta = fileMeta(relativePath, { ...stat, workspaceId });
    if (isTextFile(meta.name) && stat.size <= MAX_INLINE_TEXT && inlineBudget > 0) {
      const content = await fs.readFile(target, 'utf8');
      if (Buffer.byteLength(content, 'utf8') <= inlineBudget) {
        meta.content = content;
        meta.contentLoaded = true;
        inlineBudget -= Buffer.byteLength(content, 'utf8');
      }
    }
    if (meta.isImage && stat.size <= MAX_PREVIEW_IMAGE) {
      const ext = meta.name.toLowerCase().split('.').pop();
      const data = await fs.readFile(target);
      meta.previewDataUrl = `data:${IMAGE_MIME[ext]};base64,${data.toString('base64')}`;
    } else {
      meta.previewDataUrl = null;
    }
    files.push(meta);
  }
  let changedPaths = [];
  try {
    const raw = await fs.readFile(
      path.join(root, '.devspa-changes.json'),
      'utf8'
    );
    const parsed = JSON.parse(raw);
    changedPaths = Array.isArray(parsed) ? parsed : [];
  } catch {}

  const changed = new Set(changedPaths);
  files.forEach((file) => {
    if (changed.has(file.path)) file.status = 'modified';
  });

  files.sort((a,b) =>
    a.path.localeCompare(b.path, undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  );
  return files;
};

const getWorkspaceSnapshot = async (workspaceId) => {
  const safeId = sanitizeWorkspaceId(workspaceId);
  if (!safeId || safeId === 'default') {
    throw new Error('A valid workspace ID is required.');
  }

  const root = getWorkspacePath(safeId);
  await fs.access(root);

  let metadata = {};
  try {
    metadata = JSON.parse(
      await fs.readFile(path.join(root, '.devspa.json'), 'utf8')
    );
  } catch {}

  const files = await createFileDescriptors(safeId);

  return {
    workspaceId: safeId,
    repository: {
      id: metadata.repositoryId || safeId,
      name: metadata.repo || '',
      fullName: metadata.fullName || [metadata.owner, metadata.repo].filter(Boolean).join('/'),
      owner: metadata.owner || '',
      private: false,
      defaultBranch: metadata.branch || 'main',
      htmlUrl: metadata.owner && metadata.repo
        ? `https://github.com/${metadata.owner}/${metadata.repo}`
        : '',
    },
    files,
    totalFiles: files.length,
  };
};

const importRepository = async (
  repoUrl,
  accessToken = null
) => {
  const { owner, repo } =
    parseRepositoryUrl(repoUrl);

  console.log(
    `Starting GitHub repository import: ${owner}/${repo}`
  );

  // --------------------------------------------------
  // 1. Get repository metadata
  // --------------------------------------------------

  const repository = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    accessToken
  );

  const defaultBranch =
    repository.default_branch || 'main';

  const workspaceId =
    sanitizeWorkspaceId(repository.id);

  const workspaceRoot =
    getWorkspacePath(workspaceId);

  console.log(
    `Repository: ${repository.full_name}`
  );

  console.log(
    `Branch: ${defaultBranch}`
  );

  console.log(
    `Workspace: ${workspaceId}`
  );

  // --------------------------------------------------
  // 2. Prepare workspace
  // --------------------------------------------------

  await fs.mkdir(
    WORKSPACES_ROOT,
    { recursive: true }
  );

  await fs.rm(
    workspaceRoot,
    {
      recursive: true,
      force: true
    }
  );

  await fs.mkdir(
    workspaceRoot,
    {
      recursive: true
    }
  );

  // --------------------------------------------------
  // 3. IMPORT USING GIT TREE API
  // --------------------------------------------------

  let importedCount = 0;

  try {
    importedCount =
      await importRepositoryFromGitTree(
        owner,
        repo,
        defaultBranch,
        accessToken,
        workspaceRoot
      );

    console.log(
      `Git Tree import successful: ${importedCount} files`
    );

  } catch (treeError) {

    console.error(
      'Git Tree import failed:',
      treeError
    );

    // ------------------------------------------------
    // FALLBACK: ZIP ARCHIVE
    // ------------------------------------------------

    console.log(
      'Falling back to GitHub ZIP archive...'
    );

    try {
      const archive =
        await downloadArchive(
          owner,
          repo,
          defaultBranch,
          accessToken
        );

      await fs.rm(
        workspaceRoot,
        {
          recursive: true,
          force: true
        }
      );

      await fs.mkdir(
        workspaceRoot,
        {
          recursive: true
        }
      );

      await writeArchive(
        workspaceRoot,
        archive
      );

      const importedFiles =
        await walkFiles(
          workspaceRoot
        );

      importedCount =
        importedFiles.length;

      console.log(
        `ZIP fallback successful: ${importedCount} files`
      );

    } catch (archiveError) {

      console.error(
        'GitHub ZIP fallback failed:',
        archiveError
      );

      // Remove broken workspace
      await fs.rm(
        workspaceRoot,
        {
          recursive: true,
          force: true
        }
      );

      throw new Error(
        `Unable to import GitHub repository '${repository.full_name}'. ` +
        `Git Tree: ${treeError.message}. ` +
        `ZIP fallback: ${archiveError.message}.`
      );
    }
  }

  // --------------------------------------------------
  // 4. Create file descriptors
  // --------------------------------------------------

  const files =
    await createFileDescriptors(
      workspaceId
    );

  // --------------------------------------------------
  // 5. Store workspace metadata
  // --------------------------------------------------

  await fs.writeFile(
    path.join(
      workspaceRoot,
      '.devspa.json'
    ),
    JSON.stringify(
      {
        owner,
        repo,
        branch: defaultBranch,
        repositoryId: repository.id,
        fullName: repository.full_name
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(
    `GitHub repository import completed: ${repository.full_name}`
  );

  // --------------------------------------------------
  // 6. Return same response structure as before
  // --------------------------------------------------

  return {
    repository: {
      id: repository.id,
      name: repository.name,
      fullName: repository.full_name,
      owner:
        repository.owner?.login ||
        owner,
      private:
        Boolean(repository.private),
      defaultBranch,
      htmlUrl:
        repository.html_url
    },

    workspaceId,

    files,

    totalFiles:
      files.length,

    importedFiles:
      files.length,

    truncated:
      files.length >= MAX_FILES,

    source:
      'github-git-tree'
  };
};

const saveWorkspaceFiles = async (workspaceId, files = []) => {
  const root = getWorkspacePath(workspaceId);
  await fs.access(root);
  const saved = [];
  for (const file of files) {
    if (!file?.path || typeof file.content !== 'string') continue;
    const target = safeWorkspaceFilePath(root, file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content, 'utf8');
    saved.push(file.path);
  }

  if (saved.length) {
    let existing = [];
    try {
      const raw = await fs.readFile(
        path.join(root, '.devspa-changes.json'),
        'utf8'
      );
      const parsed = JSON.parse(raw);
      existing = Array.isArray(parsed) ? parsed : [];
    } catch {}

    const merged = [...new Set([...existing, ...saved])];
    await fs.writeFile(
      path.join(root, '.devspa-changes.json'),
      JSON.stringify(merged, null, 2),
      'utf8'
    );
  }

  return { savedFiles: saved, count: saved.length };
};

const readWorkspaceFile = async (workspaceId, relativePath) => {
  const root = getWorkspacePath(workspaceId);
  const target = safeWorkspaceFilePath(root, relativePath);
  return fs.readFile(target);
};

const deleteWorkspaceFile = async (workspaceId, relativePath) => {
  const root = getWorkspacePath(workspaceId);
  const target = safeWorkspaceFilePath(root, relativePath);

  const stat = await fs.stat(target);
  if (!stat.isFile()) {
    throw new Error("Only files can be deleted from Explorer.");
  }

  await fs.rm(target, { force: true });

  // Remove empty parent folders, but never remove the workspace root.
  let current = path.dirname(target);
  while (current !== root && current.startsWith(root + path.sep)) {
    try {
      const entries = await fs.readdir(current);
      if (entries.length) break;
      await fs.rmdir(current);
      current = path.dirname(current);
    } catch {
      break;
    }
  }

  return {
    deleted: true,
    path: relativePath,
  };
};


const createBlob = async (owner, repo, content, accessToken) =>
  githubRequest(`/repos/${owner}/${repo}/git/blobs`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, encoding: 'utf-8' })
  });

const commitRepository = async (
  repoUrl,
  { branch, message, files },
  accessToken
) => {
  if (!accessToken) {
    throw new Error(
      'GitHub login is required before Commit & Push.'
    );
  }

  const { owner, repo } =
    parseRepositoryUrl(repoUrl);

  // Get repository metadata first
  const repository =
    await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      accessToken
    );

  const targetBranch =
    branch ||
    repository.default_branch ||
    'main';

  console.log(
    `Commit target: ${owner}/${repo}@${targetBranch}`
  );

  const ref =
    await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(targetBranch)}`,
      accessToken
    );

  const parentSha =
    ref.object?.sha;

  if (!parentSha) {
    throw new Error(
      `Could not resolve branch '${targetBranch}'.`
    );
  }

  const parentCommit =
    await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${parentSha}`,
      accessToken
    );

  const baseTreeSha =
    parentCommit.tree?.sha;

  if (!baseTreeSha) {
    throw new Error(
      'Could not resolve the current repository tree.'
    );
  }

  const validFiles =
    (Array.isArray(files)
      ? files
      : [])
      .filter(
        (file) =>
          file?.path &&
          (typeof file.content === 'string' || file.deleted === true)
      )
      .slice(0, 200);

  if (!validFiles.length) {
    throw new Error(
      'No valid text files to commit.'
    );
  }

  const treeEntries = [];

  for (const file of validFiles) {
    // GitHub's Git Trees API deletes an existing path when sha is null.
    if (file.deleted === true) {
      treeEntries.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: null
      });
      continue;
    }

    const blob =
      await createBlob(
        owner,
        repo,
        file.content,
        accessToken
      );

    treeEntries.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    });
  }

  const newTree =
    await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees`,
      accessToken,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeEntries
        })
      }
    );

  const newCommit =
    await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits`,
      accessToken,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          message,
          tree: newTree.sha,
          parents: [parentSha]
        })
      }
    );

  await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs/heads/${encodeURIComponent(targetBranch)}`,
    accessToken,
    {
      method: 'PATCH',

      headers: {
        'Content-Type':
          'application/json'
      },

      body: JSON.stringify({
        sha: newCommit.sha,
        force: false
      })
    }
  );

  try {
    const workspaceId = sanitizeWorkspaceId(repository.id);
    const root = getWorkspacePath(workspaceId);
    await fs.rm(path.join(root, '.devspa-changes.json'), { force: true });
  } catch {}

  return {
    commitSha:
      newCommit.sha,

    commitUrl:
      newCommit.html_url,

    branch:
      targetBranch,

    filesCommitted:
      validFiles.length
  };
};

module.exports = {
  WORKSPACES_ROOT,
  sanitizeWorkspaceId,
  getWorkspacePath,
  safeWorkspaceFilePath,
  importRepository,
  saveWorkspaceFiles,
  readWorkspaceFile,
  deleteWorkspaceFile,
  commitRepository,
  getWorkspaceSnapshot,
  isImageFile,
  IMAGE_MIME
};
