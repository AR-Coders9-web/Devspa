import React, { useEffect, useState } from "react";

const DEFAULT_WALLPAPER = "/wallpapers/Wallpaper.png";

const getSavedWallpaper = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("devspa-wallpaper") || "{}");
    return {
      type: saved.type === "live" ? "live" : "static",
      source: saved.source || DEFAULT_WALLPAPER,
    };
  } catch {
    return { type: "static", source: DEFAULT_WALLPAPER };
  }
};

const Wallpaper = () => {
  const [wallpaper, setWallpaper] = useState(getSavedWallpaper);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => {
      setLoaded(false);
      setWallpaper(getSavedWallpaper());
    };

    window.addEventListener("devspa-wallpaper-change", sync);
    return () => window.removeEventListener("devspa-wallpaper-change", sync);
  }, []);

  useEffect(() => {
    if (wallpaper.type === "live") {
      setLoaded(true);
      return;
    }

    const image = new Image();
    image.src = wallpaper.source;
    image.onload = () => setLoaded(true);
    image.onerror = () => {
      console.error("DEVSPA wallpaper failed to load:", wallpaper.source);
      setLoaded(false);
    };

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [wallpaper]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      {wallpaper.type === "live" ? (
        <video
          key={wallpaper.source}
          src={wallpaper.source}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setLoaded(true)}
          onError={() =>
            console.error("DEVSPA live wallpaper failed:", wallpaper.source)
          }
          className={`h-full w-full object-cover transition-opacity duration-700 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <img
          src={wallpaper.source}
          alt=""
          draggable="false"
          className={`h-full w-full object-cover transition-opacity duration-700 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
};

export default Wallpaper;