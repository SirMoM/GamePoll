import { Logger, createLogger, format, transports } from "winston";

const { combine, timestamp, printf } = format;

const color = {
    info: "\x1b[36m",
    error: "\x1b[31;1m",
    warn: "\x1b[33;1m",
    reset: "\x1b[0m"
};

const myFormat = printf(({ level, message, timestamp }): string => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${timestamp} [${level.toLocaleUpperCase()}] ${message}`;
});

const myColorFormat = printf(({ level, message, timestamp }): string => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${timestamp} [${(color[level])}${level.toLocaleUpperCase()}${color.reset}] ${message}`;
});

export const logger: Logger = createLogger({
    level: "info",
    format: combine(
        timestamp({ format: "DD.MM.YYYY [-] HH:mm" }),
        myFormat),
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new transports.File({ filename: "Logs/error.log", level: "error" }),
        new transports.File({ filename: "Logs/combined.log" }),
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
    const consoleLogger = new transports.Console()
    consoleLogger.format = myColorFormat
    logger.add(consoleLogger);
}

