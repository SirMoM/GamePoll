import { BaseCommandInteraction, ChatInputApplicationCommandData, Client } from "discord.js";
import { GamePoll } from "./GamePoll";

export interface Command extends ChatInputApplicationCommandData {
    run: (client: Client, interaction: BaseCommandInteraction) => void;
}

export const Commands: Command[] = [GamePoll];
