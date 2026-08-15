import React from "react";
// import { Github } from "lucide-react";

const Login = () => {
  const handleGithubLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/auth/github`;
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">

          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="DEVSPA"
              className="mx-auto h-16 w-16 object-contain mb-5"
            />

            <h1 className="text-3xl font-semibold tracking-[0.15em]">
              DEVSPA
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Your Developer Operating System
            </p>
          </div>

      <button
  type="button"
  onClick={() => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/auth/github`;
  }}
  className="
    w-full
    flex
    items-center
    justify-center
    gap-3
    rounded-xl
    bg-white
    px-5
    py-3.5
    text-sm
    font-medium
    text-black
    transition-all
    duration-300
    hover:bg-white/90
    active:scale-[0.98]
  "
>
  {/* GitHub Icon */}
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.02c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.08.78 2.18v3.23c0 .3.21.65.79.54A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>

  Continue with GitHub
</button>

          <p className="mt-6 text-center text-[11px] leading-5 text-white/25">
            By continuing, you allow DEVSPA to securely connect
            with your GitHub account.
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
