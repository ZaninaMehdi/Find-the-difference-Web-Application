/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { AdminConstantsToNumber } from '@app/interfaces/admin-constants-number';
import { GameData, GameSheet, ServerGameSheet } from '@app/interfaces/game-sheet';
import { CommunicationService } from '@app/services/communication-service/communication.service';

describe('CommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: CommunicationService;
    let baseUrl: string;
    let gameNames: string[];
    let games: GameSheet[];
    let game: GameData;
    let constants: AdminConstants;
    let newGame: ServerGameSheet;
    let newConstants: AdminConstantsToNumber;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(CommunicationService);
        httpMock = TestBed.inject(HttpTestingController);

        // eslint-disable-next-line dot-notation
        baseUrl = service['baseUrl'];
        gameNames = ['bleep', 'bloop'];
        newConstants = {
            initialTime: 5,
            penaltyTime: 4,
            bonusTime: 3,
        };
        constants = {
            initialTime: new Date(5),
            penaltyTime: new Date(5),
            bonusTime: new Date(5),
        };
        newGame = {
            originalLink: '',
            modifiedLink: '',
            differenceCounter: 0,
            differenceLocations: [[]],
            name: 'new game',
        };
        games = [
            {
                name: 'gameName',
                soloBestTimes: [{ name: 'name', time: 340 }],
                multiplayerBestTimes: [{ name: 'name', time: 340 }],
                link: '',
            },
        ];
        game = {
            gameSheet: {
                originalLink: '',
                modifiedLink: '',
                differenceCounter: 0,
                differenceLocations: [[]],
                name: 'gameName',
            },
            gameTimes: {
                name: 'gameName',
                bestSoloTimes: [{ name: 'name', time: 340 }],
                bestMultiplayerTimes: [{ name: 'name', time: 340 }],
            },
        };
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get the list of game names from the server', () => {
        service.getGameNames().subscribe({
            next: (response: string[]) => {
                expect(response).toEqual(gameNames);
            },
            error: fail,
        });

        const request = httpMock.expectOne(`${baseUrl}/admin/gameNames`);
        expect(request.request.method).toBe('GET');
        request.flush(gameNames);
    });

    it('should get the list of games from the server', () => {
        service.getGames().subscribe({
            next: (response: GameSheet[]) => {
                expect(response).toEqual(games);
            },
            error: fail,
        });

        const request = httpMock.expectOne(`${baseUrl}/admin/games`);
        expect(request.request.method).toBe('GET');
        request.flush(games);
    });

    it('should get gamesData from the server', () => {
        service.getAllGames().subscribe({
            next: (response: GameData[]) => {
                expect(response).toEqual([game]);
            },
            error: fail,
        });

        const request = httpMock.expectOne(`${baseUrl}/admin/gameData`);
        expect(request.request.method).toBe('GET');
        request.flush([game]);
    });

    it('should get the correct game from the list of games in the server', () => {
        service.getGame('gameName').subscribe({
            next: (response: GameData) => {
                expect(response).toEqual(game);
            },
            error: fail,
        });

        const request = httpMock.expectOne(`${baseUrl}/admin/game/gameName`);
        expect(request.request.method).toBe('GET');
        request.flush(game);
    });

    it('should get the admin constants', () => {
        service.getAdminConstants().subscribe({
            next: (response: AdminConstants) => {
                expect(response).toEqual(constants);
            },
            error: fail,
        });

        const request = httpMock.expectOne(`${baseUrl}/admin/constants`);
        expect(request.request.method).toBe('GET');
        request.flush(constants);
    });

    it('should add a new game to the server', () => {
        service.postGame(newGame).subscribe({
            next: () => {},
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/createGame`);
        expect(req.request.method).toBe('POST');
        req.flush(newGame);
    });

    it('should update the admin constants', () => {
        service.putAdminConstants(newConstants).subscribe({
            next: () => {},
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/`);
        expect(req.request.method).toBe('PUT');
        req.flush(newConstants);
    });

    it('should delete a game', () => {
        service.deleteGame('game').subscribe({
            next: () => {},
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/deleteGame/game`);
        expect(req.request.method).toBe('DELETE');
        req.flush('game');
    });

    it('should update game constants', () => {
        service.resetConstants().subscribe({
            next: () => {},
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/updateConstants/`);
        expect(req.request.method).toBe('PUT');
        req.flush('');
    });

    it('should delete all games', () => {
        service.deleteGames().subscribe({
            next: () => {},
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/deleteGames/`);
        expect(req.request.method).toBe('DELETE');
        req.flush('');
    });
    it('should reset a game bestTimes', () => {
        service.deleteBestTimes('game').subscribe({
            next: () => {},
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/deleteBestTimes/game`);
        expect(req.request.method).toBe('DELETE');
        req.flush('game');
    });

    it('should delete all best times', () => {
        service.deleteAllBestTimes().subscribe({
            next: () => {},
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/deleteAllBestTimes/`);
        expect(req.request.method).toBe('DELETE');
        req.flush('');
    });

    it('should handle http error safely', () => {
        service.getGameNames().subscribe({
            next: (response: string[]) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/admin/gameNames`);
        expect(req.request.method).toBe('GET');
        req.error(new ProgressEvent('Random error occurred'));
    });
});
