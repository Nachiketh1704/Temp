import "dotenv/config";
import "./database/db";
import { createServer } from "./server";
import { Logger } from "./utils/logger";
import http from "http";
import { initializeSocket } from "./services/socket/instance";

const PORT = process.env.PORT || 3000;

// Handle global errors
process.on("unhandledRejection", (reason: any) => {
  Logger.info(`Unhandled Rejection: ${reason?.message || reason}`);
  process.exit(1); // Exit to allow the cluster to respawn
});

process.on("uncaughtException", (err: Error) => {
  Logger.info(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

const app = createServer();
// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Initialize Socket.IO
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  Logger.info(`Worker ${process.pid} - Server running on port ${PORT}`);
});
