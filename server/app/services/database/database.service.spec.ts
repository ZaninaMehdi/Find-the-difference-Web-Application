/* eslint-disable max-lines */
import { COLLECTION_GAME_TIMES, DEFAULT_BEST_TIMES } from '@app/constants';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { GameTimes } from '@app/interfaces/game-times';
import { ServerGameSheet } from '@app/interfaces/server-game-sheet';
import { expect } from 'chai';
import * as mongoDB from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import * as sinon from 'sinon';
import { DatabaseService } from './database.service';

describe('Database service', () => {
    let dataBaseService: DatabaseService;
    let mongoServer: MongoMemoryServer;

    const defaultBestTimes: BestTimes[] = [
        { name: 'John Doe', time: 100 },
        { name: 'Jane Doe', time: 200 },
        { name: 'the scream', time: 250 },
    ];
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
        link: '../../../assets/bmp_640',
    };
    const gameTime: GameTimes = {
        name: baseGameSheet.name,
        bestSoloTimes: defaultBestTimes,
        bestMultiplayerTimes: [],
    };
    const finalGame: GameData = {
        gameSheet: serverGameSheet,
        gameTimes: gameTime,
    };

    before(async () => {
        setTimeout(() => {
            if (dataBaseService.client) dataBaseService.client.close();
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        }, 1500);
        mongoServer = await MongoMemoryServer.create();
    });

    beforeEach(async () => {
        dataBaseService = new DatabaseService();
        dataBaseService['games'] = [];
        dataBaseService.gameNames = [];
    });

    afterEach(async () => {
        if (dataBaseService.client) await dataBaseService.client.close(true);
        sinon.restore();
    });

    it('should delete game times once the server is launched', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db(COLLECTION_GAME_TIMES);
        const stub = sinon.stub(dataBaseService.db.collection(COLLECTION_GAME_TIMES), 'deleteMany');

        dataBaseService.deleteGameTimesFromDb().then(() => {
            expect(stub.called).equals(true);
        });
    });

    it('should not delete best times if the DB is empty', async () => {
        dataBaseService.deleteGameTimesFromDb().then(() => {
            expect(dataBaseService.db).equals(undefined);
        });
    });

    it('should return the connection status of our DB', async () => {
        expect(dataBaseService.getClientConnection()).equals(true);
    });

    it('should connect to the database', async () => {
        const mongoUri = mongoServer.getUri();

        await dataBaseService.connectToServer(mongoUri);
        expect(dataBaseService['db'].databaseName).to.equal('games');
        expect(dataBaseService['client']).not.equal(undefined);
    });

    it('should not connect to the database called with wrong URL', async () => {
        dataBaseService
            .connectToServer('mongodb+srv://ddummy_username:ddummy_username@cluster0.ujabntz.mongodb.net/?retryWrites=true&w=majority')
            .then(() => {
                expect(dataBaseService.client).equal(undefined);
            });
    });

    it('should get game data from the database', async () => {
        dataBaseService['games'].push(finalGame);
        dataBaseService.getGamesData();
        expect(dataBaseService.getGamesData()).to.deep.equal([finalGame]);
    });

    it('should get game names from the database', async () => {
        dataBaseService.gameNames.push('game');
        expect(dataBaseService.getGamesNames()).to.deep.equal(['game']);
    });

    it('should return a list of games for the carousel', async () => {
        dataBaseService['games'].push(finalGame);
        dataBaseService.getGames().then((result: GameSheet[]) => {
            expect(result).to.deep.equal([baseGameSheet]);
        });
    });

    it('should return an empty list if no games exist', async () => {
        dataBaseService.getGames().then((result: GameSheet[]) => {
            expect(result).to.deep.equal([]);
        });
    });

    it('should return the game corresponding to its name', async () => {
        dataBaseService['games'] = [];
        dataBaseService['games'].push(finalGame);
        const game = await dataBaseService.getGame('image');
        expect(game).equals(finalGame);
    });

    it('should add a game to the database', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_constants');

        const collectionStub = sinon.stub(dataBaseService.db.collection('game_times'), 'insertOne');

        dataBaseService.addGame(finalGame).then(() => {
            expect(collectionStub.called).equals(true);
            expect(dataBaseService['games']).to.deep.equal([finalGame]);
        });
    });

    it('should reset the best times for one game', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_data');
        dataBaseService['games'].push(finalGame);

        const updateStub = sinon.stub(dataBaseService.db.collection('game_data'), 'updateOne');

        dataBaseService.resetBestTimesForOneGame('image').then(() => {
            expect(updateStub.called).equals(true);
        });
    });

    it('should update best times in mongoDB during solo game', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_data');

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const updateStub = sinon.stub(dataBaseService.db.collection('game_times'), 'findOneAndUpdate').callsFake(() => {});
        dataBaseService.updateGameBestTimes(finalGame, defaultBestTimes, 'Classic - solo').then(() => {
            expect(updateStub.called).equals(true);
        });
    });

    it('should update best times in mongoDB during multiplayer game', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_data');

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const updateStub = sinon.stub(dataBaseService.db.collection('game_times'), 'findOneAndUpdate').callsFake(() => {});
        dataBaseService.updateGameBestTimes(finalGame, defaultBestTimes, 'Classic 1v1').then(() => {
            expect(updateStub.called).equals(true);
        });
    });

    it('should not connect to the database called with wrong URL', async () => {
        dataBaseService
            .connectToServer('mongodb+srv://ddummy_username:ddummy_username@cluster0.ujabntz.mongodb.net/?retryWrites=true&w=majority')
            .then(() => {
                expect(dataBaseService.client).equal(undefined);
            });
    });

    it('should not update best times', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_data');

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const updateStub = sinon.stub(dataBaseService.db.collection('game_times'), 'findOneAndUpdate').callsFake(() => {});
        dataBaseService.updateGameBestTimes(finalGame, defaultBestTimes, 'duchuwchwugfbei').then(() => {
            expect(updateStub.called).equals(true);
        });
    });

    it('should not reset the best times for a non-existant game', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_data');
        dataBaseService['games'].push(finalGame);

        const updateStub = sinon.stub(dataBaseService.db.collection('game_data'), 'updateOne');

        dataBaseService.resetBestTimesForOneGame('newGame').then(() => {
            expect(updateStub.called).equals(true);
        });
    });
    it('should reset the best times for all games', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_data');
        dataBaseService['games'].push(finalGame);

        const updateStub = sinon.stub(dataBaseService.db.collection('game_data'), 'updateMany');

        dataBaseService.resetBestTimesForAllGames().then(() => {
            expect(updateStub.called).equals(true);
        });
    });

    it('should reset game constants', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('games');

        const replaceStub = sinon.stub(dataBaseService.db.collection('game_constants'), 'replaceOne');

        dataBaseService.resetConstants().then(() => {
            expect(replaceStub.called).equals(true);
        });
    });

    it('should not add a game to our local DB', async () => {
        dataBaseService.addGame(finalGame).then(() => {
            expect(dataBaseService.client).equal(undefined);
            expect(dataBaseService['games'].length).equals(0);
        });
    });

    it('should remove a game from the database', async () => {
        dataBaseService.gameNames.push('image');
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_times');
        dataBaseService['games'].push(finalGame);

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        sinon.stub(dataBaseService.db.collection('game_times'), 'deleteOne').callsFake(() => {});

        dataBaseService.removeGameFile('image');
        expect(dataBaseService['games'].length).equal(0);
    });

    it('should remove a game from the database but not remove the name from gameNames', async () => {
        dataBaseService.gameNames = [];
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('games');
        dataBaseService['games'].push(finalGame);

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        sinon.stub(dataBaseService.db.collection('game_times'), 'deleteOne').callsFake(() => {});

        dataBaseService.removeGameFile('image');
        expect(dataBaseService['games'].length).equal(0);
    });

    it('should not remove a game file', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_times');

        dataBaseService['games'].push(finalGame);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const deleteStub = sinon.stub(dataBaseService.db.collection('game_times'), 'deleteOne').callsFake(() => {});
        dataBaseService.removeGameFile('game');
        expect(deleteStub.called).equal(false);
    });

    it('should remove all games from the database', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('game_times');

        const deleteStub = sinon.stub(dataBaseService.db.collection('game_times'), 'deleteMany');

        dataBaseService.deleteAll().then(() => {
            expect(deleteStub.called).equals(true);
            expect(dataBaseService['games'].length).equals(0);
        });
    });

    it('should return all game names', () => {
        dataBaseService.gameNames = [];
        dataBaseService.gameNames.push('image');
        dataBaseService.gameNames.push('image2');
        expect(dataBaseService.getGamesNames()).to.deep.equal(['image', 'image2']);
    });

    it('should get game constants from mongoDB', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('games');

        const stub = sinon.stub(dataBaseService.db.collection('game_constants').find(), 'toArray');

        dataBaseService.getGamesConstants().then(() => {
            expect(stub.called).equals(true);
        });
    });

    it('should update game constants from mongoDB', async () => {
        const mongoUri = mongoServer.getUri();
        const client = await mongoDB.MongoClient.connect(mongoUri);
        dataBaseService.db = client.db('games');

        const stub = sinon.stub(dataBaseService.db.collection('game_constants'), 'replaceOne');

        dataBaseService.updateGamesConstant(undefined as unknown as AdminConstants).then(() => {
            expect(stub.called).equals(true);
        });
        setTimeout(() => {
            client.close();
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        }, 1500);
    });

    it('should handle the case when we can get best times for getting games', async () => {
        // eslint-disable-next-line no-unused-vars
        sinon.stub(dataBaseService, 'getGameBestTimes').callsFake(async (gameName: string) => {
            return Promise.resolve([finalGame.gameTimes] as unknown as GameTimes);
        });
        dataBaseService['games'].push(finalGame);
        dataBaseService.getGames().then(() => {
            expect(dataBaseService['selectionViewGames']).deep.equal([
                {
                    name: dataBaseService['games'][0].gameTimes.name,
                    link: dataBaseService['games'][0].gameSheet.originalLink,
                    soloBestTimes: DEFAULT_BEST_TIMES,
                    multiplayerBestTimes: DEFAULT_BEST_TIMES,
                },
            ]);
        });
    });

    it('should handle the case when we cant get best times for getting games', async () => {
        // eslint-disable-next-line no-unused-vars
        sinon.stub(dataBaseService, 'getGameBestTimes').callsFake(async (gameName: string) => {
            return Promise.resolve(finalGame.gameTimes);
        });
        dataBaseService['games'].push(finalGame);
        dataBaseService.getGames().then(() => {
            expect(dataBaseService['selectionViewGames']).deep.equal([
                {
                    name: dataBaseService['games'][0].gameTimes.name,
                    link: dataBaseService['games'][0].gameSheet.originalLink,
                    soloBestTimes: DEFAULT_BEST_TIMES,
                    multiplayerBestTimes: DEFAULT_BEST_TIMES,
                },
            ]);
        });
    });

    it('should not update bestTimes on DB', () => {
        dataBaseService.updateGameBestTimes(finalGame, DEFAULT_BEST_TIMES, 'Classic - solo').then(() => {
            expect(dataBaseService.client).equal(undefined);
        });
    });
});
