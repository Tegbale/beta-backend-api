import express, { Express } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";
import {
  errorHandler,
  logErrors,
  clientErrorHandler,
  errorLogger,
} from "./middlewares/error";
import { logger } from "./utils/logger";
import schoolRoutes from "./routes/schools"; // Ensure you have these imports
import classRoutes from "./routes/classes";

class App {
  public express: Express;
  public port: number;
  private prisma: PrismaClient;

  constructor(port: number) {
    this.express = express();
    this.port = port;
    this.prisma = new PrismaClient();
    this.middleware();
    this.routes();
    this.errorHandler();
  }

  private middleware(): void {
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(morgan("dev"));
    this.express.use(helmet());
    this.express.use(cors());
  }

  private routes(): void {
    this.express.use("/api/schools", schoolRoutes);
    this.express.use("/api/classes", classRoutes);
    // Mount other route handlers here
  }

  private errorHandler(): void {
    this.express.use(logErrors);
    this.express.use(clientErrorHandler);
    this.express.use(errorLogger);
    this.express.use(errorHandler);
  }

  public start(): void {
    this.express.listen(this.port, () => {
      logger.info(`Server started on port ${this.port}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal received. Closing HTTP server.");
      this.prisma.$disconnect();
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT signal received. Closing HTTP server.");
      this.prisma.$disconnect();
      process.exit(0);
    });
  }
}

export default App;
