import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom } from '@app/interfaces/rooms';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { SelectionViewComponent } from '@app/pages/selection-view/selection-view.component';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { SocketTestHelper } from '@app/services/client-socket-service/client-socket.service.spec';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { Observable, of, Subscription } from 'rxjs';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends ClientSocketService {
    override connect() {
        return;
    }
}
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let classicManager: ClassicGameManagerService;
    let limitedManager: LimitedTimeService;
    let fixture: ComponentFixture<GamePageComponent>;
    let getRoomInfoSpy: jasmine.Spy<() => Observable<ClassicRoom>>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

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
        messages: [],
        endGameMessage: '',
        currentDifference: [],
    };

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, RouterModule.forRoot([{ path: 'selection', component: SelectionViewComponent }])],
            declarations: [GamePageComponent, SidebarComponent, PlayAreaComponent, SelectionViewComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        classicManager = TestBed.inject(ClassicGameManagerService);
        limitedManager = TestBed.inject(LimitedTimeService);
        component = fixture.componentInstance;
        fixture.detectChanges();

        getRoomInfoSpy = spyOn(classicManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));

        component.roomInfo = {
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
        // @ts-ignore: force this private property value for testing.
        spyOn(classicManager, 'connect');
        const spy = spyOn(classicManager.getRoomInfo(), 'subscribe');
        component.ngOnInit();
        tick();
        expect(getRoomInfoSpy).toHaveBeenCalledBefore(spy);
        expect(spy).toHaveBeenCalled();
    }));

    it('should set roomInfo attribute', fakeAsync(() => {
        // @ts-ignore: force this private property value for testing.
        spyOn(classicManager, 'connect').and.returnValue(true);
        component.ngOnInit();
        tick();
        expect(component.roomInfo).toEqual(mockRoomInfo);
    }));

    it('should set roomInfo attribute for limitedMode', fakeAsync(() => {
        // @ts-ignore: force this private property value for testing.
        spyOn(classicManager, 'connect').and.returnValue(true);
        spyOn(limitedManager.isLimitedTimeGame, 'asObservable').and.returnValue(of(true));
        spyOn(limitedManager, 'getRoomInfo').and.returnValue(of(mockRoomInfo));
        spyOn(limitedManager.getRoomInfo(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(component.roomInfo).toEqual(mockRoomInfo);
    }));

    it('should unsubscribe from subscription', fakeAsync(() => {
        component['subscription'] = new Subscription();
        component['limitedSubscription'] = new Subscription();
        const spy = spyOn(component['subscription'], 'unsubscribe');
        const secondSpy = spyOn(component['limitedSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        tick();
        expect(spy).toHaveBeenCalled();
        expect(secondSpy).toHaveBeenCalled();
    }));
});
