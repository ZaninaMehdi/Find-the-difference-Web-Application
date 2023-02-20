import { GameTimes } from './game-times';
import { ServerGameSheet } from './server-game-sheet';

export interface GameData {
    gameSheet: ServerGameSheet;
    gameTimes: GameTimes;
    name?: string;
}
