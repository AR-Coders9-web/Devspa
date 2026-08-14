const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const {
  createTerminal,
  writeToTerminal,
  resizeTerminal,
  destroyTerminal,
} = require("./terminalManager");

const createTerminalWebSocket = ({ server, getWorkspace }) => {
  const wss = new WebSocketServer({
    server,
    path: "/api/terminal/ws",
  });

  wss.on("connection", (socket, request) => {
    let terminalId = null;

    try {
      const url = new URL(
        request.url || "/",
        "http://localhost"
      );

      const workspaceId =
        url.searchParams.get("workspace") || "default";

      const cwd = getWorkspace(workspaceId);

      if (!cwd) {
        throw new Error(
          "Unable to resolve terminal workspace."
        );
      }

      terminalId = crypto.randomUUID();

      const send = (payload) => {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify(payload));
        }
      };

      createTerminal({
        id: terminalId,
        cwd,
        send,
      });

      socket.on("message", (raw) => {
        try {
          const payload = JSON.parse(
            raw.toString()
          );

          switch (payload.type) {
            case "input":
              writeToTerminal(
                terminalId,
                String(payload.data || "")
              );
              break;

            case "resize":
              resizeTerminal(
                terminalId,
                payload.cols,
                payload.rows
              );
              break;

            case "kill":
              destroyTerminal(terminalId);
              break;

            default:
              send({
                type: "error",
                message:
                  `Unknown terminal message type: ${payload.type}`,
              });
          }
        } catch (error) {
          send({
            type: "error",
            message:
              error?.message ||
              "Invalid terminal message.",
          });
        }
      });

      socket.on("close", () => {
        if (terminalId) {
          destroyTerminal(terminalId);
          terminalId = null;
        }
      });

      socket.on("error", (error) => {
        console.error(
          "Terminal WebSocket error:",
          error
        );

        if (terminalId) {
          destroyTerminal(terminalId);
          terminalId = null;
        }
      });

      send({
        type: "connected",
        terminalId,
        workspaceId,
        cwd,
      });
    } catch (error) {
      console.error(
        "Terminal connection error:",
        error
      );

      if (socket.readyState === 1) {
        socket.send(
          JSON.stringify({
            type: "error",
            message:
              error?.message ||
              "Terminal connection failed.",
          })
        );

        socket.close();
      }
    }
  });

  return wss;
};

module.exports = createTerminalWebSocket;