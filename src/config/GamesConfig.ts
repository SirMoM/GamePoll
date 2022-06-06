import * as config from './gamesConfig.json'

export const gamesConfig = config as GamesConfig



export interface GamesConfig{
    generalConfig: GeneralConfig;
    gamesConfig: GameConfig[];
    defaultGameConfig: GameConfig;
}

export interface GeneralConfig {
    title: string,
    timeText: string,
    additionalText: string,
    explainEmojisText: string
}

export interface GameConfig {
    name: string,
    tag: string,
    thumbnails: string[],
    rosterSize: number,
    color: string
}

export function getGameConfigFromTag(_tag: string): GameConfig  {
    return gamesConfig.gamesConfig.find( value => value.tag === _tag) ?? gamesConfig.defaultGameConfig;
}   