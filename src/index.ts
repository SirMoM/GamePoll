import { logger as LOG } from "./logging/Logger";
import { botLoginAndSetup } from "./bot";
import { config } from "dotenv";

// Load .env file and config process
config();

// =============== Gracefull shutdown ======================
// So the program will not close instantly
process.stdin.resume();

function exitHandler(options: { cleanup?: boolean, exit: boolean }, exitCode: number) {
    console.log(exitCode )
    console.log(options )
    // Db.close();
    if (options.cleanup) {
        LOG.info("Clean up application");

        LOG.info("Closed database connection");
        // TODO: Do this
    }
    if (exitCode !== 2) {
        LOG.warn(`EXIT CODE: ${exitCode}`);
    }

    if (options.exit) {
        process.exit();
    }
}

// Do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true, exit: false }));

// Catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// Catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

// Catches uncaught exceptions FIXME: should we exit here?
// process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

// =============== Gracefull shutdown ======================

// =============== Logins =================
botLoginAndSetup();
