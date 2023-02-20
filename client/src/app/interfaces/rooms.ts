import { GameData } from './game-sheet';
import { Point2d } from './point2d';

export interface ClassicRoom {
    hostId: string;
    roomId: string;
    playerName: string;
    hintPenalty: number;
    game: GameData;
    gameMode: string;
    timer: number;
    differencesFound: number;
    endGameMessage: string;
    currentDifference: Point2d[];
    guestInfo?: GuestPlayer;
    roomTaken?: boolean;
}

export interface GuestPlayer {
    id: string;
    guestName: string;
    differencesFound?: number;
    differenceLocations?: Point2d[][];
}
