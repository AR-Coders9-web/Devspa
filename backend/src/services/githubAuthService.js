const GITHUB_APP_SLUG =
  process.env.GITHUB_APP_SLUG || "devspa-os";

const getGithubInstallationUrl = () => {
  return `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;
};

const getGithubUserFromInstallation = async (installationId) => {
  const {
    getInstallation,
  } = require("./githubAppService");

  const installation =
    await getInstallation(installationId);

  const account = installation.account;

  if (!account) {
    throw new Error(
      "GitHub installation account was not returned."
    );
  }

  return {
    id: account.id,
    login:
      account.login ||
      account.name ||
      "github-user",
    name:
      account.name ||
      account.login ||
      "GitHub User",
    avatarUrl:
      account.avatar_url || null,
    githubUrl:
      account.html_url || null,
  };
};

module.exports = {
  getGithubInstallationUrl,
  getGithubUserFromInstallation,
};