import { Client } from "discord.js";
import { logger as LOG } from "./Logger";

export default function terminate(client: Client, _timeout = 500) {
    const timeout = _timeout;
    // Exit function
    const exit = (code: number) => {
        process.exit(code);
    };

    const result = (code: number, reason: string) => {
        return (err: any, promise: never): void => {
            LOG.error(`ExitCode ${code}, reason ${reason}`);
            if (err && err instanceof Error) {
                // Log error information, use a proper logging library here :)
                LOG.error(err.message);
                LOG.error(err.stack?.toString());
            }

            // Attempt a graceful shutdown
            client.destroy();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            setTimeout(exit, timeout).unref();
        };
    };

    return result;
}
