import { Client } from "discord.js";
import { Commands } from "./command/Command";
import handleInteractionCreate from "./handleInteractionCreate";
import { logger as LOG } from "./logging/Logger";

// ===============   Discord config   ======================

export const BOT_ID = "795980245400420363";
// const guildId = "382636798528192512"; // Sir.MoM Server
const guildId = "273804549234622464";
LOG.info("Starting Bot: Beep beep! 🤖");

// ===============   Discord login   ======================
function loginBot(): Client {
    const client = new Client({ intents: [] });

    client.login(process.env.TOKEN).catch((error: Error) => {
        LOG.error(error);
    });

    client.on("ready", () => {
        LOG.info("Logged in!");
        if (client.user)
            client.user.setActivity("dir zu. Du machst das großartig!", {
                type: "WATCHING",
                url: "https://github.com/SirMoM/GamePoll"
            });

        if (client.application) {
            client.application.commands.set(Commands, guildId)
                .catch((error: Error) => {
                    LOG.error(error);
                });
        }
    });
    return client;
}


export function botLoginAndSetup(): Client {
    const bot = loginBot();
    handleInteractionCreate(bot);
    return bot;
}
