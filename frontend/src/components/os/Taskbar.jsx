import React, { useState } from "react";
import {
  Code2,
  Folder,
  Terminal,
  Bug,
  Bot,
  Search,
  Settings,
} from "lucide-react";

// =====================================================
// TASKBAR APPLICATIONS
// =====================================================

const apps = [
  {
    id: "devspa",
    name: "DEVSPA",
    icon: "/logo.png",
    type: "image",
  },
  {
    id: "editor",
    name: "Code Editor",
    icon: Code2,
    type: "icon",
  },
  {
    id: "explorer",
    name: "Explorer",
    icon: Folder,
    type: "icon",
  },
  {
    id: "debugger",
    name: "Debugger",
    icon: Bug,
    type: "icon",
  },
  {
    id: "ai",
    name: "AI Assistant",
    icon: Bot,
    type: "icon",
  },

  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    type: "icon",
  },
];

// =====================================================
// TASKBAR
// =====================================================

const Taskbar = ({
  windows = [],
  activeWindow,
  onOpenWindow,
  onFocusWindow,
  onRestoreWindow,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [taskbarHovered, setTaskbarHovered] = useState(false);

  // ===================================================
  // DESKTOP DETECTION
  //
  // When there is no active window, we consider the
  // user to be on the desktop.
  //
  // Desktop:
  //   Taskbar stays visible.
  //
  // App:
  //   Taskbar becomes auto-hidden.
  // ===================================================

  const isDesktop =
    !activeWindow ||
    (windows.length > 0 &&
      windows.every((window) => window.minimized));

  // ===================================================
  // HANDLE APPLICATION CLICK
  // ===================================================

  const handleAppClick = (app) => {
    // -------------------------------------------------
    // DEVSPA LOGO
    // -------------------------------------------------

    if (app.id === "devspa") {
      return;
    }

    // -------------------------------------------------
    // FIND EXISTING WINDOW
    // -------------------------------------------------

    const existingWindow = windows.find(
      (window) => window.id === app.id
    );

    // -------------------------------------------------
    // WINDOW DOES NOT EXIST
    // -------------------------------------------------

    if (!existingWindow) {
      onOpenWindow?.(app.id);
      return;
    }

    // -------------------------------------------------
    // WINDOW IS MINIMIZED
    // -------------------------------------------------

    if (existingWindow.minimized) {
      onRestoreWindow?.(app.id);
      return;
    }

    // -------------------------------------------------
    // WINDOW IS ALREADY OPEN
    // -------------------------------------------------

    onFocusWindow?.(app.id);
  };

  return (
    <>
      {/* =================================================
          BOTTOM EDGE HOTZONE

          Only needed when taskbar is auto-hidden.
      ================================================= */}

      {!isDesktop && (
        <div
          className="
            pointer-events-auto
            fixed
            bottom-0
            left-0
            right-0
            z-[998]
            h-3
          "
          aria-hidden="true"
        />
      )}

      {/* =================================================
          TASKBAR CONTAINER

          DESKTOP:
            Always visible.

          APP WINDOW:
            Auto hidden until mouse reaches bottom.
      ================================================= */}

      <div
        className={`
          pointer-events-none

          fixed
          bottom-0
          left-1/2
          z-[999]

          -translate-x-1/2

          px-4
          pb-2

          transition-transform
          duration-300
          ease-[cubic-bezier(0.22,1,0.36,1)]

          ${
            !isDesktop && !taskbarHovered
              ? "translate-y-[calc(100%-12px)]"
              : "translate-y-0"
          }
        `}
      >
        {/* =================================================
            TASKBAR
        ================================================= */}

        <div
          className="
            pointer-events-auto

            flex
            items-end
            gap-2

            rounded-[22px]

            border
            border-white/[0.12]

            bg-[#101114]/90

            px-3
            py-3

            shadow-[0_20px_70px_rgba(0,0,0,0.65)]

            backdrop-blur-2xl

            select-none
          "
          onMouseEnter={() => {
            setTaskbarHovered(true);
          }}
          onMouseLeave={() => {
            setTaskbarHovered(false);
            setHoveredIndex(null);
          }}
        >
          {/* =================================================
              APPLICATIONS
          ================================================= */}

          {apps.map((app, index) => {
            // ------------------------------------------------
            // MAGNIFICATION
            // ------------------------------------------------

            const distance =
              hoveredIndex === null
                ? 99
                : Math.abs(index - hoveredIndex);

            let scale = 1;

            if (distance === 0) {
              scale = 1.5;
            } else if (distance === 1) {
              scale = 1.23;
            } else if (distance === 2) {
              scale = 1.08;
            }

            // ------------------------------------------------
            // WINDOW
            // ------------------------------------------------

            const existingWindow = windows.find(
              (window) => window.id === app.id
            );

            // ------------------------------------------------
            // STATES
            // ------------------------------------------------

            const isOpen =
              !!existingWindow &&
              !existingWindow.minimized;

            const isMinimized =
              !!existingWindow &&
              !!existingWindow.minimized;

            const isActive =
              activeWindow === app.id &&
              isOpen;

            // ------------------------------------------------
            // ICON
            // ------------------------------------------------

            const Icon = app.icon;

            // ------------------------------------------------
            // TOOLTIP
            // ------------------------------------------------

            let tooltip = app.name;

            if (isMinimized) {
              tooltip = `${app.name} • Minimized`;
            } else if (isActive) {
              tooltip = `${app.name} • Active`;
            } else if (isOpen) {
              tooltip = `${app.name} • Open`;
            }

            return (
              <div
                key={app.id}
                className="
                  relative
                  flex
                  h-12
                  w-12
                  items-end
                  justify-center
                "
                onMouseEnter={() => {
                  setHoveredIndex(index);
                }}
              >
                {/* =================================================
                    TOOLTIP
                ================================================= */}

                <div
                  className={`
                    pointer-events-none

                    absolute
                    -top-11
                    left-1/2

                    -translate-x-1/2

                    whitespace-nowrap

                    rounded-lg

                    border
                    border-white/[0.10]

                    bg-[#0d0e11]/95

                    px-3
                    py-1.5

                    text-[10px]
                    font-medium
                    text-white/90

                    shadow-xl

                    backdrop-blur-xl

                    transition-all
                    duration-200

                    ${
                      hoveredIndex === index
                        ? "translate-y-0 opacity-100"
                        : "translate-y-2 opacity-0"
                    }
                  `}
                >
                  {tooltip}
                </div>

                {/* =================================================
                    APPLICATION BUTTON
                ================================================= */}

                <button
                  type="button"
                  aria-label={tooltip}
                  title={tooltip}
                  onClick={() => {
                    handleAppClick(app);
                  }}
                  style={{
                    transform: `scale(${scale})`,
                  }}
                  className="
                    relative

                    flex
                    h-12
                    w-12

                    shrink-0
                    items-center
                    justify-center

                    rounded-[15px]

                    border
                    border-white/[0.08]

                    bg-white/[0.055]

                    shadow-[0_8px_25px_rgba(0,0,0,0.3)]

                    cursor-pointer

                    transition-all
                    duration-300

                    ease-[cubic-bezier(0.22,1,0.36,1)]

                    hover:border-white/[0.18]
                    hover:bg-white/[0.09]

                    active:scale-95
                  "
                >
                  {/* =================================================
                      ICON
                  ================================================= */}

                  {app.type === "image" ? (
                    <img
                      src={app.icon}
                      alt={app.name}
                      draggable="false"
                      className="
                        pointer-events-none
                        h-8
                        w-8
                        object-contain
                      "
                    />
                  ) : (
                    <Icon
                      size={22}
                      strokeWidth={1.5}
                      className="
                        pointer-events-none
                        text-white/75
                      "
                    />
                  )}

                  {/* =================================================
                      ACTIVE INDICATOR
                  ================================================= */}

                  {isActive && (
                    <span
                      className="
                        absolute
                        -bottom-1.5
                        left-1/2

                        h-1
                        w-1

                        -translate-x-1/2

                        rounded-full

                        bg-white

                        shadow-[0_0_10px_rgba(255,255,255,0.9)]
                      "
                    />
                  )}

                  {/* =================================================
                      OPEN BUT INACTIVE INDICATOR
                  ================================================= */}

                  {isOpen && !isActive && (
                    <span
                      className="
                        absolute
                        -bottom-1.5
                        left-1/2

                        h-1
                        w-1

                        -translate-x-1/2

                        rounded-full

                        bg-white/45
                      "
                    />
                  )}

                  {/* =================================================
                      MINIMIZED INDICATOR

                      Horizontal line instead of dot.
                  ================================================= */}

                  {isMinimized && (
                    <span
                      className="
                        absolute
                        -bottom-1.5
                        left-1/2

                        h-1
                        w-3

                        -translate-x-1/2

                        rounded-full

                        bg-white/25

                        shadow-[0_0_5px_rgba(255,255,255,0.15)]
                      "
                    />
                  )}

                  {/* =================================================
                      ACTIVE WINDOW BORDER
                  ================================================= */}

                  {isActive && (
                    <span
                      className="
                        pointer-events-none

                        absolute
                        inset-0

                        rounded-[15px]

                        ring-1
                        ring-white/[0.12]
                      "
                    />
                  )}

                  {/* =================================================
                      MINIMIZED OVERLAY
                  ================================================= */}

                  {isMinimized && (
                    <span
                      className="
                        pointer-events-none

                        absolute
                        inset-0

                        rounded-[15px]

                        bg-black/20
                      "
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Taskbar;