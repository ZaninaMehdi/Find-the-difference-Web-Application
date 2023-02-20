/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { SelectionViewComponent } from '@app/pages/selection-view/selection-view.component';
import { WaitingRoomComponent } from '@app/pages/waiting-room/waiting-room.component';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { of, Subscription } from 'rxjs';

describe('WaitingRoomComponent', () => {
    let component: WaitingRoomComponent;
    let fixture: ComponentFixture<WaitingRoomComponent>;
    let roomManager: RoomManagerService;
    let mockRoomInfo: ClassicRoom;
    let limitedService: LimitedTimeService;

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
    const mockGuest: GuestPlayer = {
        id: 'guestId',
        guestName: 'guestName',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterModule.forRoot([
                    { path: 'selection', component: SelectionViewComponent },
                    { path: 'home', component: MainPageComponent },
                ]),
            ],
            declarations: [WaitingRoomComponent, SelectionViewComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingRoomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        roomManager = TestBed.inject(RoomManagerService);
        limitedService = TestBed.inject(LimitedTimeService);

        mockRoomInfo = {
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
        };
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call room info subscribe method', () => {
        spyOn(roomManager, 'isConnected').and.returnValue(true);
        spyOn(roomManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        const subscribeSpy = spyOn(roomManager.getRoomInfo(), 'subscribe').and.callThrough();
        component.ngOnInit();

        expect(subscribeSpy).toHaveBeenCalled();
        expect(component['createdRoom']).toEqual(mockRoomInfo);
    });

    it('should call limitedTime subscribe method', () => {
        spyOn(roomManager, 'isConnected').and.returnValue(true);
        spyOn(limitedService, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        spyOn(limitedService.isLimitedTimeGame, 'asObservable').and.returnValue(of(true));
        const subscribeSpy = spyOn(limitedService.getRoomInfo(), 'subscribe').and.callThrough();
        component.ngOnInit();
        expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should call guestNames subscribe method', () => {
        component.guestPlayers = [];
        spyOn(roomManager, 'isConnected').and.returnValue(true);
        spyOn(roomManager.guestNames, 'asObservable').and.returnValue(of([mockGuest]));
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        const subscribeSpy = spyOn(roomManager.guestNames.asObservable(), 'subscribe').and.callThrough();
        component.ngOnInit();

        expect(subscribeSpy).toHaveBeenCalled();
        expect(component.guestPlayers).toEqual([mockGuest]);
    });

    it('should call isGameDeleted subscribe method', () => {
        spyOn(roomManager, 'isConnected').and.returnValue(true);
        spyOn(roomManager.isGameDeleted, 'asObservable').and.returnValue(of(true));
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        const subscribeSpy = spyOn(roomManager.isGameDeleted.asObservable(), 'subscribe').and.callThrough();
        component.ngOnInit();

        expect(subscribeSpy).toHaveBeenCalled();
        expect(component.isGameDeleted).toEqual(true);
    });

    it('should redirect to selection view if the socket disconnects', () => {
        spyOn(roomManager, 'isConnected').and.returnValue(false);
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const redirectSpy = spyOn(roomManager, 'redirection').and.callFake((route: string) => {});
        component.ngOnInit();
        expect(redirectSpy).toHaveBeenCalled();
    });

    it('should add guest when accepted', () => {
        const connectSpy = spyOn(roomManager, 'connect');
        component['createdRoom'] = mockRoomInfo;
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const joinGuestSpy = spyOn(roomManager, 'joinGuest').and.callFake((guest: GuestPlayer, room: ClassicRoom) => {});

        component.acceptGuestPlayer(mockGuest);
        expect(connectSpy).toHaveBeenCalled();
        expect(joinGuestSpy).toHaveBeenCalledWith(mockGuest, component['createdRoom']);
    });

    it('should refuse a guest the host chooses', () => {
        const connectSpy = spyOn(roomManager, 'connect');
        component['createdRoom'] = mockRoomInfo;
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const refuseGuestSpy = spyOn(roomManager, 'refuseGuest').and.callFake((guest: GuestPlayer, room: ClassicRoom) => {});

        component.refuseGuestPlayer(mockGuest);
        expect(connectSpy).toHaveBeenCalled();
        expect(refuseGuestSpy).toHaveBeenCalledWith(mockGuest, component['createdRoom']);
    });
    it('should goBack to home', () => {
        component['createdRoom'] = mockRoomInfo;
        component.isLimitedGame = true;
        // eslint-disable-next-line no-unused-vars
        const deleteSpy = spyOn(roomManager, 'deleteLimitedRoom').and.callFake((room: ClassicRoom) => {});
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const redirectionSpy = spyOn(roomManager, 'redirection').and.callFake((route: string) => {});
        component.goBack();
        expect(deleteSpy).toHaveBeenCalled();
        expect(redirectionSpy).toHaveBeenCalledWith('/home');
    });

    it('should return to selection view', () => {
        component['createdRoom'] = mockRoomInfo;
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const removeGuestSpy = spyOn(roomManager, 'removeGuests').and.callFake((room: ClassicRoom) => {});
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const deleteRoomSpy = spyOn(roomManager, 'deleteRoom').and.callFake((room: ClassicRoom) => {});
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const redirectionSpy = spyOn(roomManager, 'redirection').and.callFake((route: string) => {});
        component.goBack();

        expect(removeGuestSpy).toHaveBeenCalledWith(component['createdRoom']);
        expect(deleteRoomSpy).toHaveBeenCalledWith(component['createdRoom']);
        expect(redirectionSpy).toHaveBeenCalledWith('/selection');
    });

    it('should unsubscribe from observables', fakeAsync(() => {
        component['deleteSubscription'] = new Subscription();
        component['guestNamesSubscription'] = new Subscription();
        component['roomInfoSubscription'] = new Subscription();
        component['limitedRoomSubscription'] = new Subscription();
        component['limitedSubscription'] = new Subscription();

        const firstSpy = spyOn(component['deleteSubscription'], 'unsubscribe');
        const secondSpy = spyOn(component['guestNamesSubscription'], 'unsubscribe');
        const thirdSpy = spyOn(component['roomInfoSubscription'], 'unsubscribe');
        const fourthSpy = spyOn(component['limitedRoomSubscription'], 'unsubscribe');
        const fifthSpy = spyOn(component['limitedSubscription'], 'unsubscribe');

        component.ngOnDestroy();
        expect(firstSpy).toHaveBeenCalled();
        expect(secondSpy).toHaveBeenCalled();
        expect(thirdSpy).toHaveBeenCalled();
        expect(fourthSpy).toHaveBeenCalled();
        expect(fifthSpy).toHaveBeenCalled();
    }));
});
