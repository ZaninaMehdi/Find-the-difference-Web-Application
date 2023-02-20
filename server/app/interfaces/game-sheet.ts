import { BestTimes } from './best-times';

export interface GameSheet {
    name: string;
    soloBestTimes: BestTimes[];
    multiplayerBestTimes: BestTimes[];
    link: string;
}
