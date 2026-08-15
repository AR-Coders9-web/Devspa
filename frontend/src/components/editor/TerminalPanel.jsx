import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Terminal as XTerm,
} from "@xterm/xterm";

import {
  FitAddon,
} from "@xterm/addon-fit";

import "@xterm/xterm/css/xterm.css";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const TerminalPanel = ({
  workspaceId = "default",
  repository,
  onClose,
}) => {
  const containerRef =
    useRef(null);

  const terminalRef =
    useRef(null);

  const socketRef =
    useRef(null);

  const fitAddonRef =
    useRef(null);

  const resizeObserverRef =
    useRef(null);

  const reconnectTimerRef =
    useRef(null);

  const reconnectAttemptsRef =
    useRef(0);

  const mountedRef =
    useRef(true);

  const [status, setStatus] =
    useState("connecting");

  // =====================================================
  // WORKSPACE
  // =====================================================

  const resolvedWorkspaceId =
    repository?.id ||
    repository?.fullName ||
    workspaceId ||
    "default";

  // =====================================================
  // FOCUS
  // =====================================================

  const focusTerminal =
    useCallback(() => {
      const terminal =
        terminalRef.current;

      const container =
        containerRef.current;

      if (!terminal) return;

      terminal.focus();

      const textarea =
        container?.querySelector(
          ".xterm-helper-textarea"
        );

      textarea?.focus();
    }, []);

  // =====================================================
  // FIT + RESIZE
  // =====================================================

  const fitTerminal =
    useCallback(() => {
      const terminal =
        terminalRef.current;

      const fitAddon =
        fitAddonRef.current;

      const socket =
        socketRef.current;

      if (!terminal || !fitAddon) {
        return;
      }

      try {
        fitAddon.fit();

        if (
          socket &&
          socket.readyState ===
            WebSocket.OPEN
        ) {
          socket.send(
            JSON.stringify({
              type: "resize",
              cols: terminal.cols,
              rows: terminal.rows,
            })
          );
        }
      } catch (error) {
        console.warn(
          "Terminal resize failed:",
          error
        );
      }
    }, []);

  // =====================================================
  // CREATE TERMINAL
  // =====================================================

  useEffect(() => {
    mountedRef.current = true;

    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    // ================================================
    // XTERM
    // ================================================

    const terminal =
      new XTerm({
        cursorBlink: true,

        cursorStyle: "bar",

        cursorInactiveStyle: "outline",

        fontSize: 13,

        lineHeight: 1.35,

        fontFamily:
          "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",

        scrollback: 10000,

        convertEol: true,

        disableStdin: false,

        allowTransparency: false,

        windowsMode:
          navigator.userAgent
            .toLowerCase()
            .includes("windows"),

        theme: {
          background: "#090a0c",

          foreground: "#d4d4d4",

          cursor: "#ffffff",

          cursorAccent: "#090a0c",

          selectionBackground:
            "#264f78",

          black: "#000000",

          red: "#f14c4c",

          green: "#23d18b",

          yellow: "#f5f543",

          blue: "#3b8eea",

          magenta: "#d670d6",

          cyan: "#29b8db",

          white: "#e5e5e5",
        },

        scrollOnUserInput: true,

        fastScrollSensitivity: 5,

        rightClickSelectsWord: true,
      });

    const fitAddon =
      new FitAddon();

    terminal.loadAddon(
      fitAddon
    );

    terminal.open(container);

    terminalRef.current =
      terminal;

    fitAddonRef.current =
      fitAddon;

    // ================================================
    // WELCOME
    // ================================================

    terminal.writeln(
      "\x1b[1;36mDEVSPA Terminal\x1b[0m"
    );

    terminal.writeln(
      "\x1b[90mInitializing terminal...\x1b[0m"
    );

    terminal.writeln("");

    // ================================================
    // INITIAL FIT
    // ================================================

    requestAnimationFrame(() => {
      fitTerminal();
      focusTerminal();
    });

    // ================================================
    // INPUT
    // ================================================

    const inputDisposable =
      terminal.onData(
        (data) => {
          const socket =
            socketRef.current;

          if (
            socket &&
            socket.readyState ===
              WebSocket.OPEN
          ) {
            socket.send(
              JSON.stringify({
                type: "input",
                data,
              })
            );
          }
        }
      );

    // ================================================
    // SOCKET
    // ================================================

    let socket;

    const connect = () => {
      if (
        !mountedRef.current
      ) {
        return;
      }

      // Close previous socket.
      if (
        socketRef.current &&
        socketRef.current.readyState !==
          WebSocket.CLOSED
      ) {
        try {
          socketRef.current.close();
        } catch {}
      }

      setStatus("connecting");

      const wsBase =
        BACKEND_URL.replace(
          /^http/,
          "ws"
        );

      const wsUrl =
        `${wsBase}/api/terminal/ws` +
        `?workspace=${encodeURIComponent(
          resolvedWorkspaceId
        )}`;

      socket =
        new WebSocket(wsUrl);

      socketRef.current =
        socket;

      socket.onopen = () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        reconnectAttemptsRef.current = 0;

        setStatus("connected");

        terminal.writeln(
          "\x1b[32mâœ“ Connected\x1b[0m"
        );

        terminal.writeln("");

        requestAnimationFrame(() => {
          fitTerminal();
          focusTerminal();
        });
      };

      socket.onmessage = (
        event
      ) => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        try {
          const message =
            JSON.parse(
              event.data
            );

          switch (
            message.type
          ) {
            case "connected":
              terminal.writeln(
                `\x1b[90mWorkspace: ${message.cwd}\x1b[0m`
              );

              terminal.writeln("");

              break;

            case "ready":
              terminal.writeln(
                `\x1b[90mShell: ${message.shell || "system shell"}\x1b[0m`
              );

              terminal.writeln("");

              break;

            case "output":
              terminal.write(
                message.data || ""
              );

              break;

            case "error":
              terminal.writeln(
                `\r\n\x1b[31mâœ• ${message.message}\x1b[0m`
              );

              break;

            case "exit":
              terminal.writeln(
                `\r\n\x1b[90mProcess exited with code ${message.code ?? 0}.\x1b[0m`
              );

              setStatus(
                "disconnected"
              );

              break;

            default:
              break;
          }

          requestAnimationFrame(
            focusTerminal
          );
        } catch {
          terminal.write(
            String(
              event.data || ""
            )
          );
        }
      };

      socket.onerror = () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        setStatus("error");

        terminal.writeln(
          "\r\n\x1b[31mâœ• Terminal connection error.\x1b[0m"
        );
      };

      socket.onclose = () => {
        if (
          !mountedRef.current
        ) {
          return;
        }

        setStatus(
          "disconnected"
        );

        terminal.writeln(
          "\r\n\x1b[90mTerminal disconnected.\x1b[0m"
        );

        // ==========================================
        // AUTO RECONNECT
        // ==========================================

        const attempts =
          reconnectAttemptsRef.current;

        if (attempts >= 5) {
          terminal.writeln(
            "\x1b[31mMaximum reconnect attempts reached.\x1b[0m"
          );

          return;
        }

        reconnectAttemptsRef.current =
          attempts + 1;

        const delay =
          Math.min(
            1000 *
              2 **
                attempts,
            8000
          );

        terminal.writeln(
          `\x1b[90mReconnecting in ${Math.ceil(
            delay / 1000
          )}s...\x1b[0m`
        );

        reconnectTimerRef.current =
          setTimeout(
            connect,
            delay
          );
      };
    };

    connect();

    // ================================================
    // CLICK â†’ FOCUS
    // ================================================

    const handleFocus =
      () => {
        focusTerminal();
      };

    container.addEventListener(
      "mousedown",
      handleFocus
    );

    container.addEventListener(
      "click",
      handleFocus
    );

    // ================================================
    // WINDOW RESIZE
    // ================================================

    const handleResize =
      () => {
        requestAnimationFrame(
          fitTerminal
        );
      };

    window.addEventListener(
      "resize",
      handleResize
    );

    // ================================================
    // RESIZE OBSERVER
    // ================================================

    const resizeObserver =
      new ResizeObserver(
        () => {
          requestAnimationFrame(
            fitTerminal
          );
        }
      );

    resizeObserver.observe(
      container
    );

    resizeObserverRef.current =
      resizeObserver;

    // ================================================
    // CLEANUP
    // ================================================

    return () => {
      mountedRef.current = false;

      clearTimeout(
        reconnectTimerRef.current
      );

      inputDisposable.dispose();

      resizeObserver.disconnect();

      window.removeEventListener(
        "resize",
        handleResize
      );

      container.removeEventListener(
        "mousedown",
        handleFocus
      );

      container.removeEventListener(
        "click",
        handleFocus
      );

      if (
        socketRef.current
      ) {
        try {
          if (
            socketRef.current
              .readyState ===
            WebSocket.OPEN
          ) {
            socketRef.current.send(
              JSON.stringify({
                type: "kill",
              })
            );
          }

          socketRef.current.close();
        } catch {}
      }

      terminal.dispose();

      terminalRef.current =
        null;

      socketRef.current =
        null;

      fitAddonRef.current =
        null;
    };
  }, [
    resolvedWorkspaceId,
    fitTerminal,
    focusTerminal,
  ]);

  // =====================================================
  // CLEAR
  // =====================================================

  const clearTerminal =
    () => {
      terminalRef.current?.clear();

      terminalRef.current?.writeln(
        "\x1b[90mTerminal cleared.\x1b[0m"
      );

      focusTerminal();
    };

  // =====================================================
  // STATUS
  // =====================================================

  const statusLabel = {
    connecting: "Connecting",
    connected: "Connected",
    disconnected:
      "Disconnected",
    error: "Connection Error",
  }[status];

  const statusClass = {
    connecting:
      "bg-yellow-400",
    connected:
      "bg-emerald-400",
    disconnected:
      "bg-white/30",
    error: "bg-red-400",
  }[status];

  return (
    <section
      className="
        relative
        z-20
        flex
        h-[35%]
        min-h-[240px]
        w-full
        shrink-0
        flex-col
        overflow-hidden
        border-t
        border-white/[0.06]
        bg-[#090a0c]
      "
    >
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <header
        className="
          flex
          h-10
          shrink-0
          items-center
          justify-between
          border-b
          border-white/[0.06]
          bg-[#0b0c0f]
          px-3
        "
      >
        <div className="flex items-center gap-2">
          <div
            className={`
              h-1.5
              w-1.5
              rounded-full
              ${statusClass}
            `}
          />

          <span className="text-[12px] font-medium text-white/70">
            Terminal
          </span>

          <span className="text-[10px] text-white/20">
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={
              clearTerminal
            }
            className="
              rounded-md
              px-2
              py-1
              text-[11px]
              text-white/35
              transition
              hover:bg-white/[0.05]
              hover:text-white/80
            "
          >
            Clear
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-md
                px-2
                py-1
                text-[11px]
                text-white/35
                transition
                hover:bg-white/[0.05]
                hover:text-white/80
              "
            >
              Close
            </button>
          )}
        </div>
      </header>

      {/* ========================================= */}
      {/* TERMINAL */}
      {/* ========================================= */}

      <div
        ref={containerRef}
        tabIndex={0}
        className="
          devspa-terminal
          min-h-0
          min-w-0
          flex-1
          cursor-text
          overflow-hidden
          px-3
          py-2
          outline-none
        "
        onMouseDown={
          focusTerminal
        }
      />
    </section>
  );
};

export default TerminalPanel;
