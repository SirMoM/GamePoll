import { botLoginAndSetup } from "./bot";
import { config } from "dotenv";
import terminate from "./logging/terminate";

// Load .env file and config process
config();

// =============== Gracefull shutdown ======================
// So the program will not close instantly
process.stdin.resume();

const bot = botLoginAndSetup();

const exitHandler = terminate(bot, 500);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
process.on("uncaughtException", exitHandler(1, "Unexpected Error"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
process.on("unhandledRejection", exitHandler(1, "Unhandled Promise"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
process.on("SIGTERM", exitHandler(0, "SIGTERM"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
process.on("SIGINT", exitHandler(0, "SIGINT"));

// =============== Logins =================

