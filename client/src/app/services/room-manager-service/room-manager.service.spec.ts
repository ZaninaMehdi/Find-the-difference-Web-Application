/* eslint-disable max-lines */
import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameData, GameSheet, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { AdminViewComponent } from '@app/pages/admin-view/admin-view.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { SelectionViewComponent } from '@app/pages/selection-view/selection-view.component';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { of, Subject } from 'rxjs';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}

describe('RoomManagerService', () => {
    const gameSheet: ServerGameSheet = {
        originalLink: '',
        modifiedLink: '',
        differenceCounter: 3,
        differenceLocations: [[{ x: 3, y: 6 }]],
        name: 'boo',
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
    const mockRoomInfo: ClassicRoom = {
        hostId: 'blab',
        roomId: '1',
        playerName: 'bleepbloop',
        hintPenalty: 5,
        game,
        gameMode: 'Classic - solo',
        timer: 0,
        differencesFound: 5,
        endGameMessage: '',
        currentDifference: [],
    };
    const mockGuest: GuestPlayer = {
        id: 'id',
        guestName: 'guest',
    };
    const gameSheet2: ServerGameSheet = {
        originalLink: '',
        modifiedLink: '',
        differenceCounter: 3,
        differenceLocations: [[{ x: 3, y: 6 }], [{ x: 8, y: 9 }]],
        name: 'boo',
    };
    const game2: GameData = {
        gameSheet: gameSheet2,
        gameTimes,
    };
    const mockRoomInfo2: ClassicRoom = {
        hostId: 'blab',
        roomId: '1',
        playerName: 'bleep',
        hintPenalty: 5,
        game: game2,
        gameMode: 'Classic - solo',
        timer: 0,
        differencesFound: 8,
        endGameMessage: '',
        currentDifference: [{ x: 6, y: 6 }],
    };
    const mockGameSheet: GameSheet = {
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
        link: 'ballal',
    };

    let roomManager: RoomManagerService;
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketClientServiceMock;
    let classicManager: ClassicGameManagerService;
    let clientSocket: ClientSocketService;
    let limitedManager: LimitedTimeService;
    let router: Router;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                RouterTestingModule,
                RouterModule.forRoot([
                    { path: 'selection', component: SelectionViewComponent },
                    { path: 'admin', component: AdminViewComponent },
                    { path: 'game', component: GamePageComponent },
                ]),
            ],
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
            declarations: [SelectionViewComponent, GamePageComponent],
        });
        roomManager = TestBed.inject(RoomManagerService);
        limitedManager = TestBed.inject(LimitedTimeService);
        classicManager = TestBed.inject(ClassicGameManagerService);
        clientSocket = TestBed.inject(ClientSocketService);
        router = TestBed.inject(Router);
        roomManager.handleSocket();
        roomManager.currentRoom = mockRoomInfo;
        roomManager.availableRooms = [];
        classicManager.currentRoom = mockRoomInfo;
    });

    it('should be created', () => {
        expect(roomManager).toBeTruthy();
    });

    it('should not call connect if socket is alive', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.callFake(() => true);
        const connectSpy = spyOn(socketServiceMock, 'connect');
        roomManager.connect();
        expect(connectSpy).not.toHaveBeenCalled();
    });

    it('connectPlayer should call connect if socket is not alive', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.callFake(() => false);
        const connectSpy = spyOn(socketServiceMock, 'connect');
        roomManager.connect();
        expect(connectSpy).toHaveBeenCalled();
    });

    it('should get data with getRoomInfo ', () => {
        const roomInfoSpy = spyOn(roomManager.roomInfo, 'asObservable');
        roomManager.getRoomInfo();
        expect(roomInfoSpy).toHaveBeenCalled();
    });

    it('should request to remove all guests for a multiplayer room', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake(() => {});
        roomManager.removeGuests(mockRoomInfo);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should request all available multiplayer rooms from the server', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake(() => {});
        roomManager.getAvailableRooms();
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should send the name of player and gameInfo  when createSoloGame is called', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((mockRoomInfo) => {});
        roomManager.createSoloGame('John', 'Classic - solo', mockRoomInfo.game);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should send the guest player to the server', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((mockGuest) => {});
        roomManager.createGuest(mockGuest, mockGuest.guestName);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should send the name of player and gameInfo  when createMultGame is called', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((mockRoomInfo) => {});
        roomManager.createMultiGame('Host', 'Classic 1v1', mockRoomInfo.game);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should send a request to connect the guest player to the multiplayer room', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((mockRoomInfo) => {});
        roomManager.guestJoinRoom(mockRoomInfo);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should redirect when redirection is called', () => {
        const routerSpy = spyOn(router, 'navigate');
        roomManager.redirection('/selection');
        expect(routerSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['/selection']);
    });

    it('should send a request to delete a particular game room', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string, mockRoomInfo) => {});
        roomManager.deleteRoom(mockRoomInfo);
        expect(sendSpy).toHaveBeenCalledWith('deleteRoom', mockRoomInfo);
    });
    it('should send a deleteMessage to the server', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((mockGuest) => {});
        roomManager.onAllGamesDeleted();
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should send a request to add guest information to the multiplayer room', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake(() => {});
        roomManager.joinGuest(mockGuest, mockRoomInfo);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should send a request to refuse a particular guest', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string, mockGuest) => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const disconnectSpy = spyOn(roomManager['clientSocket'], 'disconnect').and.callFake(() => {});
        mockGuest.id = 'socketId';
        roomManager['clientSocket'].socket.id = 'socketId';
        roomManager.refuseGuest(mockGuest, mockRoomInfo);
        expect(sendSpy).toHaveBeenCalled();
        expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should send a request to update gameSheet', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string) => {});
        roomManager.updateGameSheet();
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should send a request when game is deleted', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string, mockGame) => {});
        roomManager.sendOnDelete(mockGameSheet);
        expect(sendSpy).toHaveBeenCalled();
    });
    it('should send a request when a limited room is deleted', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string, mockGame) => {});
        roomManager.deleteLimitedRoom(mockRoomInfo);
        expect(sendSpy).toHaveBeenCalled();
    });
    it('should send a request when a limited soloRoom is created', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string, mockGuest) => {});
        roomManager.createLimitedSolo(mockGuest.guestName, [game]);
        expect(sendSpy).toHaveBeenCalled();
    });
    it('should send a request when a limited multiRoom is created', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string, mockGuest) => {});
        roomManager.createLimitedMulti(mockGuest.guestName, [game]);
        expect(sendSpy).toHaveBeenCalled();
    });
    it('should send a request to redirect guest in  limitedMode', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string, mockGuest) => {});
        roomManager.redirectGuest(mockGuest.guestName);
        expect(sendSpy).toHaveBeenCalled();
    });
    it('should send a request when getAvailable Room is called', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string) => {});
        roomManager.getAvailableLimitedModerooms();
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should start a classic solo game and redirect to game page', () => {
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function
        const soloGameSpy = spyOn(roomManager, 'createSoloGame').and.callFake((name: string, mode: string, game: GameData) => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const handleSocketSpy = spyOn(roomManager, 'handleSocket').and.callFake(() => {});
        const routerSpy = spyOn(router, 'navigate');
        roomManager.startSoloGame('player', game);
        expect(soloGameSpy).toHaveBeenCalledWith('player', 'Classic - solo', game);
        expect(handleSocketSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['/game']);
    });

    it('should handle createdSoloRoom server response', () => {
        socketHelper.peerSideEmit('createdSoloRoom', mockRoomInfo2);
        expect(classicManager.currentRoom).toEqual(mockRoomInfo2);
    });

    it('should handle createdMultRoom server response', () => {
        socketHelper.peerSideEmit('createdMultRoom', mockRoomInfo2);
        expect(roomManager.currentRoom).toEqual(mockRoomInfo2);
    });

    it('should handle listAvailableRooms server response', () => {
        socketHelper.peerSideEmit('listOfAvailableRooms', [mockRoomInfo2, mockRoomInfo]);
        expect(roomManager.availableRooms).toEqual([mockRoomInfo2, mockRoomInfo]);
    });

    it('should handle updatedRoom server response', () => {
        socketHelper.peerSideEmit('updatedRoom', mockRoomInfo2);
        expect(roomManager.currentRoom).toEqual(mockRoomInfo2);
    });

    it('should handle createdGuest server response', () => {
        roomManager.handleSocket();
        roomManager.guestNames = new Subject<GuestPlayer[]>();
        const nextSpy = spyOn(roomManager.guestNames, 'next');
        socketHelper.peerSideEmit('createdGuest', [mockGuest, mockGuest]);

        expect(nextSpy).toHaveBeenCalled();
        roomManager.guestNames.asObservable().subscribe((names: GuestPlayer[]) => {
            expect(names).toEqual([mockGuest, mockGuest]);
        });
    });

    it('should handle refusedGuest server response', () => {
        roomManager.handleSocket();
        roomManager.refusedGuest = new Subject<GuestPlayer>();
        const nextSpy = spyOn(roomManager.refusedGuest, 'next');
        socketHelper.peerSideEmit('refusedGuest', mockGuest);

        expect(nextSpy).toHaveBeenCalled();
        roomManager.refusedGuest.asObservable().subscribe((guest: GuestPlayer) => {
            expect(guest).toEqual(mockGuest);
        });
    });

    it('should handle acceptedGuest server response', () => {
        roomManager.handleSocket();
        roomManager.acceptedGuest = new Subject<GuestPlayer>();
        const nextSpy = spyOn(roomManager.acceptedGuest, 'next');
        socketHelper.peerSideEmit('acceptedGuest', mockGuest);

        expect(nextSpy).toHaveBeenCalled();
        roomManager.acceptedGuest.asObservable().subscribe((guest: GuestPlayer) => {
            expect(guest).toEqual(mockGuest);
        });
    });

    it('should handle acceptedGuest server response', () => {
        roomManager.handleSocket();
        roomManager.isGameDeleted = new Subject<boolean>();
        const nextSpy = spyOn(roomManager.isGameDeleted, 'next');
        socketHelper.peerSideEmit('deletedGame', true);

        expect(nextSpy).toHaveBeenCalled();
        roomManager.isGameDeleted.asObservable().subscribe((isGameDeleted: boolean) => {
            expect(isGameDeleted).toEqual(true);
        });
    });

    it('should handle removedRefusedSockets server response', () => {
        roomManager.handleSocket();
        roomManager.isSocketRemoved = new Subject<boolean>();
        const nextSpy = spyOn(roomManager.isSocketRemoved, 'next');
        socketHelper.peerSideEmit('removedRefusedSockets', true);

        expect(nextSpy).toHaveBeenCalled();
        roomManager.isGameDeleted.asObservable().subscribe((isSocketRemoved: boolean) => {
            expect(isSocketRemoved).toEqual(true);
        });
    });

    it('should handle removedAllGuests server response', () => {
        roomManager.handleSocket();
        roomManager.goBack = new Subject<boolean>();
        const nextSpy = spyOn(roomManager.goBack, 'next');
        socketHelper.peerSideEmit('removedAllGuests');
        expect(nextSpy).toHaveBeenCalled();
        roomManager.goBack.asObservable().subscribe((value: boolean) => {
            expect(value).toEqual(true);
        });
    });

    it('should return true when socket is connected', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.callFake(() => true);
        expect(roomManager.isConnected()).toEqual(true);
    });

    it('should get socketId', () => {
        clientSocket.socket.id = 'kjdjjd';
        expect(roomManager.getSocketId()).toEqual('kjdjjd');
    });

    it('should handle updateGuestRoom server response', () => {
        roomManager.handleSocket();
        roomManager.currentGuestRoom = new Subject<ClassicRoom>();
        const nextSpy = spyOn(roomManager.currentGuestRoom, 'next');
        socketHelper.peerSideEmit('updatedRoom', mockRoomInfo2);

        expect(nextSpy).toHaveBeenCalled();
        roomManager.currentGuestRoom.asObservable().subscribe((room: ClassicRoom) => {
            expect(room).toEqual(mockRoomInfo2);
        });
    });

    it('should handle gameStarted server response', () => {
        const routerSpy = spyOn(router, 'navigate');
        socketHelper.peerSideEmit('gameStarted', mockRoomInfo2);
        expect(classicManager.currentRoom).toEqual(mockRoomInfo2);
        expect(routerSpy).toHaveBeenCalledWith(['/game']);
    });

    it('should handle startedLimitedMulti server response', () => {
        const routerSpy = spyOn(router, 'navigate');
        socketHelper.peerSideEmit('startedLimitedMulti', mockRoomInfo2);
        limitedManager.isLimitedTimeGame.asObservable().subscribe((isLimitedTimeGame: boolean) => {
            expect(isLimitedTimeGame).toEqual(true);
        });
        expect(limitedManager.currentRoom).toEqual(mockRoomInfo2);
        expect(routerSpy).toHaveBeenCalledWith(['/game']);
    });

    it('should handle goBackLimited server response', () => {
        socketHelper.peerSideEmit('goBackLimited');
        roomManager.goBackLimited.asObservable().subscribe((isGoBackLimited: boolean) => {
            expect(isGoBackLimited).toEqual(true);
        });
    });

    it('should handle listOfAvailableLimitedRooms server response', () => {
        const mockLimitedRoom: ClassicRoom[] = [];
        mockLimitedRoom.push(mockRoomInfo2);
        socketHelper.peerSideEmit('listOfAvailableLimitedRooms', mockRoomInfo2);
        roomManager.availableRoomsEvent.asObservable().subscribe((room: ClassicRoom[]) => {
            expect(room).toEqual(mockLimitedRoom);
        });
        expect(roomManager.availableRooms).toEqual(mockLimitedRoom);
    });

    it('should handle createdLimitedMulti server response', () => {
        const routerSpy = spyOn(router, 'navigate');
        socketHelper.peerSideEmit('createdLimitedMulti', mockRoomInfo2);
        limitedManager.roomInformation.asObservable().subscribe((room: ClassicRoom) => {
            expect(room).toEqual(mockRoomInfo2);
        });
        expect(limitedManager.currentRoom).toEqual(mockRoomInfo2);
        expect(routerSpy).toHaveBeenCalledWith(['/waiting-room']);
    });
    it('should handle createdLimitedSolo server response', () => {
        const routerSpy = spyOn(router, 'navigate');
        socketHelper.peerSideEmit('createdLimitedSolo', mockRoomInfo2);
        limitedManager.roomInformation.asObservable().subscribe((room: ClassicRoom) => {
            expect(room).toEqual(mockRoomInfo2);
        });
        expect(limitedManager.currentRoom).toEqual(mockRoomInfo2);
        expect(routerSpy).toHaveBeenCalledWith(['/game']);
        socketHelper.peerSideEmit('createdLimitedSolo', undefined);
        roomManager.noGamesExist.asObservable().subscribe((noGamesExist: boolean) => {
            expect(noGamesExist).toEqual(true);
        });
    });

    it('should handle updateGameSheet server response', () => {
        const spy = spyOn(roomManager.isRefreshed, 'asObservable').and.returnValue(of(false));
        socketHelper.peerSideEmit('updateGameSheet');
        // eslint-disable-next-line no-unused-vars
        roomManager.isRefreshed.asObservable().subscribe((isRefreshed: boolean) => {
            expect(spy).toHaveBeenCalled();
        });
    });

    it('should handle roomIsCreated server response', () => {
        const spy = spyOn(roomManager.isCreated, 'asObservable').and.returnValue(of(true));
        socketHelper.peerSideEmit('roomIsCreated');
        // eslint-disable-next-line no-unused-vars
        roomManager.isCreated.asObservable().subscribe((isRefreshed: boolean) => {
            expect(spy).toHaveBeenCalled();
        });
    });

    it('should handle guestDidJoin server response', () => {
        const spy = spyOn(roomManager.isCreated, 'asObservable').and.returnValue(of(false));
        socketHelper.peerSideEmit('guestDidJoin');
        // eslint-disable-next-line no-unused-vars
        roomManager.isCreated.asObservable().subscribe((isRefreshed: boolean) => {
            expect(spy).toHaveBeenCalled();
        });
    });

    it('should reload the page', () => {
        spyOnProperty(router, 'url', 'get').and.returnValue('/admin');
        const fakeWindow = {
            location: {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                reload: () => {},
            },
        } as unknown as Window;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const reloadSpy = spyOn(fakeWindow.location, 'reload');
        roomManager.onRefresh(fakeWindow);
        expect(reloadSpy).toHaveBeenCalled();
    });

    it('should not reload the page', () => {
        spyOnProperty(router, 'url', 'get').and.returnValue('/alpha');
        const fakeWindow = {
            location: {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                reload: () => {},
            },
        } as unknown as Window;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const reloadSpy = spyOn(fakeWindow.location, 'reload');
        roomManager.onRefresh(fakeWindow);
        expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('should reload the join button', () => {
        spyOnProperty(router, 'url', 'get').and.returnValue('/limited-time');
        const fakeWindow = {
            location: {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                reload: () => {},
            },
        } as unknown as Window;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const reloadSpy = spyOn(fakeWindow.location, 'reload');
        roomManager.refreshJoinButton(fakeWindow);
        expect(reloadSpy).toHaveBeenCalled();
    });

    it('should check connection status', () => {
        spyOn(window, 'alert');
        socketHelper.peerSideEmit('connectionStatus', true);
        expect(window.alert).toHaveBeenCalled();
        expect(roomManager.isBddNotConnected).toBeDefined();
    });
});
