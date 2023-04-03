import { CommandInteraction, ChatInputApplicationCommandData, Client } from "discord.js";
import { GamePoll } from "./GamePoll";

export interface Command extends ChatInputApplicationCommandData {
    run: (client: Client, interaction: CommandInteraction) => void;
}

export const Commands: Command[] = [GamePoll];
