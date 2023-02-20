import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom } from '@app/interfaces/rooms';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { PlayAreaService } from '@app/services/play-area-service/play-area.service';
import { Socket } from 'socket.io-client';
import { LimitedTimeService } from './limited-time.service';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}

describe('LimitedTimeService', () => {
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
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketClientServiceMock;
    let limiterService: LimitedTimeService;
    let router: Router;
    let clientSocket: ClientSocketService;
    let playAreaService: PlayAreaService;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule, RouterModule.forRoot([{ path: 'game', component: GamePageComponent }])],
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
            declarations: [GamePageComponent],
        });
        limiterService = TestBed.inject(LimitedTimeService);
        router = TestBed.inject(Router);
        limiterService.handleSocket();
        clientSocket = TestBed.inject(ClientSocketService);
        playAreaService = TestBed.inject(PlayAreaService);
        limiterService.currentRoom = mockRoomInfo;
    });

    it('should be created', () => {
        expect(limiterService).toBeTruthy();
    });
    it('should not call connect if socket is alive', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.callFake(() => true);
        const connectSpy = spyOn(socketServiceMock, 'connect');
        limiterService.connect();
        expect(connectSpy).not.toHaveBeenCalled();
    });

    it('connectPlayer should call connect if socket is not alive', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.callFake(() => false);
        const connectSpy = spyOn(socketServiceMock, 'connect');
        limiterService.connect();
        expect(connectSpy).toHaveBeenCalled();
    });
    it('should redirect when redirection is called', () => {
        const routerSpy = spyOn(router, 'navigate');
        limiterService.redirection('/selection');
        expect(routerSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['/selection']);
    });
    it('should send a coords to server', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-empty-function, no-unused-vars
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((request: string, mockRoomInfo) => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        limiterService.sendCoords(mockRoomInfo, { x: 5, y: 4 }, false);
        expect(sendSpy).toHaveBeenCalled();
    });
    it('should return true when socket is connected', () => {
        spyOn(clientSocket, 'isSocketAlive').and.returnValue(true);
        limiterService.isConnected();
        expect(limiterService.isConnected()).toBe(true);
    });
    it('should return false when socket is disconnected', () => {
        spyOn(clientSocket, 'isSocketAlive').and.returnValue(false);
        limiterService.isConnected();
        expect(limiterService.isConnected()).toBe(false);
    });
    it('should get data with getRoomInfo ', () => {
        const roomInfoSpy = spyOn(limiterService.roomInformation, 'asObservable');
        limiterService.getRoomInfo();
        expect(roomInfoSpy).toHaveBeenCalled();
    });
    it('should  disconnect socket when quitGame is called ', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const disconnectSpy = spyOn(clientSocket, 'disconnect').and.callFake(() => {});
        limiterService.quitGame();
        expect(disconnectSpy).toHaveBeenCalled();
    });
    it('should  disconnect socket when disconnect is called ', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const disconnectSpy = spyOn(clientSocket, 'disconnect').and.callFake(() => {});
        limiterService.disconnect();
        expect(disconnectSpy).toHaveBeenCalled();
    });
    it('should  pass value false to closePopup ', () => {
        limiterService.resetClosePopUp();
        limiterService.closePopUp.asObservable().subscribe((close: boolean) => {
            expect(close).toEqual(false);
        });
    });

    it('should  execute error function when not clicked on a difference', (done) => {
        limiterService.losingSound = new Audio('assets/beep.wav');
        limiterService.currentRoom.currentDifference = [];
        const soundSpy = spyOn(limiterService.losingSound, 'play');
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const displayErrorSpy = spyOn(playAreaService, 'displayErrorOnCanvas').and.callFake((isMainCanvas: boolean) => {});
        limiterService.error(true);
        expect(displayErrorSpy).toHaveBeenCalled();
        setTimeout(() => {
            expect(soundSpy).toHaveBeenCalled();
            done();
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        }, 1000);
    });
    it('should handle noMoreGames server response', () => {
        socketHelper.peerSideEmit('noMoreGames', mockRoomInfo);
        limiterService.moreGames.asObservable().subscribe((moreGames: boolean) => {
            expect(moreGames).toEqual(true);
        });
        limiterService.roomInformation.asObservable().subscribe((room: ClassicRoom) => {
            expect(room).toEqual(mockRoomInfo);
        });
        expect(limiterService.currentRoom.endGameMessage).toBe('Félicitations! Vous êtes le gagnant de cette partie.');
    });
    it('should handle foundDifferences server response', () => {
        socketHelper.peerSideEmit('foundDifference', mockRoomInfo.differencesFound);
        limiterService.roomInformation.asObservable().subscribe((room: ClassicRoom) => {
            expect(room).toEqual(mockRoomInfo);
        });
        limiterService.currentDifference.asObservable().subscribe((difference: Point2d[]) => {
            expect(difference).toEqual(mockRoomInfo.currentDifference);
        });
    });
    it('should handle newGame server response', () => {
        socketHelper.peerSideEmit('newGame', mockRoomInfo);
        limiterService.roomInformation.asObservable().subscribe((room: ClassicRoom) => {
            expect(room).toEqual(mockRoomInfo);
        });
    });
    it('should handle countDownStarted server response', () => {
        socketHelper.peerSideEmit('countDownStarted', 0);
        expect(limiterService.currentRoom.endGameMessage).toBe('Le temps est fini. Vous avez perdu le jeu.');
        limiterService.roomInformation.asObservable().subscribe((room: ClassicRoom) => {
            expect(room).toEqual(mockRoomInfo);
        });
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const routerSpy = spyOn(router, 'navigate');
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        socketHelper.peerSideEmit('countDownStarted', 5);
        expect(routerSpy).not.toHaveBeenCalled();
    });
});
