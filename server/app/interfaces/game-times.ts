import { BestTimes } from './best-times';

export interface GameTimes {
    name: string;
    bestSoloTimes: BestTimes[];
    bestMultiplayerTimes: BestTimes[];
}
