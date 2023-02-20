/* eslint-disable @typescript-eslint/no-empty-function */
// eslint-disable-next-line @typescript-eslint/no-empty-function
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { PlayAreaService } from '@app/services/play-area-service/play-area.service';
import { Observable, of, Subscription } from 'rxjs';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}

describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let classicManager: ClassicGameManagerService;
    let limitedManager: LimitedTimeService;
    let playAreaService: PlayAreaService;
    let fixture: ComponentFixture<SidebarComponent>;
    let getRoomInfoSpy: jasmine.Spy<() => Observable<ClassicRoom>>;

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
        gameMode: 'Classic - solo',
        timer: 0,
        differencesFound: 5,
        endGameMessage: '',
        currentDifference: [{ x: 3, y: 6 }],
    };
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
            declarations: [SidebarComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        classicManager = TestBed.inject(ClassicGameManagerService);
        limitedManager = TestBed.inject(LimitedTimeService);
        socketServiceMock = new SocketClientServiceMock();

        playAreaService = TestBed.inject(PlayAreaService);
        getRoomInfoSpy = spyOn(classicManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        playAreaService.originalContext = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        playAreaService.originalContext.fillRect(0, 0, MAX_WIDTH, MAX_HEIGHT);

        playAreaService.modifiedContext = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        playAreaService.modifiedContext.fillRect(0, 0, MAX_WIDTH, MAX_HEIGHT);

        playAreaService.originalContextForeground = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        playAreaService.originalContextForeground.fillRect(0, 0, MAX_WIDTH, MAX_HEIGHT);

        playAreaService.modifiedContextForeground = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        playAreaService.modifiedContextForeground.fillRect(0, 0, MAX_WIDTH, MAX_HEIGHT);
        playAreaService.modifiedDataForeground = playAreaService.modifiedContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);

        component.hintsCount = 3;
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

    it('Unit test for subscribe method', fakeAsync(() => {
        limitedManager.isLimitedTimeGame.next(false);
        const subscribeSpy = spyOn(classicManager.getRoomInfo(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(getRoomInfoSpy).toHaveBeenCalledBefore(subscribeSpy);
        expect(component.roomInformation).toBeDefined();
        expect(subscribeSpy).toHaveBeenCalled();
    }));

    it('Unit test for subscribe method version 2', fakeAsync(() => {
        limitedManager.isLimitedTimeGame.next(true);
        spyOn(limitedManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        const subscribeSpy = spyOn(limitedManager.getRoomInfo(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(subscribeSpy).toHaveBeenCalled();
        expect(component.roomInformation).toBeDefined();
    }));

    it('should decrement the hint attribute of the component', () => {
        const penaltySpy = spyOn(classicManager, 'addPenaltyTime').and.callFake(() => {});

        component.hint();

        expect(penaltySpy).toHaveBeenCalled();
        expect(component.hintsCount).toEqual(2);
    });

    it('should unsubscribe from observable', fakeAsync(() => {
        component['subscription'] = new Subscription();
        component['limitedSubscription'] = new Subscription();
        const unsubscribeSpy = spyOn(component['subscription'], 'unsubscribe');
        const unsubscribeSpy2 = spyOn(component['limitedSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        tick();
        expect(unsubscribeSpy).toHaveBeenCalled();
        expect(unsubscribeSpy2).toHaveBeenCalled();
    }));

    it('should set the imageData and change the game status when a hint is used', () => {
        const setImageDataSpy = spyOn(playAreaService, 'setImageData').and.callFake(() => {});
        const gameStatusSpy = spyOn(classicManager, 'gameStatus').and.callFake(() => {});
        playAreaService.modifiedData = playAreaService.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);

        component.hint();

        expect(setImageDataSpy).toHaveBeenCalled();
        expect(gameStatusSpy).toHaveBeenCalled();
    });

    it('should flash a big quadrant for the first hint is used', () => {
        const removeHintFromModifiedCanvasSpy = spyOn(playAreaService, 'removeHintFromModifiedCanvas').and.callFake(() => {});
        const flashDifferencePixelsSpy = spyOn(playAreaService, 'flashDifferencePixels').and.callFake(() => {});
        const returnQuadrantSpy = spyOn(playAreaService, 'returnQuadrant').and.callFake(() => {
            return [{ x: 0, y: 0 }];
        });
        const findQuadrant = spyOn(playAreaService, 'findQuadrant').and.callFake(() => {
            return 1;
        });
        // eslint-disable-next-line @typescript-eslint/no-shadow, no-unused-vars, @typescript-eslint/no-empty-function
        component.hintsCount = 3;
        component.hint();

        expect(removeHintFromModifiedCanvasSpy).toHaveBeenCalled();
        expect(flashDifferencePixelsSpy).toHaveBeenCalled();
        expect(returnQuadrantSpy).toHaveBeenCalled();
        expect(findQuadrant).toHaveBeenCalled();
    });

    it('should flash a smaller quadrant whe the second hint is used', () => {
        const removeHintFromModifiedCanvasSpy = spyOn(playAreaService, 'removeHintFromModifiedCanvas').and.callFake(() => {});
        const flashDifferencePixelsSpy = spyOn(playAreaService, 'flashDifferencePixels').and.callFake(() => {
            return [{ x: 0, y: 0 }];
        });
        const returnSmallerQuadrantSpy = spyOn(playAreaService, 'returnSmallerQuadrant').and.callFake(() => {
            return [{ x: 0, y: 0 }];
        });

        component.hintsCount = 2;
        component.hint();

        expect(removeHintFromModifiedCanvasSpy).toHaveBeenCalled();
        expect(flashDifferencePixelsSpy).toHaveBeenCalled();
        expect(returnSmallerQuadrantSpy).toHaveBeenCalled();
    });

    it('should flash a random difference whe the third hint is use', () => {
        const flashDifferencePixelsSpy = spyOn(playAreaService, 'flashDifferencePixels').and.callFake(() => {});

        component.hintsCount = 1;
        component.hint();

        expect(flashDifferencePixelsSpy).toHaveBeenCalled();
        expect(component.hintDisabled).toBe(true);
    });

    it('should call onKeyDown once i is pressed', () => {
        const hintSpy = spyOn(component, 'hint').and.callFake(() => {});
        const iEvent: KeyboardEvent = new KeyboardEvent('keyup', { key: 'i' });

        component.onKeyDown(iEvent);

        expect(hintSpy).toHaveBeenCalled();
    });
});
