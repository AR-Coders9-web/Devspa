import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
  });

  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const checkAuthentication = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Authentication check failed");
        }

        const data = await response.json();

        if (!cancelled) {
          setAuthState({
            loading: false,
            authenticated: data.authenticated === true,
          });
        }
      } catch (error) {
        console.error("Authentication check error:", error);

        if (!cancelled) {
          setAuthState({
            loading: false,
            authenticated: false,
          });
        }
      }
    };

    checkAuthentication();

    return () => {
      cancelled = true;
    };
  }, []);

  // Don't render or redirect while checking the session
  if (authState.loading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <p className="text-sm text-white/40">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated â†’ login
  if (!authState.authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Authenticated â†’ render protected page
  return children;
};

export default ProtectedRoute;
