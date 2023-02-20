import { Application } from '@app/app';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { GameTimes } from '@app/interfaces/game-times';
import { ServerGameSheet } from '@app/interfaces/server-game-sheet';
import { AdminService } from '@app/services/admin/admin.service';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('AdminController', () => {
    let adminService: SinonStubbedInstance<AdminService>;
    let expressApp: Express.Application;

    const defaultBestTimes: BestTimes[] = [
        { name: 'John Doe', time: 100 },
        { name: 'Jane Doe', time: 200 },
        { name: 'the scream', time: 250 },
    ];

    const timesConstants: AdminConstants = {
        initialTime: 40,
        penaltyTime: 100,
        bonusTime: 50,
    };

    const baseGameSheet: GameSheet = {
        name: 'image',
        soloBestTimes: defaultBestTimes,
        multiplayerBestTimes: [],
        link: 'link',
    };
    const gameSheetServer: ServerGameSheet = {
        originalLink: '',
        modifiedLink: '',
        differenceCounter: 0,
        differenceLocations: [[]],
        name: 'image',
    };
    const gameTime: GameTimes = {
        name: baseGameSheet.name,
        bestSoloTimes: defaultBestTimes,
        bestMultiplayerTimes: [],
    };

    const finalGame: GameData = {
        gameSheet: gameSheetServer,
        gameTimes: gameTime,
    };

    const mockGameNames: string[] = ['game1', 'game2'];

    beforeEach(async () => {
        adminService = createStubInstance(AdminService);
        const app = Container.get(Application);
        // eslint-disable-next-line dot-notation
        Object.defineProperty(app['adminController'], 'adminService', { value: adminService });
        expressApp = app.app;
    });

    it('should get the games from the database on valid get request to /games', async () => {
        adminService.getGames.resolves([baseGameSheet]);
        return supertest(expressApp)
            .get('/admin/games')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal([baseGameSheet]);
            });
    });

    it('should get the game names on valid get request to /gameNames', async () => {
        adminService.getNames.returns(mockGameNames);
        return supertest(expressApp)
            .get('/admin/gameNames')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal(mockGameNames);
            });
    });

    it('should get the game from the database on valid get request to /game/:game', async () => {
        adminService.getGame.resolves(finalGame);
        return supertest(expressApp)
            .get('/admin/game/image')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal(finalGame);
            });
    });

    it('should store the game given a valid post request to /createGame', async () => {
        adminService.addGame.resolves(void 0);
        return supertest(expressApp).post('/admin/createGame').send(gameSheetServer).set('Accept', 'application/json').expect(StatusCodes.CREATED);
    });

    it('should modify the time constants given a valid put request to root', async () => {
        return supertest(expressApp).put('/admin').send(timesConstants).set('Accept', 'application/json').expect(StatusCodes.CREATED);
    });

    it('should get all games when given a valid get request to /gameData', async () => {
        adminService.getAllGameData.resolves([finalGame]);
        return supertest(expressApp)
            .get('/admin/gameData')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal([finalGame]);
            });
    });

    it('should get the time constants given a valid get request to /constants', async () => {
        adminService.getConstants.resolves(timesConstants);
        return supertest(expressApp)
            .get('/admin/constants')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal(timesConstants);
            });
    });

    it('should call the delete method from adminservice', async () => {
        adminService.deleteGame.resolves(void 0);
        return supertest(expressApp).delete('/admin/deleteGame/image').expect(StatusCodes.NO_CONTENT);
    });

    it('should call the deleteGames method from adminservice', async () => {
        adminService.deleteGames.resolves(void 0);
        return supertest(expressApp).delete('/admin/deleteGames').expect(StatusCodes.NO_CONTENT);
    });

    it('should call reset the best times object for a specified game', async () => {
        adminService.resetBestTimesForOneGame.resolves(void 0);
        return supertest(expressApp).delete('/admin/deleteBestTimes/image').expect(StatusCodes.NO_CONTENT);
    });

    it('should call reset the best times object for all games', async () => {
        adminService.resetBestTimesForAllGames.resolves(void 0);
        return supertest(expressApp).delete('/admin/deleteAllBestTimes').expect(StatusCodes.NO_CONTENT);
    });

    it('should call reset the the game constants for all games', async () => {
        adminService.resetConstants.resolves(void 0);
        return supertest(expressApp).put('/admin/updateConstants/').expect(StatusCodes.OK);
    });
});
