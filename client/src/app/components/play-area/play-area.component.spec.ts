/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { MAX_HEIGHT, MAX_WIDTH, WAIT_TIME } from '@app/constants';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { SelectionViewComponent } from '@app/pages/selection-view/selection-view.component';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { PlayAreaService } from '@app/services/play-area-service/play-area.service';
import { Confirmation, ConfirmationService } from 'primeng/api';
import { Observable, of, Subscription } from 'rxjs';

import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let confirmationService: ConfirmationService;

    let fixture: ComponentFixture<PlayAreaComponent>;
    let classicManager: ClassicGameManagerService;
    let limitedManager: LimitedTimeService;
    let getRoomInfoSpy: jasmine.Spy<() => Observable<ClassicRoom>>;
    let playAreaService: PlayAreaService;
    let mouseEvent: MouseEvent;
    let socketHelper: SocketTestHelper;
    let socketServiceMock: SocketClientServiceMock;

    const gameSheet: ServerGameSheet = {
        originalLink: 'assets/bmp_640.bmp',
        modifiedLink: 'assets/bmp_640.bmp',
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
        gameMode: 'Classic - solo',
        timer: 0,
        differencesFound: 5,
        messages: [],
        endGameMessage: '',
        currentDifference: [{ x: 0, y: 0 }],
    };
    const mockGuestPlayer: GuestPlayer = {
        id: 'jj',
        guestName: 'ahmed',
        differencesFound: 5,
    };
    const mockCurrentDifference = [{ x: 3, y: 7 }];
    const expectedPosition: Point2d = { x: 100, y: 200 };

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                RouterTestingModule,
                RouterModule.forRoot([
                    { path: 'selection', component: SelectionViewComponent },
                    { path: 'home', component: MainPageComponent },
                ]),
            ],
            declarations: [PlayAreaComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        limitedManager = TestBed.inject(LimitedTimeService);
        classicManager = TestBed.inject(ClassicGameManagerService);
        playAreaService = TestBed.inject(PlayAreaService);
        getRoomInfoSpy = spyOn(classicManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        classicManager.currentRoom = mockRoomInfo;

        mouseEvent = {
            offsetX: expectedPosition.x,
            offsetY: expectedPosition.y,
            button: 0,
        } as MouseEvent;

        component.roomInformation = {
            hostId: 'blab',
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
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return the canvas width and height', () => {
        expect(component.width).toEqual(MAX_WIDTH);
        expect(component.height).toEqual(MAX_HEIGHT);
    });

    it('should call limitedTime subscribe method', () => {
        spyOn(limitedManager, 'isConnected').and.returnValue(true);
        spyOn(limitedManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        spyOn(limitedManager.isLimitedTimeGame, 'asObservable').and.returnValue(of(true));
        const subscribeSpy = spyOn(limitedManager.isMainCanvas, 'subscribe').and.callThrough();
        component.ngAfterViewInit();
        expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should call limited difference subscribe method', () => {
        spyOn(limitedManager, 'isConnected').and.returnValue(true);
        spyOn(limitedManager.isLimitedTimeGame, 'asObservable').and.returnValue(of(true));
        spyOn(limitedManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        spyOn(limitedManager.currentDifference, 'asObservable').and.returnValue(of([{ x: 5, y: 3 }]));
        const errorSpy = spyOn(limitedManager, 'error').and.callFake((isMainCanvas: boolean) => {});
        component.ngAfterViewInit();

        expect(errorSpy).toHaveBeenCalled();
    });

    it('should call getLimitedRoomInfo subscribe method', () => {
        spyOn(limitedManager, 'isConnected').and.returnValue(true);
        spyOn(limitedManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        spyOn(limitedManager.isLimitedTimeGame, 'asObservable').and.returnValue(of(true));
        const setDataSpy = spyOn(component, 'setData').and.callFake((room: ClassicRoom) => {});
        const subscribeSpy = spyOn(limitedManager.getRoomInfo(), 'subscribe').and.callThrough();
        component.ngAfterViewInit();
        expect(subscribeSpy).toHaveBeenCalled();
        expect(setDataSpy).toHaveBeenCalledWith(mockRoomInfo);
    });

    it('should initialize the attributes in mouse Service, and call handleSocket and setCanvas', () => {
        const classicManagerSpy = spyOn(classicManager, 'handleSocket').and.callFake(() => {});
        const playAreaSpy = spyOn(component, 'setCanvases').and.callFake(() => {});
        component.ngAfterViewInit();

        expect(getRoomInfoSpy).toHaveBeenCalled();
        expect(classicManagerSpy).toHaveBeenCalledBefore(playAreaSpy);
        expect(component.roomInformation).toEqual(mockRoomInfo);
        expect(playAreaService.room).toEqual(mockRoomInfo);
        expect(playAreaSpy).toHaveBeenCalled();
        expect(playAreaService.originalContext).toBeDefined();
        expect(playAreaService.modifiedContext).toBeDefined();
        expect(playAreaService.originalContextForeground).toBeDefined();
        expect(playAreaService.modifiedContextForeground).toBeDefined();
    });

    it('should set currentRoom attribute and call removeDifference function', () => {
        const mouseSpy = spyOn(playAreaService, 'setImageData').and.callFake(() => {});
        const currentDifferenceSpy = spyOn(classicManager.currentDifference, 'asObservable').and.returnValue(of(mockCurrentDifference));
        const spy = spyOn(classicManager, 'removeDifference').and.callFake(() => []);
        spyOn(classicManager, 'connect').and.callFake(() => {});
        spyOn(classicManager, 'handleSocket').and.callFake(() => {});

        component.ngAfterViewInit();
        expect(spy).toHaveBeenCalled();
        expect(mouseSpy).toHaveBeenCalled();
        expect(classicManager.currentRoom.currentDifference).toEqual(mockCurrentDifference);
        expect(currentDifferenceSpy).toHaveBeenCalledBefore(mouseSpy);
    });

    it('should call quit game and navigate to selection page for solo Game', () => {
        const spy = spyOn(classicManager, 'quitGame').and.callFake(() => {});
        const routerSpy = spyOn(classicManager, 'redirection').and.callFake((route: string) => {});
        component.quit();
        expect(spy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith('/selection');
    });

    it('should unsubscribe from observables', () => {
        spyOn(playAreaService, 'setImageData').and.callFake(() => {});
        spyOn(classicManager, 'handleSocket').and.callFake(() => {});

        component.ngAfterViewInit();
        expect(component['subscription']).toBeDefined();
        expect(component['differenceSubscription']).toBeDefined();
        expect(component['limitedSubscription']).toBeDefined();

        const firstSpy = spyOn(component['differenceSubscription'], 'unsubscribe');
        const secondSpy = spyOn(component['subscription'], 'unsubscribe');
        const thirdSpy = spyOn(component['limitedSubscription'], 'unsubscribe');

        component.ngOnDestroy();
        expect(firstSpy).toHaveBeenCalled();
        expect(secondSpy).toHaveBeenCalled();
        expect(thirdSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from observables on limitedGame', () => {
        component['secondLimitedSubscription'] = new Subscription();

        const spy = spyOn(component['secondLimitedSubscription'], 'unsubscribe');

        component.ngOnDestroy();
        expect(spy).toHaveBeenCalled();
    });

    it('should set isMainCanvas to true and call the services ', () => {
        const classicManagerSpy = spyOn(classicManager, 'sendCoords').and.callFake((room: ClassicRoom, coords: Point2d) => {});
        const limitedTimeManagerSpy = spyOn(limitedManager, 'sendCoords').and.callFake((room: ClassicRoom, coords: Point2d) => {});

        component.roomInformation = mockRoomInfo;
        playAreaService.mousePosition = expectedPosition;
        const mouseServiceSpy = spyOn(playAreaService, 'mouseHitDetect').and.callFake(() => {
            return true;
        });

        component.mouseHitDetectOriginalImage(mouseEvent);
        expect(mouseServiceSpy).toHaveBeenCalledWith(mouseEvent);
        expect(classicManagerSpy).toHaveBeenCalledWith(component.roomInformation, playAreaService.mousePosition);

        component.isLimitedGame = true;
        component.mouseHitDetectOriginalImage(mouseEvent);
        expect(mouseServiceSpy).toHaveBeenCalledWith(mouseEvent);
        expect(limitedTimeManagerSpy).toHaveBeenCalled();
    });

    it('should set isMainCanvas to true and call the services ', () => {
        const classicManagerSpy = spyOn(classicManager, 'sendCoords').and.callFake((room: ClassicRoom, coords: Point2d) => {});
        const limitedTimeManagerSpy = spyOn(limitedManager, 'sendCoords').and.callFake((room: ClassicRoom, coords: Point2d) => {});
        component.roomInformation = mockRoomInfo;
        playAreaService.mousePosition = expectedPosition;
        const playAreaSpy = spyOn(playAreaService, 'mouseHitDetect').and.callFake(() => {
            return true;
        });

        component.mouseHitDetectModifiedImage(mouseEvent);
        expect(playAreaSpy).toHaveBeenCalledWith(mouseEvent);
        expect(classicManagerSpy).toHaveBeenCalledWith(component.roomInformation, playAreaService.mousePosition);

        component.isLimitedGame = true;
        component.mouseHitDetectModifiedImage(mouseEvent);
        expect(playAreaSpy).toHaveBeenCalledWith(mouseEvent);
        expect(limitedTimeManagerSpy).toHaveBeenCalled();
    });

    it('should not call sendCoords', () => {
        playAreaService.mousePosition = expectedPosition;
        const classicManagerSpy = spyOn(classicManager, 'sendCoords').and.callFake((room: ClassicRoom, coords: Point2d) => {});
        spyOn(playAreaService, 'mouseHitDetect').and.callFake(() => {
            return false;
        });

        component.mouseHitDetectModifiedImage(mouseEvent);
        expect(classicManagerSpy).not.toHaveBeenCalled();
        component.mouseHitDetectOriginalImage(mouseEvent);
        expect(classicManagerSpy).not.toHaveBeenCalled();
    });

    it('should put images on canvases', () => {
        const spy = spyOn(playAreaService, 'onLoad').and.callFake(() => {});
        component.setCanvases();
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should call abandon game for multiplayer Game', () => {
        const spy = spyOn(classicManager, 'quitGame').and.callFake(() => {});
        component.roomInformation.guestInfo = mockGuestPlayer;
        component.quit();
        expect(spy).toHaveBeenCalled();
    });

    it('should call abandon game for solo Game', () => {
        const spy = spyOn(classicManager, 'quitGame').and.callFake(() => {});
        component.roomInformation = mockRoomInfo;
        component.quit();
        expect(spy).toHaveBeenCalled();
    });

    it('should quit game when limitedMode', () => {
        const spy = spyOn(limitedManager, 'disconnect').and.callFake(() => {});
        const routerSpy = spyOn(limitedManager, 'redirection').and.callFake((route: string) => {});
        component.isLimitedGame = true;
        component.quit();
        expect(spy).toHaveBeenCalled();
        expect(routerSpy).toHaveBeenCalledWith('/home');
    });

    it('should quit game for mode solo when abandon button is clicked', () => {
        const routerSpy = spyOn(classicManager, 'redirection').and.callFake((route: string) => {});
        component.roomInformation = mockRoomInfo;
        component.quit();
        expect(routerSpy).toHaveBeenCalledWith('/selection');
    });

    it('should return true if the key t is pressed', () => {
        const tEvent: KeyboardEvent = new KeyboardEvent('keydown', { key: 't' });
        expect(component.checkPressedT(tEvent)).toBe(true);
    });

    it('should activate cheat mode when t is pressed and isCheatMode is false', (done) => {
        const activateCheatModeSpy = spyOn(component, 'activateCheatMode');
        const tEvent: KeyboardEvent = new KeyboardEvent('keyup', { key: 't' });

        component.onKeyDown(tEvent);
        setTimeout(() => {
            expect(activateCheatModeSpy).toHaveBeenCalled();
            done();
        }, WAIT_TIME);
        expect(activateCheatModeSpy).toHaveBeenCalled();
        expect(component['isCheatMode']).toBe(false);
    });

    it('should deactivate cheat mode when t is pressed a second time', () => {
        const tEvent: KeyboardEvent = new KeyboardEvent('keyup', { key: 't' });
        component['isCheatMode'] = true;

        component.onKeyDown(tEvent);
        expect(component['isCheatMode']).toBe(false);
    });

    it('should flash the differences when cheat mode is active', () => {
        playAreaService.modifiedContext = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        playAreaService.modifiedContext.fillRect(0, 0, MAX_WIDTH, MAX_HEIGHT);
        const setImageData = spyOn(playAreaService, 'setImageData');
        const flashDifferencesSpy = spyOn(playAreaService, 'flashDifferencePixelsCheatMode').and.callFake(() => {});
        const getImageDataSpy = spyOn(playAreaService.modifiedContext, 'getImageData');
        const removeHintSpy = spyOn(playAreaService, 'removeHintFromModifiedCanvas').and.callFake(() => {});

        component.activateCheatMode();

        expect(component['isCheatMode']).toBe(true);
        expect(setImageData).toHaveBeenCalled();
        expect(getImageDataSpy).toHaveBeenCalled();
        expect(flashDifferencesSpy).toHaveBeenCalled();
        expect(removeHintSpy).toHaveBeenCalled();
    });

    it('should call confirmQuitGmae when updating cosntants and call the put function', fakeAsync(() => {
        const event: PointerEvent = new PointerEvent('any');
        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        const accept = spyOn(confirmationService, 'confirm').and.callFake((confirmation: Confirmation) => {
            if (confirmation.accept) {
                return confirmation.accept();
            }
        });
        component.confirmQuitGame(event);
        expect(accept).toHaveBeenCalled();
    }));
});
