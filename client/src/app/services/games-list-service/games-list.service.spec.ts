/* eslint-disable max-lines */
import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BestTimes, GameData, GameSheet, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { AdminViewComponent } from '@app/pages/admin-view/admin-view.component';
import { WaitingRoomComponent } from '@app/pages/waiting-room/waiting-room.component';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { GamesListService } from '@app/services/games-list-service/games-list.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { of } from 'rxjs';

describe('GamesListService', () => {
    let service: GamesListService;
    let communicationService: CommunicationService;
    let roomManager: RoomManagerService;

    const gameSheet: ServerGameSheet = {
        originalLink: 'assets/bmp_640.bmp',
        modifiedLink: 'assets/bmp_640.bmp',
        differenceCounter: 1,
        differenceLocations: [[{ x: 0, y: 0 }]],
        name: 'game',
    };
    const gameTimes: GameTimes = {
        name: 'boo',
        bestSoloTimes: [],
        bestMultiplayerTimes: [],
    };
    const game: GameData = {
        gameSheet,
        gameTimes,
    };
    const gamesArray: GameSheet[] = [
        {
            name: '1er jeu',
            soloBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            multiplayerBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            link: 'assetsimg\binglybongly_wallpaper.bmp',
        },
        {
            name: '1er jeu',
            soloBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            multiplayerBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            link: 'assetsimg\binglybongly_wallpaper.bmp',
        },
        {
            name: '1er jeu',
            soloBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            multiplayerBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            link: 'assetsimg\binglybongly_wallpaper.bmp',
        },
        {
            name: '1er jeu',
            soloBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            multiplayerBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            link: 'assetsimg\binglybongly_wallpaper.bmp',
        },
        {
            name: '1er jeu',
            soloBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            multiplayerBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            link: 'assetsimg\binglybongly_wallpaper.bmp',
        },
        {
            name: '1er jeu',
            soloBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            multiplayerBestTimes: [
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
                {
                    name: 'test',
                    time: 45,
                },
            ],
            link: 'assetsimg\binglybongly_wallpaper.bmp',
        },
    ];
    const gamesMatrix: GameSheet[][] = [
        [
            {
                name: '1er jeu',
                soloBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                multiplayerBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                link: 'assetsimg\binglybongly_wallpaper.bmp',
            },
            {
                name: '1er jeu',
                soloBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                multiplayerBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                link: 'assetsimg\binglybongly_wallpaper.bmp',
            },
            {
                name: '1er jeu',
                soloBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                multiplayerBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                link: 'assetsimg\binglybongly_wallpaper.bmp',
            },
            {
                name: '1er jeu',
                soloBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                multiplayerBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                link: 'assetsimg\binglybongly_wallpaper.bmp',
            },
        ],
        [
            {
                name: '1er jeu',
                soloBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                multiplayerBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                link: 'assetsimg\binglybongly_wallpaper.bmp',
            },
            {
                name: '1er jeu',
                soloBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                multiplayerBestTimes: [
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                    {
                        name: 'test',
                        time: 45,
                    },
                ],
                link: 'assetsimg\binglybongly_wallpaper.bmp',
            },
        ],
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                RouterTestingModule,
                RouterModule.forRoot([
                    { path: 'admin', component: AdminViewComponent },
                    { path: 'waiting-room', component: WaitingRoomComponent },
                ]),
            ],
        });
        service = TestBed.inject(GamesListService);
        communicationService = TestBed.inject(CommunicationService);
        roomManager = TestBed.inject(RoomManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create a new game and navigate back to admin', () => {
        const redirectionSpy = spyOn(roomManager, 'redirection');
        const gameNamesSpy = spyOn(communicationService, 'getGameNames').and.returnValue(of(['bleep', 'bloop']));
        // eslint-disable-next-line no-unused-vars
        const communicationSpy = spyOn(communicationService, 'postGame').and.callFake((gameData: ServerGameSheet) => {
            return of(void 0);
        });

        service.createGame(gameSheet);
        expect(gameNamesSpy).toHaveBeenCalled();
        expect(communicationSpy).toHaveBeenCalled();
        expect(redirectionSpy).toHaveBeenCalledOnceWith('/admin');
    });

    it('should call roomManager and redirect to game page', () => {
        const communicationSpy = spyOn(communicationService, 'getGame').and.returnValue(of(game));
        // eslint-disable-next-line @typescript-eslint/no-shadow, no-unused-vars, @typescript-eslint/no-empty-function
        const soloGameSpy = spyOn(roomManager, 'startSoloGame').and.callFake((player: string, game: GameData) => {});
        service.redirectToGame('gameName', 'player');

        expect(communicationSpy).toHaveBeenCalled();
        expect(soloGameSpy).toHaveBeenCalledWith('player', game);
    });

    it('should call roomManager and to create a multiplayer game', () => {
        const communicationSpy = spyOn(communicationService, 'getGame').and.returnValue(of(game));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const connectSpy = spyOn(roomManager, 'connect').and.callFake(() => {});
        // eslint-disable-next-line @typescript-eslint/no-shadow, no-unused-vars, @typescript-eslint/no-empty-function
        const multGameSpy = spyOn(roomManager, 'createMultiGame').and.callFake((host: string, mode: string, game: GameData) => {});
        service.createMultiplayerRoom('host', 'Classic 1v1', 'gameName');

        expect(communicationSpy).toHaveBeenCalled();
        expect(connectSpy).toHaveBeenCalled();
        expect(multGameSpy).toHaveBeenCalledWith('host', 'Classic 1v1', game);
    });

    it('should get available multiplayer rooms', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const availableRoomsSpy = spyOn(roomManager, 'getAvailableRooms').and.callFake(() => {});
        service.getAvailableRooms();
        expect(availableRoomsSpy).toHaveBeenCalled();
    });

    it('should call roomManager when all games are deleted', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const availableRoomsSpy = spyOn(roomManager, 'onAllGamesDeleted').and.callFake(() => {});
        service.sendOnDeleteAllGames();
        expect(availableRoomsSpy).toHaveBeenCalled();
    });
    it('should redirect guest', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const createGuestSpy = spyOn(roomManager, 'createGuest').and.callFake(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const redirectionGuestSpy = spyOn(roomManager, 'redirection').and.callFake(() => {});
        service.redirectGuest('aymane');
        expect(createGuestSpy).toHaveBeenCalled();
        expect(redirectionGuestSpy).toHaveBeenCalled();
    });

    it('should return an empty array when sortTimes is called with an emptyArray', () => {
        expect(service.sortTimes([])).toEqual([]);
    });

    it('should sort numbers in ascending order and return 3 first values when sortTimes is called', () => {
        const unsortedValues: BestTimes[] = [
            {
                name: 'test1',
                time: 3,
            },
            {
                name: 'test2',
                time: 4,
            },
            {
                name: 'test3',
                time: 5,
            },
            {
                name: 'test4',
                time: 2,
            },
            {
                name: 'test5',
                time: 1,
            },
            {
                name: 'test6',
                time: 6,
            },
        ];
        const threeFirstSortedValues: BestTimes[] = [
            {
                name: 'test5',
                time: 1,
            },
            {
                name: 'test4',
                time: 2,
            },
            {
                name: 'test1',
                time: 3,
            },
        ];
        expect(service.sortTimes(unsortedValues)).toEqual(threeFirstSortedValues);
    });
    it('should sort array with length inferior to 3 ', () => {
        const unsortedValues: BestTimes[] = [
            {
                name: 'test1',
                time: 20,
            },
            {
                name: 'test2',
                time: 5,
            },
        ];
        const twoFirstSortedValues: BestTimes[] = [
            {
                name: 'test2',
                time: 5,
            },
            {
                name: 'test1',
                time: 20,
            },
        ];
        expect(service.sortTimes(unsortedValues)).toEqual(twoFirstSortedValues);
    });

    it('should create a 4 rows matrix of GameSheet when calling createMatrixOfGames with a GameSheet array', () => {
        expect(service.createMatrixOfGames(gamesArray)).toEqual(gamesMatrix);
    });

    it('return true when we have the same bestTimes', () => {
        const defaultBestTimes = [
            { name: 'John Doe', time: 100 },
            { name: 'Jane Doe', time: 200 },
            { name: 'the scream', time: 250 },
        ];
        expect(service.compareTwoBestTimes(defaultBestTimes, defaultBestTimes)).toEqual(true);
    });

    it('return true when we do not have the same bestTimes', () => {
        const defaultBestTimes = [
            { name: 'John Doe', time: 100 },
            { name: 'Jane Doe', time: 200 },
            { name: 'the scream', time: 250 },
        ];

        const defaultBestTimes2 = [
            { name: 'John Doe', time: 100 },
            { name: 'Jane Doe', time: 200 },
            { name: 'the scream', time: 300 },
        ];
        expect(service.compareTwoBestTimes(defaultBestTimes, defaultBestTimes2)).toEqual(false);
    });

    it('should call updateGameSheet method', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const updateGameSheetStub = spyOn(roomManager, 'updateGameSheet').and.callFake(() => {});
        service.updateGameSheet();
        expect(updateGameSheetStub).toHaveBeenCalled();
    });
    it('should refresh page ', () => {
        spyOn(roomManager.isRefreshed, 'asObservable').and.returnValue(of(true));
        const spy = spyOn(roomManager, 'onRefresh').and.callFake(() => {
            return of(void 0);
        });
        spyOn(roomManager.isRefreshed, 'subscribe').and.callThrough();
        service.refreshComponent();
        expect(spy).toHaveBeenCalled();
    });
});
