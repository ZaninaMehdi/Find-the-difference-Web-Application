/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { Message } from '@app/interfaces/message';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { ChatService } from '@app/services/chat-service/chat.service';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { Observable, of } from 'rxjs';
import { Socket } from 'socket.io-client';

import { ChatInboxComponent } from './chat-inbox.component';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}

describe('ChatInboxComponent', () => {
    let limitedManager: LimitedTimeService;
    let component: ChatInboxComponent;
    let fixture: ComponentFixture<ChatInboxComponent>;
    let getRoomInfoSpy: jasmine.Spy<() => Observable<ClassicRoom>>;
    let chatService: ChatService;
    let classicManager: ClassicGameManagerService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    const gameSheet: ServerGameSheet = {
        originalLink: '',
        modifiedLink: '',
        differenceCounter: 3,
        differenceLocations: [],
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

    const mockGuestPlayer: GuestPlayer = {
        id: 'jj',
        guestName: 'ahmed',
    };

    const mockRoomInfo: ClassicRoom = {
        hostId: '1',
        roomId: '1',
        playerName: 'bleepbloop',
        hintPenalty: 5,
        game,
        gameMode: 'Classic - solo',
        timer: 0,
        differencesFound: 0,
        endGameMessage: '',
        currentDifference: [],
    };

    const mockMessage: Message = {
        message: 'hello',
        sender: 'guest',
        time: 1,
    };

    const mockMessageContent = 'Hello';

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            imports: [RouterModule.forRoot([{ path: 'game', component: GamePageComponent }])],
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
            declarations: [ChatInboxComponent, GamePageComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChatInboxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        chatService = TestBed.inject(ChatService);
        classicManager = TestBed.inject(ClassicGameManagerService);
        limitedManager = TestBed.inject(LimitedTimeService);
        classicManager.currentRoom = mockRoomInfo;

        component.roomInformation = {
            hostId: '9',
            roomId: '5',
            playerName: 'het',
            hintPenalty: 5,
            game,
            gameMode: 'Classic - 1v1',
            timer: 0,
            differencesFound: 0,
            endGameMessage: '',
            currentDifference: [],
            guestInfo: mockGuestPlayer,
        };
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call limitedTime subscribe method', () => {
        spyOn(limitedManager.isLimitedTimeGame, 'asObservable').and.returnValue(of(true));
        const subscribeSpy = spyOn(limitedManager.isLimitedTimeGame, 'subscribe').and.callThrough();
        component.ngOnInit();
        expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should get the room information and handle chat sockets for classicMode Game', () => {
        getRoomInfoSpy = spyOn(classicManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const chatSocketsSpy = spyOn(chatService, 'handleChatSockets').and.callFake(() => {});
        component.ngOnInit();
        expect(component['subscription']).toBeDefined();
        expect(getRoomInfoSpy).toHaveBeenCalled();
        expect(chatSocketsSpy).toHaveBeenCalled();
        expect(component.roomInformation).toEqual(mockRoomInfo);
    });

    it('should get the room information and handle chat sockets for limitedMode Game', () => {
        limitedManager.isLimitedTimeGame.next(true);
        component.isLimitedGame = true;
        spyOn(limitedManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const spy = spyOn(limitedManager, 'connect').and.callFake(() => {});
        component.ngOnInit();
        expect(component.roomInformation).toBe(mockRoomInfo);
        expect(spy).toHaveBeenCalled();
        expect(chatService.room).toBe(mockRoomInfo);
    });

    it('should unsubscribe from observable and reinitialize messages ', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(chatService, 'handleChatSockets').and.callFake(() => {});
        component.ngOnInit();
        expect(component['subscription']).toBeDefined();
        chatService.messages.push(mockMessage);
        const subscriptionSpy = spyOn(component['subscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(subscriptionSpy).toHaveBeenCalled();
        expect(chatService.messages).toEqual([]);
    });

    it('should call sendMessage of service when the send button is clicked ', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(chatService, 'handleChatSockets').and.callFake(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const sendServiceSpy = spyOn(chatService, 'sendMessage').and.callFake(() => {});
        component.message = mockMessageContent;
        component.sendMessage();
        expect(sendServiceSpy).toHaveBeenCalled();
        expect(component.messages[0].message).toEqual(mockMessageContent);
    });

    it('isEmpty should return true when message is empty', () => {
        expect(component.isEmpty()).toBeTrue();
    });

    it('isEmpty should return false when message isnt empty', () => {
        component.message = mockMessageContent;
        expect(component.isEmpty()).toBeFalse();
    });

    it('should call onKeyEvent when a key is entered in the chat', () => {
        let mockKeyBoardEvent: KeyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        const eventStopPropagationSpy = spyOn(mockKeyBoardEvent, 'stopPropagation').and.callFake(() => {});
        const sendMessageSpy = spyOn(component, 'sendMessage').and.callFake(() => {});

        component.onKeyEvent(mockKeyBoardEvent);

        expect(eventStopPropagationSpy).toHaveBeenCalled();
        mockKeyBoardEvent = new KeyboardEvent('keydown', { key: 'o' });
        component.onKeyEvent(mockKeyBoardEvent);

        expect(eventStopPropagationSpy).toHaveBeenCalled();
        expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    });
});
