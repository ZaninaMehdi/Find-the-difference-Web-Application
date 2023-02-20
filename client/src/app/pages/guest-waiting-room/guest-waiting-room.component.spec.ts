import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { SelectionViewComponent } from '@app/pages/selection-view/selection-view.component';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { GamesListService } from '@app/services/games-list-service/games-list.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { Observable, of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GuestWaitingRoomComponent } from './guest-waiting-room.component';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}

describe('GuestWaitingRoomComponent', () => {
    let component: GuestWaitingRoomComponent;
    let fixture: ComponentFixture<GuestWaitingRoomComponent>;
    let roomManagerService: RoomManagerService;
    let gamesListService: GamesListService;
    let currentGuestRoomSpy: jasmine.Spy<() => Observable<ClassicRoom>>;
    let refusedGuestSpy: jasmine.Spy<() => Observable<GuestPlayer>>;
    let acceptedGuestSpy: jasmine.Spy<() => Observable<GuestPlayer>>;
    let goBackSpy: jasmine.Spy<() => Observable<boolean>>;
    let socketServiceSpy: ClientSocketService;
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
    const mockRoomInfo = {
        hostId: 'blab',
        roomId: '1',
        playerName: 'bleepbloop',
        hintPenalty: 5,
        game,
        gameMode: 'Classic - 1 vs 1',
        timer: 0,
        differencesFound: 5,
        messages: [],
        endGameMessage: '',
        currentDifference: [],
    };

    const mockGuestPlayers: GuestPlayer[] = [
        {
            id: 'jj',
            guestName: 'ahmed',
            differencesFound: 5,
        },
    ];

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterModule.forRoot([{ path: 'selection', component: SelectionViewComponent }])],
            declarations: [GuestWaitingRoomComponent, SelectionViewComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GuestWaitingRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        roomManagerService = TestBed.inject(RoomManagerService);
        gamesListService = TestBed.inject(GamesListService);
        socketServiceSpy = TestBed.inject(ClientSocketService);
        gamesListService = TestBed.inject(GamesListService);
        gamesListService.guest = mockGuestPlayers[0];
        currentGuestRoomSpy = spyOn(roomManagerService.currentGuestRoom, 'asObservable').and.returnValue(of(mockRoomInfo));
        acceptedGuestSpy = spyOn(roomManagerService.acceptedGuest, 'asObservable').and.returnValue(of(mockGuestPlayers[0]));
        refusedGuestSpy = spyOn(roomManagerService.refusedGuest, 'asObservable').and.returnValue(of(mockGuestPlayers[0]));
        goBackSpy = spyOn(roomManagerService.goBack, 'asObservable').and.returnValue(of(true));

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(roomManagerService, 'handleSocket').and.callFake(() => {});
        spyOn(socketServiceSpy, 'isSocketAlive').and.returnValue(true);
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        spyOn(socketServiceSpy, 'send').and.callFake((event: string) => {});
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call acceptedGuest subscribe method', fakeAsync(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const spy = spyOn(roomManagerService.acceptedGuest.asObservable(), 'subscribe');
        component.ngOnInit();
        tick();
        expect(acceptedGuestSpy).toHaveBeenCalledBefore(spy);
        expect(spy).toHaveBeenCalled();
    }));

    it('Should call refusedGuest subscribe method', fakeAsync(() => {
        const spy = spyOn(roomManagerService.refusedGuest.asObservable(), 'subscribe');
        component.ngOnInit();
        tick();
        expect(refusedGuestSpy).toHaveBeenCalledBefore(spy);
        expect(spy).toHaveBeenCalled();
    }));

    it('Should call currentGuestRoom subscribe method', fakeAsync(() => {
        const spy = spyOn(roomManagerService.currentGuestRoom.asObservable(), 'subscribe');
        component.ngOnInit();
        tick();
        expect(currentGuestRoomSpy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    }));

    it('should add guest to room if accepted', fakeAsync(() => {
        gamesListService.guest = mockGuestPlayers[0];
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const guestJoinSpy = spyOn(roomManagerService, 'guestJoinRoom').and.callFake(() => {});
        const subscribeSpy = spyOn(roomManagerService.acceptedGuest.asObservable(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(subscribeSpy).toHaveBeenCalled();
        expect(guestJoinSpy).toHaveBeenCalled();
    }));
    it('Should inform the guest that game is deleted', fakeAsync(() => {
        spyOn(roomManagerService.isGameDeleted, 'asObservable').and.returnValue(of(true));
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        const subscribeSpy = spyOn(roomManagerService.isGameDeleted.asObservable(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();

        expect(subscribeSpy).toHaveBeenCalled();
        expect(component.isGameDeleted).toEqual(true);
    }));

    it('Should remove guest name', fakeAsync(() => {
        spyOn(roomManagerService.isSocketRemoved, 'asObservable').and.returnValue(of(true));
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        const subscribeSpy = spyOn(roomManagerService.isSocketRemoved.asObservable(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(subscribeSpy).toHaveBeenCalled();
        expect(component.guestName).toEqual('removedSocket');
    }));

    it('Should call goBack subscribe method', fakeAsync(() => {
        const spy = spyOn(roomManagerService.goBack.asObservable(), 'subscribe');
        component.ngOnInit();
        tick();
        expect(goBackSpy).toHaveBeenCalledBefore(spy);
        expect(spy).toHaveBeenCalled();
    }));

    it('should change guestName if guestIds are not the same', fakeAsync(() => {
        const mockGuestPlayer1: GuestPlayer = {
            id: 'jjlk',
            guestName: 'ahmed',
            differencesFound: 5,
        };

        gamesListService.guest = mockGuestPlayer1;
        component.ngOnInit();
        tick();
        expect(component.guestName).toBe('ahmed');
    }));

    it('should unsubscribe from observables', fakeAsync(() => {
        spyOn(roomManagerService, 'isConnected').and.returnValue(true);
        component.ngOnInit();
        tick();

        const firstSpy = spyOn(component['goBackSubscription'], 'unsubscribe');
        const secondSpy = spyOn(component['refusedGuestSubscription'], 'unsubscribe');
        const thirdSpy = spyOn(component['acceptedGuestSubscription'], 'unsubscribe');
        const fourthSpy = spyOn(component['guestRoomSubscription'], 'unsubscribe');
        const fifthSpy = spyOn(component['deleteSubscription'], 'unsubscribe');
        const sixthSpy = spyOn(component['socketSubscription'], 'unsubscribe');

        component.ngOnDestroy();
        expect(firstSpy).toHaveBeenCalled();
        expect(secondSpy).toHaveBeenCalled();
        expect(thirdSpy).toHaveBeenCalled();
        expect(fourthSpy).toHaveBeenCalled();
        expect(fifthSpy).toHaveBeenCalled();
        expect(sixthSpy).toHaveBeenCalled();
    }));

    it('should refuse guest and goBack to selection view', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const spyOnConnect = spyOn(roomManagerService, 'connect').and.callFake(() => {});
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const spyOnRefusedGuest = spyOn(roomManagerService, 'refuseGuest').and.callFake((guest: GuestPlayer, room: ClassicRoom) => {});
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const redirectionSpy = spyOn(roomManagerService, 'redirection').and.callFake((route: string) => {});
        component.goBack();

        expect(spyOnConnect).toHaveBeenCalled();
        expect(spyOnRefusedGuest).toHaveBeenCalled();
        expect(redirectionSpy).toHaveBeenCalledWith('/selection');
    });
});
