const fs = require("fs");
const path = require("path");
const { createAppAuth } = require("@octokit/auth-app");

const GITHUB_API = "https://api.github.com";

const appId = String(process.env.GITHUB_APP_ID || "").trim();

if (!appId) {
  throw new Error("GITHUB_APP_ID is missing from .env");
}

const resolvePrivateKeyPath = () => {
  const configuredPath = String(
    process.env.GITHUB_PRIVATE_KEY_PATH || ""
  ).trim();

  if (!configuredPath) {
    throw new Error(
      "GITHUB_PRIVATE_KEY_PATH is missing from .env"
    );
  }

  if (path.isAbsolute(configuredPath)) {
    return configuredPath;
  }

  const cwdPath = path.resolve(process.cwd(), configuredPath);

  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  const backendRootPath = path.resolve(
    __dirname,
    "../..",
    configuredPath
  );

  if (fs.existsSync(backendRootPath)) {
    return backendRootPath;
  }

  return cwdPath;
};

const getPrivateKey = () => {
  const keyPath = resolvePrivateKeyPath();

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `GitHub private key not found: ${keyPath}`
    );
  }

  return fs.readFileSync(keyPath, "utf8");
};

const getAppAuth = () => {
  return createAppAuth({
    appId,
    privateKey: getPrivateKey(),
  });
};

const githubAppRequest = async (
  endpoint,
  options = {}
) => {
  const auth = getAppAuth();

  const { token } = await auth({
    type: "app",
  });

  const response = await fetch(
    `${GITHUB_API}${endpoint}`,
    {
      ...options,
      headers: {
        Accept:
          "application/vnd.github+json",
        "X-GitHub-Api-Version":
          "2022-11-28",
        "User-Agent":
          "DEVSPA-Code-Editor",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      message: text || "GitHub API error.",
    };
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        `GitHub API request failed (${response.status}).`
    );

    error.status = response.status;
    error.documentation_url =
      data?.documentation_url;

    throw error;
  }

  return data;
};

/**
 * Get all installations of this GitHub App.
 */
const getInstallations = async () => {
  return githubAppRequest(
    "/app/installations?per_page=100"
  );
};

/**
 * Get one installation by ID.
 */
const getInstallation = async (
  installationId
) => {
  if (!installationId) {
    throw new Error(
      "GitHub installation ID is required."
    );
  }

  return githubAppRequest(
    `/app/installations/${encodeURIComponent(
      installationId
    )}`
  );
};

/**
 * Find which installation owns a repository.
 *
 * This is the important part:
 * DEVSPA no longer depends on an in-memory
 * session containing installationId.
 */
const getRepositoryInstallation = async (
  owner,
  repo
) => {
  if (!owner || !repo) {
    throw new Error(
      "Repository owner and name are required."
    );
  }

  return githubAppRequest(
    `/repos/${encodeURIComponent(
      owner
    )}/${encodeURIComponent(
      repo
    )}/installation`
  );
};

/**
 * Create a fresh installation access token.
 *
 * Installation tokens expire after about one hour,
 * so we intentionally create a fresh one whenever
 * DEVSPA needs GitHub access.
 */
const createInstallationToken = async (
  installationId
) => {
  if (!installationId) {
    throw new Error(
      "GitHub installation ID is required."
    );
  }

  const auth = getAppAuth();

  const authentication =
    await auth({
      type: "installation",
      installationId: Number(
        installationId
      ),
    });

  if (!authentication?.token) {
    throw new Error(
      "GitHub did not return an installation token."
    );
  }

  return {
    token: authentication.token,
    expiresAt:
      authentication.expiresAt || null,
  };
};

module.exports = {
  getInstallations,
  getInstallation,
  getRepositoryInstallation,
  createInstallationToken,
};