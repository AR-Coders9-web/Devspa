import React, { useEffect, useState } from "react";
import {
  LogOut,
  User,
  Monitor,
  Shield,
  Info,
  Play,
  Image as ImageIcon,
} from "lucide-react";

const STATIC_WALLPAPERS = [
  { name: "Dragon Core", source: "/wallpapers/Wallpaper.png" },
  { name: "Obsidian", source: "/wallpapers/Wallpaper2.png" },
  { name: "Violet Rift", source: "/wallpapers/wallpaper3.png" },
  { name: "Cyber Void", source: "/wallpapers/wallpaper4.png" },
  { name: "Cyber Violet", source: "/wallpapers/wallpaper5.png" },
];

const LIVE_WALLPAPERS = [
  { name: "Live 01", source: "/wallpapers/live/live1.mp4" },
  { name: "Live 02", source: "/wallpapers/live/live2.mp4" },
];

const readWallpaper = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("devspa-wallpaper") || "{}");
    return {
      type: saved.type === "live" ? "live" : "static",
      source: saved.source || STATIC_WALLPAPERS[0].source,
    };
  } catch {
    return { type: "static", source: STATIC_WALLPAPERS[0].source };
  }
};

const selectWallpaper = (type, source) => {
  localStorage.setItem("devspa-wallpaper", JSON.stringify({ type, source }));
  window.dispatchEvent(new Event("devspa-wallpaper-change"));
};

const SettingsWindow = () => {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState(readWallpaper);

  useEffect(() => {
    const sync = () => setWallpaper(readWallpaper());
    window.addEventListener("devspa-wallpaper-change", sync);
    return () => window.removeEventListener("devspa-wallpaper-change", sync);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Logout failed");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-black/20 text-white">
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <Monitor size={19} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-medium">Settings</h2>
              <p className="text-xs text-white/35">
                Configure your DEVSPA workspace
              </p>
            </div>
          </div>
        </div>

        <section className="mb-7">
          <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
            Appearance
          </p>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
            <button
              type="button"
              onClick={() => setDesktopOpen((value) => !value)}
              className="flex w-full items-center gap-4 border-b border-white/10 px-4 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <Monitor size={18} strokeWidth={1.5} className="text-white/60" />
              <div>
                <p className="text-sm text-white/80">Desktop</p>
                <p className="mt-1 text-xs text-white/30">
                  Wallpaper and desktop preferences
                </p>
              </div>
              <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/40">
                {wallpaper.type === "live" ? "LIVE" : "STATIC"}
              </span>
            </button>

            {desktopOpen && (
              <div className="p-4">
                <div className="mb-4 flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
                  <button
                    type="button"
                    onClick={() =>
                      selectWallpaper(
                        "static",
                        wallpaper.type === "static"
                          ? wallpaper.source
                          : STATIC_WALLPAPERS[0].source
                      )
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs transition ${
                      wallpaper.type === "static"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:bg-white/[0.04]"
                    }`}
                  >
                    <ImageIcon size={14} />
                    Static
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selectWallpaper(
                        "live",
                        wallpaper.type === "live"
                          ? wallpaper.source
                          : LIVE_WALLPAPERS[0].source
                      )
                    }
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs transition ${
                      wallpaper.type === "live"
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Play size={14} />
                    Live
                  </button>
                </div>

                {wallpaper.type === "static" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {STATIC_WALLPAPERS.map((item) => (
                      <button
                        key={item.source}
                        type="button"
                        onClick={() => selectWallpaper("static", item.source)}
                        className={`overflow-hidden rounded-lg border text-left transition ${
                          wallpaper.source === item.source
                            ? "border-violet-400/70 ring-1 ring-violet-400/30"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <img
                          src={item.source}
                          alt=""
                          className="h-16 w-full object-cover"
                        />
                        <div className="truncate px-2 py-2 text-[11px] text-white/60">
                          {item.name}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {LIVE_WALLPAPERS.map((item) => (
                      <button
                        key={item.source}
                        type="button"
                        onClick={() => selectWallpaper("live", item.source)}
                        className={`overflow-hidden rounded-lg border text-left transition ${
                          wallpaper.source === item.source
                            ? "border-violet-400/70 ring-1 ring-violet-400/30"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <video
                          src={item.source}
                          muted
                          autoPlay
                          loop
                          playsInline
                          preload="metadata"
                          className="h-16 w-full object-cover"
                        />
                        <div className="flex items-center gap-1.5 px-2 py-2 text-[11px] text-white/60">
                          <Play size={10} />
                          {item.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-[10px] text-white/25">
                  Saved locally and restored automatically when DEVSPA starts.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mb-7">
          <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
            Account
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.025]">
            <div className="flex items-center gap-4 px-4 py-4">
              <User size={18} strokeWidth={1.5} className="text-white/60" />
              <div>
                <p className="text-sm text-white/80">GitHub Account</p>
                <p className="mt-1 text-xs text-white/30">Connected account</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-7">
          <p className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
            Security
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.025]">
            <div className="flex items-center gap-4 px-4 py-4">
              <Shield size={18} strokeWidth={1.5} className="text-white/60" />
              <div>
                <p className="text-sm text-white/80">Session</p>
                <p className="mt-1 text-xs text-white/30">
                  Your DEVSPA session is protected
                </p>
              </div>
              <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 text-left transition-all duration-200 hover:border-red-400/20 hover:bg-red-500/[0.06] group"
          >
            <LogOut
              size={18}
              strokeWidth={1.5}
              className="text-white/50 transition-colors group-hover:text-red-400"
            />
            <div>
              <p className="text-sm text-white/75 group-hover:text-red-300">
                Logout
              </p>
              <p className="mt-1 text-xs text-white/30">
                Sign out of your DEVSPA session
              </p>
            </div>
          </button>
        </section>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-white/20">
          <Info size={12} />
          <span>DEVSPA Core v0.1</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsWindow;