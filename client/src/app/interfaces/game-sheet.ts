import { Point2d } from './point2d';

export interface BestTimes {
    name: string;
    time: number;
}

export interface GameTimes {
    name: string;
    bestSoloTimes: BestTimes[];
    bestMultiplayerTimes: BestTimes[];
}

export interface GameSheet {
    name: string;
    soloBestTimes: BestTimes[];
    multiplayerBestTimes: BestTimes[];
    link: string;
}

export interface ServerGameSheet {
    originalLink: string;
    modifiedLink: string;
    differenceCounter: number;
    differenceLocations: Point2d[][];
    name: string;
}

export interface GameData {
    gameSheet: ServerGameSheet;
    gameTimes: GameTimes;
}
