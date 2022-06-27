import { botLoginAndSetup } from "./bot";
import { config } from "dotenv";
import terminate from "./logging/terminate";

// Load .env file and config process
config();

// =============== Gracefull shutdown ======================
// So the program will not close instantly
process.stdin.resume();

// function exitHandler(options: { cleanup?: boolean, exit: boolean }, exitCode: number) {
//     console.log(exitCode);
//     console.log(options);
//     if (options.cleanup) {
//         LOG.info("Clean up application");
//
//     }
//     if (exitCode !== 2) {
//         LOG.warn(`EXIT CODE: ${exitCode}`);
//     }
//
//     if (options.exit) {
//         process.exit();
//     }
//     bot.destroy();
// }
//
// // Do something when app is closing
// process.on("exit", exitHandler.bind(null, { cleanup: true, exit: false }));
//
// // Catches ctrl+c event
// process.on("SIGINT", exitHandler.bind(null, { exit: true }));
//
// // Catches "kill pid" (for example: nodemon restart)
// process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
// process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
//
// // Catches uncaught exceptions FIXME: should we exit here?
// // process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

// =============== Gracefull shutdown ======================
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

