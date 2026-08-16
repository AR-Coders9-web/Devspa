const axios = require("axios");

const getFrontendUrl = () =>
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const getGithubClientId = () =>
  process.env.GITHUB_CLIENT_ID;

const getGithubClientSecret = () =>
  process.env.GITHUB_CLIENT_SECRET;

const getCallbackUrl = () =>
  process.env.GITHUB_CALLBACK_URL ||
  "http://localhost:5000/auth/github/callback";

/* =========================================================
   START GITHUB AUTH
========================================================= */

const startGithubAuth = (req, res) => {
  try {
    const clientId = getGithubClientId();

    if (!clientId) {
      console.error(
        "GITHUB_CLIENT_ID is missing."
      );

      return res.redirect(
        `${getFrontendUrl()}/?authError=github_config_missing`
      );
    }

    /*
     * IMPORTANT:
     *
     * Generate a random state value.
     * This prevents CSRF attacks and also makes
     * sure the callback belongs to this browser session.
     */

    const state = require("crypto")
      .randomBytes(32)
      .toString("hex");

    req.session.githubOAuthState = state;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getCallbackUrl(),
      state,
    });

    return res.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`
    );
  } catch (error) {
    console.error(
      "GitHub auth start error:",
      error
    );

    return res.redirect(
      `${getFrontendUrl()}/?authError=github_auth_start_failed`
    );
  }
};

/* =========================================================
   GITHUB OAUTH CALLBACK
========================================================= */

const githubCallback = async (req, res) => {
  try {
    const {
      code,
      state,
      error,
      error_description,
    } = req.query;

    /* -----------------------------------------
       User cancelled authorization
    ----------------------------------------- */

    if (error) {
      console.error(
        "GitHub OAuth error:",
        error,
        error_description || ""
      );

      return res.redirect(
        `${getFrontendUrl()}/login?authError=github_denied`
      );
    }

    /* -----------------------------------------
       Validate OAuth code
    ----------------------------------------- */

    if (!code) {
      return res.redirect(
        `${getFrontendUrl()}/login?authError=github_code_missing`
      );
    }

    /* -----------------------------------------
       Validate state
    ----------------------------------------- */

    if (
      !state ||
      !req.session?.githubOAuthState ||
      state !== req.session.githubOAuthState
    ) {
      console.error(
        "GitHub OAuth state validation failed."
      );

      return res.redirect(
        `${getFrontendUrl()}/login?authError=github_state_invalid`
      );
    }

    /*
     * State has now been consumed.
     */
    delete req.session.githubOAuthState;

    /* -----------------------------------------
       Exchange code for access token
    ----------------------------------------- */

    const tokenResponse =
      await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id:
            getGithubClientId(),

          client_secret:
            getGithubClientSecret(),

          code,

          redirect_uri:
            getCallbackUrl(),
        },
        {
          headers: {
            Accept:
              "application/json",
          },
        }
      );

    const accessToken =
      tokenResponse.data?.access_token;

    if (!accessToken) {
      console.error(
        "GitHub token exchange failed:",
        tokenResponse.data
      );

      return res.redirect(
        `${getFrontendUrl()}/login?authError=github_token_failed`
      );
    }

    /* -----------------------------------------
       Get authenticated GitHub user
    ----------------------------------------- */

    const userResponse =
      await axios.get(
        "https://api.github.com/user",
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            Accept:
              "application/vnd.github+json",

            "X-GitHub-Api-Version":
              "2022-11-28",
          },
        }
      );

    const githubUser =
      userResponse.data;

    if (!githubUser?.id) {
      throw new Error(
        "Unable to retrieve GitHub user."
      );
    }

    /* -----------------------------------------
       Create browser session
    ----------------------------------------- */

    req.session.user = {
      id: githubUser.id,

      login:
        githubUser.login ||
        null,

      name:
        githubUser.name ||
        githubUser.login ||
        null,

      avatarUrl:
        githubUser.avatar_url ||
        null,

      githubUrl:
        githubUser.html_url ||
        null,
    };

    /*
     * Store token server-side in the session.
     *
     * Do NOT send this token to the frontend.
     */
    req.session.githubAccessToken =
      accessToken;

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
      "GitHub user authenticated:",
      githubUser.login
    );

    return res.redirect(
      `${getFrontendUrl()}/home`
    );
  } catch (error) {
    console.error(
      "GitHub OAuth callback error:",
      error.response?.data ||
        error.message ||
        error
    );

    if (res.headersSent) {
      return;
    }

    return res.redirect(
      `${getFrontendUrl()}/login?authError=github_auth_failed`
    );
  }
};

/* =========================================================
   CURRENT USER
========================================================= */

const getCurrentUser = async (
  req,
  res
) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({
        authenticated: false,
        user: null,
      });
    }

    return res.json({
      authenticated: true,
      user: req.session.user,
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
        "Unable to check GitHub session.",
    });
  }
};

/* =========================================================
   LOGOUT
========================================================= */

const logout = (req, res) => {
  req.session.destroy(
    (error) => {
      if (error) {
        console.error(
          "Logout error:",
          error
        );

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