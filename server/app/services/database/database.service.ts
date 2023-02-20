import { HttpException } from '@app/classes/http.exception';
import {
    COLLECTION_GAME_CONSTANTS,
    COLLECTION_GAME_TIMES,
    DB_NAME,
    DB_URL,
    DEFAULT_BEST_TIMES,
    DEFAULT_BONUS_TIME,
    DEFAULT_CONSTANTS,
    DEFAULT_COUNTDOWN_VALUE,
    DEFAULT_HINT_PENALTY,
} from '@app/constants';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { GameTimes } from '@app/interfaces/game-times';
import * as mongoDB from 'mongodb';
import { Service } from 'typedi';

@Service()
export class DatabaseService {
    client: mongoDB.MongoClient;
    db: mongoDB.Db;

    gameNames: string[];
    private games: GameData[];
    private selectionViewGames: GameSheet[];

    constructor() {
        this.gameNames = [];
        this.selectionViewGames = [];
        this.games = [];
        this.connectToServer().then(async () => {
            await this.deleteGameTimesFromDb();
        });
    }

    async deleteGameTimesFromDb(): Promise<void> {
        if (this.db) this.db.collection(COLLECTION_GAME_TIMES).deleteMany({});
    }

    async connectToServer(uri = DB_URL) {
        try {
            this.client = new mongoDB.MongoClient(uri);
            await this.client.connect();
            this.db = this.client.db(DB_NAME);
            // eslint-disable-next-line no-console
            console.log('Successfully connected to MongoDB.');
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
        }
    }

    getClientConnection(): boolean {
        return this.db === undefined;
    }

    getGamesData(): GameData[] {
        return this.games;
    }

    async getGames(): Promise<GameSheet[]> {
        this.selectionViewGames = [];
        for (const game of this.games) {
            if ((await this.getGameBestTimes(game.gameTimes.name))[0]) {
                this.selectionViewGames.push({
                    name: game.gameTimes.name,
                    link: game.gameSheet.originalLink,
                    soloBestTimes: (await this.getGameBestTimes(game.gameTimes.name))[0].bestSoloTimes,
                    multiplayerBestTimes: (await this.getGameBestTimes(game.gameTimes.name))[0].bestMultiplayerTimes,
                });
            } else {
                this.selectionViewGames.push({
                    name: game.gameTimes.name,
                    link: game.gameSheet.originalLink,
                    soloBestTimes: DEFAULT_BEST_TIMES,
                    multiplayerBestTimes: DEFAULT_BEST_TIMES,
                });
            }
        }
        return this.selectionViewGames;
    }

    async getGame(gameName: string): Promise<GameData | void> {
        return this.games.find((game) => game.gameSheet.name === gameName);
    }

    async addGame(gameData: GameData): Promise<void> {
        this.games.push(gameData);
        try {
            await this.db.collection(COLLECTION_GAME_TIMES).insertOne(gameData.gameTimes);
        } catch (error) {
            throw new HttpException(error);
        }
    }

    async resetBestTimesForOneGame(gameName: string): Promise<void> {
        this.games.forEach((game: GameData) => {
            if (game.gameSheet.name === gameName) {
                game.gameTimes.bestSoloTimes = DEFAULT_BEST_TIMES;
                game.gameTimes.bestMultiplayerTimes = DEFAULT_BEST_TIMES;
            }
        });
        await this.db
            .collection(COLLECTION_GAME_TIMES)
            .updateOne({ name: gameName }, { $set: { bestSoloTimes: DEFAULT_BEST_TIMES, bestMultiplayerTimes: DEFAULT_BEST_TIMES } });
    }

    async getGameBestTimes(gameName: string): Promise<GameTimes> {
        return (await this.db
            .collection(COLLECTION_GAME_TIMES)
            .find({ name: gameName }, { projection: { _id: 0, name: 1, bestSoloTimes: 1, bestMultiplayerTimes: 1 } })
            .toArray()) as unknown as GameTimes;
    }

    async updateGameBestTimes(gameData: GameData, newTimes: BestTimes[], gameMode: string): Promise<void> {
        try {
            if (gameMode === 'Classic - solo') {
                await this.db.collection('game_times').findOneAndUpdate(
                    { name: gameData.gameTimes.name },
                    {
                        $set: {
                            bestSoloTimes: newTimes,
                        },
                    },
                );
            } else if (gameMode === 'Classic 1v1') {
                await this.db.collection('game_times').findOneAndUpdate(
                    { name: gameData.gameTimes.name },
                    {
                        $set: {
                            bestMultiplayerTimes: newTimes,
                        },
                    },
                );
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('updateBestTimes error :', error);
        }
    }

    async resetBestTimesForAllGames(): Promise<void> {
        this.games.forEach((game: GameData) => {
            game.gameTimes.bestSoloTimes = DEFAULT_BEST_TIMES;
            game.gameTimes.bestMultiplayerTimes = DEFAULT_BEST_TIMES;
        });
        await this.db
            .collection(COLLECTION_GAME_TIMES)
            .updateMany({}, { $set: { bestSoloTimes: DEFAULT_BEST_TIMES, bestMultiplayerTimes: DEFAULT_BEST_TIMES } });
    }

    async resetConstants(): Promise<void> {
        await this.db.collection(COLLECTION_GAME_CONSTANTS).replaceOne(
            {},
            {
                initialTime: DEFAULT_COUNTDOWN_VALUE,
                penaltyTime: DEFAULT_HINT_PENALTY,
                bonusTime: DEFAULT_BONUS_TIME,
            },
        );
    }

    removeGameFile(gameName: string): void {
        this.games.forEach((game, index) => {
            if (game.gameSheet.name === gameName) {
                this.db.collection(COLLECTION_GAME_TIMES).deleteOne({ name: gameName });
                this.games.splice(index, 1);
                const nameIndex = this.gameNames.indexOf(gameName, 0);
                if (nameIndex >= 0) {
                    this.gameNames.splice(nameIndex, 1);
                }
                return;
            }
        });
    }

    getGamesNames(): string[] {
        return this.gameNames;
    }

    async deleteAll(): Promise<void> {
        this.gameNames = [];
        this.games = [];
        await this.db.collection(COLLECTION_GAME_TIMES).deleteMany({});
    }

    async getGamesConstants(): Promise<AdminConstants> {
        try {
            (await this.db.collection(COLLECTION_GAME_CONSTANTS).find().toArray()) as unknown as AdminConstants;
            return (await this.db.collection(COLLECTION_GAME_CONSTANTS).find().toArray()) as unknown as AdminConstants;
        } catch (error) {
            return DEFAULT_CONSTANTS;
        }
    }

    async updateGamesConstant(newGameConstants: AdminConstants): Promise<void> {
        try {
            await this.db.collection(COLLECTION_GAME_CONSTANTS).replaceOne({}, newGameConstants);
        } catch (error) {
            throw new HttpException('Modification des constantes échouée');
        }
    }
}
