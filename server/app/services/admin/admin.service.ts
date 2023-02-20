import { DEFAULT_BEST_TIMES } from '@app/constants';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { GameTimes } from '@app/interfaces/game-times';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ServerGameSheet } from '@app/interfaces/server-game-sheet';
import { DatabaseService } from '@app/services/database/database.service';
import { Service } from 'typedi';

@Service()
export class AdminService {
    constructor(private databaseService: DatabaseService) {}

    async getGameBestTimes(room: ClassicRoom): Promise<GameTimes> {
        return await this.databaseService.getGameBestTimes(room.game.gameTimes.name);
    }

    getClientConnection(): boolean {
        return this.databaseService.getClientConnection();
    }

    updateGameBestTimes(room: ClassicRoom, sortedBestTimes: BestTimes[]): void {
        this.databaseService.updateGameBestTimes(room.game, sortedBestTimes, room.gameMode);
    }

    modifyConstants(newConstants: AdminConstants): void {
        this.databaseService.updateGamesConstant(newConstants);
    }

    async getConstants(): Promise<AdminConstants> {
        return await this.databaseService.getGamesConstants();
    }

    async getAllGameData(): Promise<GameData[]> {
        return await this.databaseService.getGamesData();
    }

    async getGames(): Promise<GameSheet[]> {
        return await this.databaseService.getGames();
    }

    async getGame(gameName: string): Promise<GameData | void> {
        return await this.databaseService.getGame(gameName);
    }

    async addGame(newGame: ServerGameSheet): Promise<void> {
        this.databaseService.gameNames.push(newGame.name);
        await this.databaseService.addGame(this.createGameData(newGame));
    }

    createGameData(newGame: ServerGameSheet): GameData {
        return {
            gameSheet: newGame,
            gameTimes: { name: newGame.name, bestSoloTimes: DEFAULT_BEST_TIMES, bestMultiplayerTimes: DEFAULT_BEST_TIMES },
        };
    }

    getNames(): string[] {
        return this.databaseService.getGamesNames();
    }

    async deleteGame(gameName: string): Promise<void> {
        this.databaseService.removeGameFile(gameName);
    }

    async deleteGames(): Promise<void> {
        await this.databaseService.deleteAll();
    }

    async resetBestTimesForOneGame(gameName: string): Promise<void> {
        await this.databaseService.resetBestTimesForOneGame(gameName);
    }

    async resetBestTimesForAllGames(): Promise<void> {
        await this.databaseService.resetBestTimesForAllGames();
    }

    async resetConstants(): Promise<void> {
        await this.databaseService.resetConstants();
    }
}
