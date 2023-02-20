import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom } from '@app/interfaces/rooms';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { LimitedTimeComponent } from '@app/pages/limited-time/limited-time.component';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { of, Subscription } from 'rxjs';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}

describe('LimitedTimeComponent', () => {
    let socketServiceSpy: ClientSocketService;
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketClientServiceMock;
    let roomManagerService: RoomManagerService;
    let mockRoomInfo: ClassicRoom[];
    let communicationService: CommunicationService;
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

    let component: LimitedTimeComponent;
    let fixture: ComponentFixture<LimitedTimeComponent>;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [LimitedTimeComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [HttpClientTestingModule, RouterModule.forRoot([{ path: 'game-page', component: GamePageComponent }])],
        }).compileComponents();

        fixture = TestBed.createComponent(LimitedTimeComponent);

        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LimitedTimeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        roomManagerService = TestBed.inject(RoomManagerService);
        roomManagerService = TestBed.inject(RoomManagerService);
        socketServiceSpy = TestBed.inject(ClientSocketService);
        communicationService = TestBed.inject(CommunicationService);

        mockRoomInfo = [
            {
                hostId: 'hostId',
                roomId: 'roomId',
                playerName: 'bleepbloop',
                hintPenalty: 5,
                game,
                gameMode: 'Classic - 1 vs 1',
                timer: 0,
                differencesFound: 5,
                endGameMessage: '',
                currentDifference: [],
            },
        ];

        socketServiceSpy = TestBed.inject(ClientSocketService);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(roomManagerService, 'handleSocket').and.callFake(() => {});
        spyOn(socketServiceSpy, 'isSocketAlive').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        spyOn(socketServiceSpy, 'send').and.callFake((event: string) => {});
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call room info subscribe method', fakeAsync(() => {
        const subscribeSpy = spyOn(roomManagerService.availableRoomsEvent, 'asObservable').and.returnValue(of(mockRoomInfo));
        component.ngOnInit();
        tick();
        expect(subscribeSpy).toHaveBeenCalled();
    }));

    it('should call  createdRoomSubscribe method', fakeAsync(() => {
        const subscribeSpy = spyOn(roomManagerService.isCreated, 'asObservable').and.returnValue(of(true));
        component.ngOnInit();
        tick();
        expect(subscribeSpy).toHaveBeenCalled();
    }));

    it('should call getAllGames subscribe method', fakeAsync(() => {
        spyOn(communicationService, 'getAllGames').and.returnValue(of([game]));
        const subscribeSpy = spyOn(roomManagerService.availableRoomsEvent, 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(subscribeSpy).toHaveBeenCalled();
        expect(component.games).toEqual([game]);
    }));

    it('should redirect host to waitingRoom', () => {
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const createMultiSpy = spyOn(roomManagerService, 'createLimitedMulti').and.callFake((host: string) => {});
        component.createMultiGame();
        expect(createMultiSpy).toHaveBeenCalled();
    });

    it(' should redirect host to waitingRoom', () => {
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const joinMultiSpy = spyOn(roomManagerService, 'redirectGuest').and.callFake((guest: string) => {});
        component.joinMultiGame();
        expect(joinMultiSpy).toHaveBeenCalled();
    });

    it(' should create a soloGame', () => {
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const soloGameSpy = spyOn(roomManagerService, 'createLimitedSolo').and.callFake((host: string) => {});
        component.createSoloGame();
        expect(soloGameSpy).toHaveBeenCalled();
    });

    it('should goBack to homePage', () => {
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const redirectionSpy = spyOn(roomManagerService, 'redirection').and.callFake((route: string) => {});
        component.goBack();
        expect(redirectionSpy).toHaveBeenCalled();
    });

    it('should return false when no room is found', () => {
        component['availableRooms'] = [];
        expect(component.isAvailableRoom()).toBe(false);
    });

    it('should return true when a room is found', () => {
        component['availableRooms'] = mockRoomInfo;
        expect(component.isAvailableRoom()).toBe(true);
    });

    it('should return true when a room is found', () => {
        component['availableRooms'] = mockRoomInfo;
        expect(component.isAvailableRoom()).toBe(true);
    });

    it('should unsubscribe from all observables', () => {
        component['roomSubscription'] = new Subscription();
        component['communicationSubscription'] = new Subscription();
        component['goBackSubscription'] = new Subscription();
        component['gameCreatedSubscription'] = new Subscription();
        const firstSpy = spyOn(component['roomSubscription'], 'unsubscribe');
        const secondSpy = spyOn(component['goBackSubscription'], 'unsubscribe');
        const thirdSpy = spyOn(component['communicationSubscription'], 'unsubscribe');
        const fourthSpy = spyOn(component['gameCreatedSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(firstSpy).toHaveBeenCalled();
        expect(secondSpy).toHaveBeenCalled();
        expect(thirdSpy).toHaveBeenCalled();
        expect(fourthSpy).toHaveBeenCalled();
    });
});
