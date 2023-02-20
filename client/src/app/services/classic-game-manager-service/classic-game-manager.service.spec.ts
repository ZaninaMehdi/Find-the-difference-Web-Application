import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { SelectionViewComponent } from '@app/pages/selection-view/selection-view.component';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { PlayAreaService } from '@app/services/play-area-service/play-area.service';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}

describe('ClassicGameManagerService', () => {
    const gameSheet: ServerGameSheet = {
        originalLink: '',
        modifiedLink: '',
        differenceCounter: 3,
        differenceLocations: [[{ x: 3, y: 6 }]],
        name: 'boo',
    };
    const gameSheet2: ServerGameSheet = {
        originalLink: '',
        modifiedLink: '',
        differenceCounter: 3,
        differenceLocations: [[{ x: 3, y: 6 }], [{ x: 8, y: 9 }]],
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
    const mockGuest: GuestPlayer = {
        id: 'id',
        guestName: 'guest',
        differencesFound: 3,
        differenceLocations: [[{ x: 0, y: 0 }]],
    };
    const mockGuest2: GuestPlayer = {
        id: 'id2',
        guestName: 'guest2',
        differencesFound: 4,
        differenceLocations: [[{ x: 0, y: 0 }]],
    };

    let classicManager: ClassicGameManagerService;
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketClientServiceMock;
    let playAreaService: PlayAreaService;
    let router: Router;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule, RouterModule.forRoot([{ path: 'selection', component: SelectionViewComponent }])],
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
            declarations: [SelectionViewComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        router = TestBed.inject(Router);
        classicManager = TestBed.inject(ClassicGameManagerService);
        playAreaService = TestBed.inject(PlayAreaService);
        classicManager.handleSocket();
        classicManager.currentRoom = mockRoomInfo;
    });

    it('should be created', () => {
        expect(classicManager).toBeTruthy();
    });

    it('should not call connect if socket is alive', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.callFake(() => true);
        const connectSpy = spyOn(socketServiceMock, 'connect');
        classicManager.connect();
        expect(connectSpy).not.toHaveBeenCalled();
    });

    it('connectPlayer should call connect if socket is not alive', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.callFake(() => false);
        const connectSpy = spyOn(socketServiceMock, 'connect');
        classicManager.connect();
        expect(connectSpy).toHaveBeenCalled();
    });

    it('should get data with getRoomInfo ', () => {
        const roomInfoSpy = spyOn(classicManager.roomInfo, 'asObservable');
        classicManager.getRoomInfo();
        expect(roomInfoSpy).toHaveBeenCalled();
    });

    it('should redirect when redirection is called', () => {
        const routerSpy = spyOn(router, 'navigate');
        classicManager.redirection('/selection');
        expect(routerSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['/selection']);
    });

    it('should disconnect the socket', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const disconnectSpy = spyOn(socketServiceMock, 'disconnect').and.callFake(() => {});
        classicManager.disconnect();
        expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should quit game  when quitGame is called', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const disconnectSpy = spyOn(socketServiceMock, 'disconnect').and.callFake(() => {});
        classicManager.quitGame();
        expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should send coordinates when sendCoords is called', () => {
        const vec: Point2d = { x: 5, y: 3 };
        // eslint-disable-next-line @typescript-eslint/no-shadow, no-unused-vars, @typescript-eslint/no-empty-function
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((vec) => {});
        classicManager.sendCoords(mockRoomInfo, vec);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should send the status of game when gameStatus is called', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, no-unused-vars, @typescript-eslint/no-empty-function
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((mockRoomInfo) => {});
        classicManager.gameStatus(mockRoomInfo);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should call socket service send  when addPenaltyTime is called', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, no-unused-vars, @typescript-eslint/no-empty-function
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((mockRoomInfo) => {});
        classicManager.addPenaltyTime(mockRoomInfo);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should play winning sound and display flashing difference', (done) => {
        classicManager.currentRoom.currentDifference = [{ x: 9, y: 9 }];
        classicManager.winSound = new Audio('assets/beep.wav');

        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const flashDifferencePixelsSpy = spyOn(playAreaService, 'flashDifferencePixels').and.callFake((difference: Point2d[]) => {});
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const removeDifferenceSpy = spyOn(playAreaService, 'removeDifferenceFromModifiedCanvas').and.callFake((difference: Point2d[]) => {});
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const gameStatusSpy = spyOn(classicManager, 'gameStatus').and.callFake((room: ClassicRoom) => {});
        const soundSpy = spyOn(classicManager.winSound, 'play');

        classicManager.removeDifference(true);
        expect(flashDifferencePixelsSpy).toHaveBeenCalledWith(classicManager.currentRoom.currentDifference);
        expect(removeDifferenceSpy).toHaveBeenCalledWith(classicManager.currentRoom.currentDifference);
        expect(gameStatusSpy).toHaveBeenCalledWith(classicManager.currentRoom);
        expect(soundSpy).toHaveBeenCalled();
        done();
    });

    it('should play losing sound and display error', (done) => {
        classicManager.currentRoom.currentDifference = [];
        classicManager.losingSound = new Audio('assets/beep.wav');
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const displayErrorSpy = spyOn(playAreaService, 'displayErrorOnCanvas').and.callFake(() => {});
        const soundSpy = spyOn(classicManager.losingSound, 'play');
        classicManager.removeDifference(true);

        expect(displayErrorSpy).toHaveBeenCalled();
        setTimeout(() => {
            expect(soundSpy).toHaveBeenCalled();
            done();
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        }, 1000);
    });

    it('should return true when socket is alive', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.callFake(() => true);
        expect(classicManager.isConnected()).toEqual(true);
    });

    it('should handle timerStarted server response', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        socketHelper.peerSideEmit('timerStarted', 5);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(classicManager.currentRoom.timer).toEqual(5);
    });

    it('should handle removedFoundDiff from server response in a solo Game', () => {
        socketHelper.peerSideEmit('removedFoundDiff', mockRoomInfo2);
        expect(classicManager.currentRoom.differencesFound).toEqual(mockRoomInfo2.differencesFound);
        expect(classicManager.currentRoom.game.gameSheet.differenceLocations).toEqual(mockRoomInfo2.game.gameSheet.differenceLocations);
        expect(classicManager.currentRoom.currentDifference).toEqual(mockRoomInfo2.currentDifference);
    });

    it('should handle removedFoundDiff from server response in a multiplayer Game', () => {
        mockRoomInfo2.guestInfo = mockGuest2;
        classicManager.currentRoom.guestInfo = mockGuest;
        socketHelper.peerSideEmit('removedFoundDiff', mockRoomInfo2);

        expect(classicManager.currentRoom.guestInfo?.differencesFound).toEqual(mockRoomInfo2.guestInfo.differencesFound);
        expect(classicManager.currentRoom.guestInfo?.differenceLocations).toEqual(mockRoomInfo2.guestInfo.differenceLocations);

        expect(classicManager.currentRoom.differencesFound).toEqual(mockRoomInfo2.differencesFound);
        expect(classicManager.currentRoom.game.gameSheet.differenceLocations).toEqual(mockRoomInfo2.game.gameSheet.differenceLocations);
        expect(classicManager.currentRoom.currentDifference).toEqual(mockRoomInfo2.currentDifference);
    });

    it('should handle finishedGame server response', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const quitGameSpy = spyOn(classicManager, 'quitGame').and.callFake(() => {});
        socketHelper.peerSideEmit('finishedGame', 'end message');
        expect(classicManager.currentRoom.endGameMessage).toEqual('end message');
        expect(quitGameSpy).toHaveBeenCalled();
    });

    it('should redirect to selection when a game is abandoned', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        const redirectionSpy = spyOn(classicManager, 'redirection').and.callFake((route: string) => {});
        socketHelper.peerSideEmit('hasAbondonnedGame', true);
        expect(redirectionSpy).toHaveBeenCalledWith('/selection');
    });
});
