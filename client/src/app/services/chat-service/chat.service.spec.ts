import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { ChatService } from '@app/services/chat-service/chat.service';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}
describe('ChatService', () => {
    let service: ChatService;
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketClientServiceMock;

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
        hostId: '1',
        roomId: '2',
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

    const mockRoomInfo2: ClassicRoom = {
        hostId: '1',
        roomId: '1',
        playerName: 'bleepbloop',
        hintPenalty: 5,
        game,
        gameMode: 'Classic - solo',
        timer: 0,
        differencesFound: 5,
        endGameMessage: '',
        currentDifference: [],
        guestInfo: mockGuest,
    };

    const mockMessage = 'Hello';
    const mockUser = 'joe';

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterModule.forRoot([{ path: 'game', component: GamePageComponent }])],
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
            declarations: [GamePageComponent],
        });
        service = TestBed.inject(ChatService);
        service.handleChatSockets();
        service.room = mockRoomInfo;
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        spyOn<any>(service, 'addMessageToList').and.callThrough();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send a message', () => {
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function, @typescript-eslint/no-shadow
        const sendSpy = spyOn(socketServiceMock, 'send').and.callFake((value: string) => {});
        service.sendMessage(mockRoomInfo, mockMessage);
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should handle messageSent server response', () => {
        socketHelper.peerSideEmit('messageSent', mockMessage);
        expect(service['addMessageToList']).toHaveBeenCalled();
        expect(service.messages).toEqual([{ message: mockMessage, sender: 'guest', time: service.messages[0].time }]);
    });

    it('should handle differenceFound server response for solo games', () => {
        socketHelper.peerSideEmit('differenceFound', mockUser);
        expect(service['addMessageToList']).toHaveBeenCalled();
        expect(service.messages).toEqual([{ message: 'Différence trouvée', sender: 'server', time: service.messages[0].time }]);
    });

    it('should handle differenceError server response for solo games', () => {
        socketHelper.peerSideEmit('differenceError', mockUser);
        expect(service['addMessageToList']).toHaveBeenCalled();
        expect(service.messages).toEqual([{ message: 'Erreur', sender: 'server', time: service.messages[0].time }]);
    });

    it('should handle differenceError server response for 1v1 games', () => {
        service.room = mockRoomInfo2;
        socketHelper.peerSideEmit('differenceError', mockUser);
        expect(service['addMessageToList']).toHaveBeenCalled();
        expect(service.messages).toEqual([{ message: `Erreur par ${mockUser}`, sender: 'server', time: service.messages[0].time }]);
    });

    it('should handle differenceFound server response for 1v1 games', () => {
        service.room = mockRoomInfo2;
        socketHelper.peerSideEmit('differenceFound', mockUser);
        expect(service['addMessageToList']).toHaveBeenCalled();
        expect(service.messages).toEqual([{ message: `Différence trouvée par ${mockUser}`, sender: 'server', time: service.messages[0].time }]);
    });

    it('should handle playerLeft server response for 1v1 games', () => {
        service.room = mockRoomInfo2;
        socketHelper.peerSideEmit('playerLeft', mockUser);
        expect(service['addMessageToList']).toHaveBeenCalled();
        expect(service.messages).toEqual([{ message: `${mockUser} a abandonné la partie `, sender: 'server', time: service.messages[0].time }]);
    });

    it('should handle newBestTime server response classic mode', () => {
        const position = 2;
        service.room = mockRoomInfo2;
        socketHelper.peerSideEmit('newBestTime', {
            winnerName: mockUser,
            index: position,
            gameMode: mockRoomInfo.gameMode,
            gameName: mockRoomInfo.game.gameTimes.name,
            roomId: mockRoomInfo.roomId,
        });
        expect(service['addMessageToList']).toHaveBeenCalled();
        expect(service.messages).toEqual([
            {
                message: `${mockUser} obtient la position ${position} dans les meilleurs temps du jeu ${mockRoomInfo.game.gameTimes.name}
                en ${mockRoomInfo.gameMode}`,
                sender: 'server',
                time: service.messages[0].time,
            },
        ]);
    });

    it('should not add the message if the room id is the same as the one received from server', () => {
        const position = 2;
        service.room = mockRoomInfo;
        socketHelper.peerSideEmit('newBestTime', {
            winnerName: mockUser,
            index: position,
            gameMode: mockRoomInfo.gameMode,
            gameName: mockRoomInfo.game.gameTimes.name,
            roomId: mockRoomInfo.roomId,
        });
        expect(service['addMessageToList']).not.toHaveBeenCalled();
        expect(service.messages).toEqual([]);
    });

    it('should handle askHint server ', () => {
        service.room.guestInfo = undefined as unknown as GuestPlayer;
        socketHelper.peerSideEmit('askHint', mockUser);
        expect(service['addMessageToList']).toHaveBeenCalled();
    });

    it('should add message to list', () => {
        service['addMessageToList'](mockMessage, mockMessage, 'server');
        expect(service['addMessageToList']).toHaveBeenCalled();
    });

    it('should return false if message isnt sent twice', () => {
        const position = 2;
        expect(service['messageIsSentTwice'](mockUser, position, mockRoomInfo.gameMode, mockRoomInfo.game.gameTimes.name)).toEqual(false);
    });

    it('should return true if message is sent twice', () => {
        const position = 2;
        service.messages.push({
            // eslint-disable-next-line max-len
            message: `${mockUser} obtient la position ${position} dans les meilleurs temps du jeu ${mockRoomInfo.game.gameTimes.name} en ${mockRoomInfo.gameMode}`,
            sender: 'server',
            time: 1,
        });
        expect(service['messageIsSentTwice'](mockUser, position, mockRoomInfo.gameMode, mockRoomInfo.game.gameTimes.name)).toEqual(true);
    });
});
