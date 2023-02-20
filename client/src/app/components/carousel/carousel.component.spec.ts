import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GameSheet } from '@app/interfaces/game-sheet';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { DataSharingService } from '@app/services/data-sharing-service/data-sharing.service';
import { GamesListService } from '@app/services/games-list-service/games-list.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { Confirmation, ConfirmationService } from 'primeng/api';
import { Observable, of } from 'rxjs';
import { CarouselComponent } from './carousel.component';

const mockGames: GameSheet[] = [
    {
        name: '1er jeu',
        soloBestTimes: [
            { name: 'name1', time: 140 },
            { name: 'name2', time: 300 },
            { name: 'name3', time: 140 },
        ],
        multiplayerBestTimes: [{ name: 'ntqtSoloQ', time: 140 }],
        link: 'assets\\img\\binglybongly_wallpaper.bmp',
    },
    {
        name: '2eme jeu',
        soloBestTimes: [
            { name: '', time: 140 },
            { name: 'ntqtSoloQ', time: 300 },
            { name: 'ntqtSoloQ', time: 140 },
        ],
        multiplayerBestTimes: [{ name: 'ntqtSoloQ', time: 140 }],
        link: 'assets\\img\\binglybongly_wallpaper.bmp',
    },
];

describe('CarouselComponent', () => {
    let component: CarouselComponent;
    let fixture: ComponentFixture<CarouselComponent>;
    let communicationService: CommunicationService;
    let gamesListService: GamesListService;
    let dataSharingService: DataSharingService;
    let getGamesSpy: jasmine.Spy<() => Observable<GameSheet[]>>;
    let confirmationService: ConfirmationService;
    let roomManager: RoomManagerService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CarouselComponent],
            imports: [HttpClientTestingModule, RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(CarouselComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    beforeEach(() => {
        communicationService = TestBed.inject(CommunicationService);
        gamesListService = TestBed.inject(GamesListService);
        dataSharingService = TestBed.inject(DataSharingService);
        roomManager = TestBed.inject(RoomManagerService);
        getGamesSpy = spyOn(communicationService, 'getGames').and.returnValue(of(mockGames));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getallGames method', fakeAsync(() => {
        dataSharingService.notifyOther(true);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const spy = spyOn(component, 'getAllGames').and.callFake(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const secondSpy = spyOn(gamesListService, 'refreshComponent').and.callFake(() => {});
        component.ngOnInit();
        tick();
        fixture.detectChanges();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(secondSpy).toHaveBeenCalled();
    }));

    it('Unit test for subscribe method', fakeAsync(() => {
        const spy = spyOn(communicationService.getGames(), 'subscribe');
        component.ngOnInit();
        tick();
        expect(getGamesSpy).toHaveBeenCalledBefore(spy);
        expect(spy).toHaveBeenCalled();
    }));

    it('should fetch games when onInit() is called', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(component.customGames).toBeDefined();
        expect(component.customGames.length).toBe(2);
        expect(component.customGames).toEqual(mockGames);
    }));

    it('should create a matrix of games', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(component.gamesInSlide).toBeDefined();
        expect(component.gamesInSlide).toEqual(gamesListService.createMatrixOfGames(mockGames));
        expect(gamesListService.createMatrixOfGames(mockGames).length).toBe(component.gamesInSlide.length);
        expect(component.lastSlideIndex).toEqual(gamesListService.createMatrixOfGames(mockGames).length - 1);
    }));

    it('should increment the slideIndex when calling rightButtonClick()', fakeAsync(() => {
        component.currentSlideIndex = 0;
        component.rightButtonClick();
        expect(component.currentSlideIndex).toEqual(1);
    }));

    it('should decrement the slideIndex when calling leftButtonClick()', fakeAsync(() => {
        component.currentSlideIndex = 1;
        component.leftButtonClick();
        expect(component.currentSlideIndex).toEqual(0);
    }));
    it('should call confirm with delete all games accept button click', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(gamesListService, 'updateGameSheet').and.callFake(() => {});
        const event: PointerEvent = new PointerEvent('any');
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(dataSharingService, 'notifyOther').and.callFake(() => {});
        spyOn(communicationService, 'deleteGames').and.returnValue(of(void 0));

        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        const accept = spyOn(confirmationService, 'confirm').and.callFake((confirmation: Confirmation) => {
            if (confirmation.accept) {
                return confirmation.accept();
            }
        });

        component.confirmDeleteGames(event);
        expect(accept).toHaveBeenCalled();
    });

    it('should call confirm with delete all best when timesGames accept button click', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(gamesListService, 'updateGameSheet').and.callFake(() => {});
        const event: PointerEvent = new PointerEvent('any');
        spyOn(communicationService, 'deleteAllBestTimes').and.returnValue(of(void 0));

        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        const accept = spyOn(confirmationService, 'confirm').and.callFake((confirmation: Confirmation) => {
            if (confirmation.accept) {
                return confirmation.accept();
            }
        });

        component.confirmDeleteBestTimes(event);
        expect(accept).toHaveBeenCalled();
    });

    it('should call confirm with update constants when accept button click', () => {
        const event: PointerEvent = new PointerEvent('any');
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(roomManager, 'updateGameSheet').and.callFake(() => {});
        spyOn(communicationService, 'resetConstants').and.returnValue(of(void 0));

        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        const accept = spyOn(confirmationService, 'confirm').and.callFake((confirmation: Confirmation) => {
            if (confirmation.accept) {
                return confirmation.accept();
            }
        });

        component.updateConstantTimes(event);
        expect(accept).toHaveBeenCalled();
    });

    it('should disable reset button', () => {
        spyOn(gamesListService, 'compareTwoBestTimes').and.returnValue(false);
        expect(component.shouldActivateResetBestTimesButton(mockGames)).toEqual(false);
    });

    it('should not disable reset button', () => {
        component.customGames = mockGames;
        spyOn(gamesListService, 'compareTwoBestTimes').and.returnValue(true);
        expect(component.shouldActivateResetBestTimesButton(mockGames)).toEqual(true);
    });
});
