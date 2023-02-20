/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BestTimes, GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { GuestWaitingRoomComponent } from '@app/pages/guest-waiting-room/guest-waiting-room.component';
import { WaitingRoomComponent } from '@app/pages/waiting-room/waiting-room.component';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { DataSharingService } from '@app/services/data-sharing-service/data-sharing.service';
import { GamesListService } from '@app/services/games-list-service/games-list.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { Confirmation, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { GameSheetComponent } from './game-sheet.component';

describe('GameSheetComponent', () => {
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

    const mockAvailableRooms: ClassicRoom[] = [
        {
            hostId: 'lfll',
            roomId: '1',
            playerName: 'bleepbloop',
            hintPenalty: 5,
            game,
            gameMode: 'Classic 1v1',
            timer: 0,
            differencesFound: 5,
            endGameMessage: '',
            currentDifference: [],
        },
    ];
    let component: GameSheetComponent;
    let fixture: ComponentFixture<GameSheetComponent>;
    let gamesListService: GamesListService;
    let roomManagerService: RoomManagerService;
    let router: Router;
    let confirmationService: ConfirmationService;
    let dataSharingService: DataSharingService;
    let communicationService: CommunicationService;

    const mockSortedTimes: BestTimes[] = [{ name: 'jack', time: 345 }];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                RouterModule.forRoot([
                    { path: 'waiting-room', component: WaitingRoomComponent },
                    { path: 'guest-waiting-room', component: GuestWaitingRoomComponent },
                ]),
                MatDialogModule,
            ],
            declarations: [GameSheetComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [{ provide: MatDialog }, { provide: MAT_DIALOG_DATA, useValue: {} }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameSheetComponent);
        gamesListService = TestBed.inject(GamesListService);
        roomManagerService = TestBed.inject(RoomManagerService);
        router = TestBed.inject(Router);
        dataSharingService = TestBed.inject(DataSharingService);
        communicationService = TestBed.inject(CommunicationService);

        component = fixture.componentInstance;
        fixture.detectChanges();

        component.game = {
            name: '1er jeu',
            soloBestTimes: [{ name: 'name2', time: 300 }],
            multiplayerBestTimes: [{ name: 'ntqtSoloQ', time: 140 }],
            link: 'assets/bmp_640.bmp',
        };

        spyOn(roomManagerService, 'connect').and.callFake(() => {});
        spyOn(roomManagerService, 'handleSocket').and.callFake(() => {});
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('Unit test for available rooms subscribe method', fakeAsync(() => {
        spyOn(roomManagerService.availableRoomsEvent, 'asObservable').and.returnValue(of(mockAvailableRooms));
        const spy = spyOn(roomManagerService.availableRoomsEvent.asObservable(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(spy).toHaveBeenCalled();
        expect(component['availableRooms']).toEqual(mockAvailableRooms);
    }));

    it('should initialize the components attributes', () => {
        const gameListSpy = spyOn(gamesListService, 'sortTimes').and.callFake(() => {
            return mockSortedTimes;
        });
        component.ngOnInit();
        expect(gameListSpy).toHaveBeenCalledTimes(2);
        expect(component.sortedSoloGame).toEqual(mockSortedTimes);
        expect(component.sortedMultiplayerGame).toEqual(mockSortedTimes);
    });

    it('should open MatDialog pop up and redirect to game', () => {
        const gameListSpy = spyOn(gamesListService, 'redirectToGame').and.callFake((gameName: string, playerName: string) => {});
        const popUpSpy = spyOn(component['playerNameDialog'], 'open').and.returnValue({
            afterClosed: () => of('name'),
        } as MatDialogRef<typeof component>);

        component.play();
        expect(popUpSpy).toHaveBeenCalled();
        expect(gameListSpy).toHaveBeenCalledWith(component.game.name, 'name');
    });

    it('should open MatDialog pop up and redirect host to waitingRoom ', () => {
        const gameListSpy = spyOn(gamesListService, 'createMultiplayerRoom').and.callFake((host: string, gameMode: string, gameName: string) => {});
        const popUpSpy = spyOn(component['playerNameDialog'], 'open').and.returnValue({
            afterClosed: () => of('name'),
        } as MatDialogRef<typeof component>);

        component.createMultiplayerGame();
        expect(popUpSpy).toHaveBeenCalled();
        expect(gameListSpy).toHaveBeenCalledWith('name', mockAvailableRooms[0].gameMode, component.game.name);
    });

    it('isAvailableRoom() should return true when room is available ', () => {
        component['availableRooms'] = mockAvailableRooms;
        component.game.name = mockAvailableRooms[0].game.gameSheet.name;
        expect(component.isAvailableRoom()).toBeTrue();
    });

    it('isAvailableRoom() should return false when room name is not available or when length =0 ', () => {
        component.game.name = 'jeu 2';
        expect(component.isAvailableRoom()).toBeFalse();
        component['availableRooms'] = mockAvailableRooms;
        expect(component.isAvailableRoom()).toBeFalse();
    });

    it('should open MatDialog pop up and redirect guest to waitingRoom ', () => {
        gamesListService.guest = {
            id: 'jj',
            guestName: 'ahmed',
            differencesFound: 5,
        };
        const routerSpy = spyOn(router, 'navigate');
        const roomManagerSpy = spyOn(roomManagerService, 'createGuest').and.callFake((guest: GuestPlayer) => {});
        const popUpSpy = spyOn(component['playerNameDialog'], 'open').and.returnValue({
            afterClosed: () => of('name'),
        } as MatDialogRef<typeof component>);

        component.joinMultiplayerGame();
        expect(popUpSpy).toHaveBeenCalled();
        expect(roomManagerSpy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith(['/guest-waiting-room']);
    });

    it('should unsubcribe from all observables', fakeAsync(() => {
        component.ngOnInit();
        tick();

        const firstSpy = spyOn(component['availableRoomsSubscription'], 'unsubscribe');

        component.ngOnDestroy();
        expect(firstSpy).toHaveBeenCalled();
    }));

    it('should call confirm with accept button click', () => {
        const event: PointerEvent = new PointerEvent('any');
        spyOn(roomManagerService, 'sendOnDelete').and.callFake(() => {});
        spyOn(dataSharingService, 'notifyOther').and.callFake(() => {});
        spyOn(communicationService, 'deleteGame').and.returnValue(of(void 0));
        spyOn(communicationService, 'getGameNames').and.returnValue(of(['random']));

        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        const accept = spyOn(confirmationService, 'confirm').and.callFake((confirmation: Confirmation) => {
            if (confirmation.accept) {
                return confirmation.accept();
            }
        });

        component.confirmDeleteGame(event);
        expect(accept).toHaveBeenCalled();
    });

    it('should delete bestTimes when button clicked', () => {
        const deleteSpy = spyOn(communicationService, 'deleteBestTimes').and.returnValue(of(void 0));
        component.deleteBestTimes();
        expect(deleteSpy).toHaveBeenCalled();
    });

    it('should disable reset button', () => {
        spyOn(gamesListService, 'compareTwoBestTimes').and.returnValue(true);
        expect(component.shouldActivateResetButton()).toEqual(true);
    });

    it('should not disable reset button', () => {
        spyOn(gamesListService, 'compareTwoBestTimes').and.returnValue(false);
        expect(component.shouldActivateResetButton()).toEqual(false);
    });
});
