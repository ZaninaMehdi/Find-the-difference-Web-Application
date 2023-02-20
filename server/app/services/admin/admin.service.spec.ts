import { DEFAULT_BEST_TIMES } from '@app/constants';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { GameTimes } from '@app/interfaces/game-times';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ServerGameSheet } from '@app/interfaces/server-game-sheet';
import { AdminService } from '@app/services/admin/admin.service';
import { DatabaseService } from '@app/services/database/database.service';
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('Admin service', () => {
    let adminService: AdminService;
    let dataBaseService: DatabaseService;

    const defaultBestTimes: BestTimes[] = DEFAULT_BEST_TIMES;
    const serverGameSheet: ServerGameSheet = {
        originalLink: '../../../assets/bmp_640',
        modifiedLink: '../../../assets/bmp_640',
        differenceCounter: 0,
        differenceLocations: [[]],
        name: 'image',
    };
    const baseGameSheet: GameSheet = {
        name: 'image',
        soloBestTimes: defaultBestTimes,
        multiplayerBestTimes: [],
        link: 'link',
    };
    const gameTime: GameTimes = {
        name: baseGameSheet.name,
        bestSoloTimes: defaultBestTimes,
        bestMultiplayerTimes: defaultBestTimes,
    };
    const finalGame: GameData = {
        gameSheet: serverGameSheet,
        gameTimes: gameTime,
    };
    const mockRoom: ClassicRoom = {
        roomId: 'roomId',
        hostId: 'hostId',
        playerName: 'playerName',
        hintPenalty: 5,
        game: finalGame,
        gameMode: 'Temps Limite',
        timer: 120,
        differencesFound: 0,
        endGameMessage: '',
        currentDifference: [],
    };

    beforeEach(async () => {
        dataBaseService = new DatabaseService();
        adminService = new AdminService(dataBaseService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should call connexion status method using databasService', () => {
        const stub = sinon.stub(dataBaseService, 'getClientConnection');
        adminService.getClientConnection();
        expect(stub.called).equals(true);
    });

    it('should create a new game', () => {
        const gameSheet = adminService.createGameData(serverGameSheet);
        expect(gameSheet).to.deep.equal(finalGame);
    });

    it('should add a new game to the database', () => {
        dataBaseService.gameNames = [];
        const createGameDataStub = sinon.stub(adminService, 'createGameData').returns(finalGame);
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        const addGameStub = sinon.stub(dataBaseService, 'addGame').callsFake(async (gameData: GameData) => {
            return Promise.resolve();
        });
        adminService.addGame(serverGameSheet);

        expect(dataBaseService.gameNames.length).equal(1);
        expect(createGameDataStub.called).equals(true);
        expect(addGameStub.called).equals(true);
    });

    it('should get all games from our DB for the carousel', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const getGamesStub = sinon.stub(dataBaseService, 'getGames').callsFake(async () => {
            return Promise.resolve([baseGameSheet]);
        });
        await adminService.getGames();
        expect(getGamesStub.called).equal(true);
    });

    it('should call updateGameBestTimes from database service', () => {
        const updateGameBestTimes = sinon.stub(dataBaseService, 'updateGameBestTimes');
        adminService.updateGameBestTimes(mockRoom, defaultBestTimes);
        expect(updateGameBestTimes.called).equals(true);
    });

    it('should call getGameBestTimes from database service', () => {
        const getGameBestTimes = sinon.stub(dataBaseService, 'getGameBestTimes').callsFake(async () => {
            return Promise.resolve(undefined as unknown as GameTimes);
        });
        adminService.getGameBestTimes(mockRoom).then(() => {
            expect(getGameBestTimes.called).equals(true);
        });
    });

    it('should get all games with their full data from our DB', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const getGamesStub = sinon.stub(dataBaseService, 'getGamesData').callsFake(() => {
            return [finalGame];
        });
        await adminService.getAllGameData();
        expect(getGamesStub.called).equal(true);
    });

    it('should get a game from our DB', async () => {
        const getGameStub = sinon.stub(dataBaseService, 'getGame').callsFake(async () => {
            return Promise.resolve(finalGame);
        });
        await adminService.getGame('image');
        expect(getGameStub.called).equal(true);
    });

    it('should modify the time constants', () => {
        const newConstants: AdminConstants = {
            initialTime: 100,
            penaltyTime: 60,
            bonusTime: 10,
        };
        adminService.modifyConstants(newConstants);
        adminService.getConstants().then((value) => {
            expect(value).to.equal(newConstants);
        });
    });

    it('should return the list of game names', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const gameNamesStub = sinon.stub(dataBaseService, 'getGamesNames').callsFake(() => {
            return ['image'];
        });
        adminService.getNames();
        expect(gameNamesStub.called).equals(true);
    });

    it('should delete a game', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const removeStub = sinon.stub(dataBaseService, 'removeGameFile').callsFake(async () => {
            return Promise.resolve();
        });
        await adminService.deleteGame('game');
        expect(removeStub.calledWith('game')).equal(true);
    });

    it('should return the admin constants', () => {
        const constantsStub = sinon.stub(dataBaseService, 'getGamesConstants').callsFake(async () => {
            return Promise.resolve({
                initialTime: 100,
                penaltyTime: 60,
                bonusTime: 10,
            });
        });
        adminService.getConstants().then(() => {
            expect(constantsStub.called).equal(true);
        });
    });

    it('should return the best times', () => {
        const bestTimesStub = sinon.stub(dataBaseService, 'getGameBestTimes').callsFake(async () => {
            return Promise.resolve({
                name: 'random',
                bestSoloTimes: defaultBestTimes,
                bestMultiplayerTimes: defaultBestTimes,
            });
        });
        adminService.getGameBestTimes(mockRoom).then(() => {
            expect(bestTimesStub.called).equal(true);
        });
    });

    it('should call the update best times fuction in the db', () => {
        const updateBestTimesStub = sinon.stub(dataBaseService, 'updateGameBestTimes');
        adminService.updateGameBestTimes(mockRoom, defaultBestTimes);
        expect(updateBestTimesStub.called).equal(true);
    });

    it('should delete a specified game in the DB', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const deleteStub = sinon.stub(dataBaseService, 'removeGameFile').callsFake(async () => {
            return Promise.resolve();
        });
        await adminService.deleteGame('game');
        expect(deleteStub.called).equal(true);
    });

    it('should delete all games in the DB', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const deleteStub = sinon.stub(dataBaseService, 'deleteAll').callsFake(async () => {
            return Promise.resolve();
        });
        await adminService.deleteGames();
        expect(deleteStub.called).equal(true);
    });

    it('should reset the best times for a specific game in the DB', async () => {
        // eslint-disable-next-line no-unused-vars
        const resetStub = sinon.stub(dataBaseService, 'resetBestTimesForOneGame').callsFake(async (gameName: string) => {
            return Promise.resolve();
        });
        await adminService.resetBestTimesForOneGame('game');
        expect(resetStub.called).equal(true);
    });

    it('should reset the best times for all games in the DB', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const resetStub = sinon.stub(dataBaseService, 'resetBestTimesForAllGames').callsFake(async () => {
            return Promise.resolve();
        });
        await adminService.resetBestTimesForAllGames();
        expect(resetStub.called).equal(true);
    });

    it('should reset the game constants for all games in the DB', async () => {
        const resetStub = sinon.stub(dataBaseService, 'resetConstants').callsFake(async () => {
            return Promise.resolve();
        });
        await adminService.resetConstants();
        expect(resetStub.called).equal(true);
    });
});
