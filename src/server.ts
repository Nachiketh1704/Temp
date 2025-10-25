import express, { Request, Response } from "express";
import path from "path";
import fileUpload from "express-fileupload";
import os from "os";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";
import { specs } from "./swagger";
import "./cron/cleanupLogs";
import { API_PREFIX } from "./constants";
import { i18nMiddleware } from "./middlewares/i18n";
import { User } from "./models";

export const createServer = () => {
  const app = express();
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(i18nMiddleware);
  // Enable express-fileupload with temp files
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: os.tmpdir(),
      createParentPath: true,
      limits: { fileSize: 20 * 1024 * 1024 },
    }) as any
  );
  
  // Serve static files from /public (e.g., uploads)
  app.use("/public", express.static(path.resolve(process.cwd(), "public")));

  app.get("/", (req: any, res: any) => {
    return res.status(200).json({ message: "Welcome to LoadRider API" });
  });
  app.get("/health", (req: any, res: any) =>
    res.status(200).json({ status: "OK" })
  );

  app.get('/api/greet', async (req, res) => {
    const message = await res.t('loginSuccess', { user: 'Abhishek' }, 'auth');
    res.json({ message });
  });
  

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.use(API_PREFIX, routes);
  app.all(/(.*)/, (req: any, res: any) => {
    return res.status(404).json({ message: "route not found" });
  });
  app.use(errorHandler);
  return app;
};

