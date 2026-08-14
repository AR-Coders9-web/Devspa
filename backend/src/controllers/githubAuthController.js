const {
  getInstallations,
  getInstallation,
} = require("../services/githubAppService");

const getFrontendUrl = () =>
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const getInstallUrl = () => {
  const slug = String(
    process.env.GITHUB_APP_SLUG ||
      "devspa-os"
  ).trim();

  return `https://github.com/apps/${encodeURIComponent(
    slug
  )}/installations/new`;
};

/* =========================================================
   CONTINUE WITH GITHUB
========================================================= */

const startGithubAuth =
  async (req, res) => {
    try {
      const installations =
        await getInstallations();

      /*
       * Optional explicit installation ID.
       * Useful if the app later has multiple installations.
       */
      const configuredId =
        process.env.GITHUB_INSTALLATION_ID;

      let installation = null;

      if (configuredId) {
        installation =
          installations.find(
            (item) =>
              String(item.id) ===
              String(configuredId)
          ) || null;
      }

      /*
       * For the current DEVSPA setup,
       * use the first existing installation.
       */
      if (
        !installation &&
        installations.length === 1
      ) {
        installation =
          installations[0];
      }

      /*
       * Already installed:
       * DO NOT send the user to GitHub again.
       */
      if (installation?.id) {
        req.session.githubInstallationId =
          installation.id;

        if (installation.account) {
          req.session.user = {
            id:
              installation.account.id,
            login:
              installation.account
                .login ||
              installation.account
                .name ||
              null,
            name:
              installation.account
                .name ||
              installation.account
                .login ||
              null,
            avatarUrl:
              installation.account
                .avatar_url ||
              null,
            githubUrl:
              installation.account
                .html_url ||
              null,
          };
        }

        await new Promise(
          (resolve, reject) => {
            req.session.save(
              (error) => {
                if (error) {
                  reject(error);
                } else {
                  resolve();
                }
              }
            );
          }
        );

        console.log(
          "GitHub App session restored:",
          installation.account
            ?.login ||
            "unknown",
          installation.id
        );

        return res.redirect(
          getFrontendUrl()
        );
      }

      /*
       * App isn't installed yet.
       * Send user to GitHub installation.
       */
      return res.redirect(
        getInstallUrl()
      );
    } catch (error) {
      console.error(
        "GitHub auth start error:",
        error
      );

      return res.redirect(
        `${getFrontendUrl()}/?authError=github_app_failed`
      );
    }
  };

/* =========================================================
   GITHUB APP INSTALLATION CALLBACK
========================================================= */

const githubCallback =
  async (req, res) => {
    try {
      const {
        installation_id,
        setup_action,
      } = req.query;

      if (!installation_id) {
        return res.redirect(
          `${getFrontendUrl()}/?authError=github_installation_missing`
        );
      }

      /*
       * Never blindly trust installation_id.
       * Verify it through the GitHub App API.
       */
      const installation =
        await getInstallation(
          installation_id
        );

      if (!installation?.id) {
        throw new Error(
          "GitHub installation could not be verified."
        );
      }

      req.session.githubInstallationId =
        installation.id;

      if (installation.account) {
        req.session.user = {
          id:
            installation.account.id,
          login:
            installation.account
              .login ||
            installation.account
              .name ||
            null,
          name:
            installation.account
              .name ||
            installation.account
              .login ||
            null,
          avatarUrl:
            installation.account
              .avatar_url ||
            null,
          githubUrl:
            installation.account
              .html_url ||
            null,
        };
      }

      await new Promise(
        (resolve, reject) => {
          req.session.save(
            (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            }
          );
        }
      );

      console.log(
        "GitHub App installation connected:",
        installation.account
          ?.login ||
          "unknown",
        installation.id,
        setup_action ||
          "unknown"
      );

      return res.redirect(
        getFrontendUrl()
      );
    } catch (error) {
      console.error(
        "GitHub App callback error:",
        error
      );

      if (res.headersSent) {
        return;
      }

      return res.redirect(
        `${getFrontendUrl()}/?authError=github_app_failed`
      );
    }
  };

/* =========================================================
   CURRENT USER
========================================================= */

const getCurrentUser =
  async (req, res) => {
    try {
      /*
       * First use session if available.
       */
      if (req.session?.user) {
        return res.json({
          authenticated: true,
          user: req.session.user,
        });
      }

      /*
       * Session may disappear after nodemon restart.
       * Recover directly from GitHub App installation.
       */
      const installations =
        await getInstallations();

      if (!installations.length) {
        return res.status(401).json({
          authenticated: false,
          user: null,
        });
      }

      let installation = null;

      const configuredId =
        process.env.GITHUB_INSTALLATION_ID;

      if (configuredId) {
        installation =
          installations.find(
            (item) =>
              String(item.id) ===
              String(configuredId)
          ) || null;
      }

      if (
        !installation &&
        installations.length === 1
      ) {
        installation =
          installations[0];
      }

      if (!installation) {
        return res.status(409).json({
          authenticated: false,
          user: null,
          message:
            "Multiple GitHub App installations found.",
        });
      }

      const user = {
        id:
          installation.account?.id ||
          null,
        login:
          installation.account
            ?.login ||
          installation.account
            ?.name ||
          null,
        name:
          installation.account
            ?.name ||
          installation.account
            ?.login ||
          null,
        avatarUrl:
          installation.account
            ?.avatar_url ||
          null,
        githubUrl:
          installation.account
            ?.html_url ||
          null,
      };

      req.session.githubInstallationId =
        installation.id;

      req.session.user = user;

      await new Promise(
        (resolve) => {
          req.session.save(
            () => resolve()
          );
        }
      );

      return res.json({
        authenticated: true,
        user,
      });
    } catch (error) {
      console.error(
        "Get current GitHub user error:",
        error
      );

      return res.status(500).json({
        authenticated: false,
        user: null,
        message:
          "Unable to restore GitHub session.",
      });
    }
  };

/* =========================================================
   LOGOUT
========================================================= */

const logout =
  (req, res) => {
    req.session.destroy(
      (error) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message:
              "Logout failed.",
          });
        }

        res.clearCookie(
          "devspa.sid"
        );

        return res.json({
          success: true,
          message:
            "Logged out successfully.",
        });
      }
    );
  };

module.exports = {
  startGithubAuth,
  githubCallback,
  getCurrentUser,
  logout,
};