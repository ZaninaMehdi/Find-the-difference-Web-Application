/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton } from '@angular/material/radio';
import { RouterTestingModule } from '@angular/router/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { ImageCanvasComponent } from '@app/components/image-canvas/image-canvas.component';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';
import { ServerGameSheet } from '@app/interfaces/game-sheet';
import { ImageAlert } from '@app/interfaces/image-alert';
import { Point2d } from '@app/interfaces/point2d';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { DifferenceDetectorService } from '@app/services/difference-detection-service/difference-detector.service';
import { GamesListService } from '@app/services/games-list-service/games-list.service';
import { of } from 'rxjs';

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;
    let differenceService: DifferenceDetectorService;
    let gameListService: GamesListService;

    const mockDifferences: Point2d[][] = [[{ x: 0, y: 0 }]];
    const arr: Uint8ClampedArray = new Uint8ClampedArray([1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]);
    const mockImageData: ImageData = new ImageData(arr, 2, 2);
    const mockGame: ServerGameSheet = {
        originalLink: 'assets/bmp_640.bmp',
        modifiedLink: 'assets/bmp_640.bmp',
        differenceCounter: mockDifferences.length,
        differenceLocations: mockDifferences,
        name: 'game name',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, MatDialogModule],
            declarations: [CreateGamePageComponent, ImageCanvasComponent, MatRadioButton, MatIcon],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [{ provide: MatDialog }, { provide: MAT_DIALOG_DATA, useValue: {} }, { provide: CommunicationService }, ImageCanvasComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGamePageComponent);
        differenceService = TestBed.inject(DifferenceDetectorService);
        gameListService = TestBed.inject(GamesListService);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component['mainCanvasArea'] = TestBed.inject(ImageCanvasComponent);
        component['modifiableCanvasArea'] = TestBed.inject(ImageCanvasComponent);
        component.radius = 3;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call displayImage on main canvas', () => {
        const inputEvent = new Event('input');
        const mainCanvasSpy = spyOn(component['mainCanvasArea'], 'displayImage').and.callFake((event: Event) => {});
        component.displayBothCanvases(inputEvent);

        expect(mainCanvasSpy).toHaveBeenCalledWith(inputEvent);
        expect(component.isOriginalDefault).toBe(false);
    });

    it('should call displayImage on modified canvas', () => {
        const inputEvent = new Event('input');
        const modifiedCanvasSpy = spyOn(component['modifiableCanvasArea'], 'displayImage').and.callFake((event: Event) => {});
        component.displayBothCanvases(inputEvent);

        expect(modifiedCanvasSpy).toHaveBeenCalledWith(inputEvent);
        expect(component.isModifiedDefault).toBe(false);
    });

    it('should reset alert attributes when closed', () => {
        const imgAlert: ImageAlert = { error: '', valid: true };
        component.closeAlert();
        expect(component.alert).toEqual(imgAlert);
    });

    it('should set alert attributes', () => {
        const imgAlert: ImageAlert = { error: 'test-error', valid: true };
        component.handleAlert(imgAlert);
        expect(component.alert).toEqual(imgAlert);

        const imgAlert2: ImageAlert = { error: 'test-error', valid: false };
        component.handleAlert(imgAlert2);
        expect(component.isOriginalDefault).toBeTrue();
        expect(component.isModifiedDefault).toBeTrue();
    });

    it('should call differenceService findGlobal', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        component['mainCanvasArea'].imageContext = context;
        component['modifiableCanvasArea'].imageContext = context;

        const gameListSpy = spyOn(gameListService, 'createGame').and.callFake((game: ServerGameSheet) => {});
        const imageCanvasComponentSpy = spyOn(component['mainCanvasArea'], 'mergeCanvases').and.callFake(() => {
            return mockImageData;
        });
        const imageCanvasComponentSpy2 = spyOn(component['mainCanvasArea'].imageContext.canvas, 'toDataURL').and.callFake(() => {
            return 'assets/bmp_640.bmp';
        });
        const differenceSpy = spyOn(differenceService, 'detectAndDrawDifferences').and.callFake(
            (data1: ImageData, data2: ImageData, radius: number) => {
                return mockDifferences;
            },
        );
        const dialogSpy = spyOn(component.validateDialog, 'open').and.returnValue({
            afterClosed: () => of('game name'),
        } as MatDialogRef<typeof component>);

        component.openValidateDialog();
        expect(differenceSpy).toHaveBeenCalledWith(mockImageData, mockImageData, component.radius);
        expect(imageCanvasComponentSpy).toHaveBeenCalled();
        expect(imageCanvasComponentSpy2).toHaveBeenCalledTimes(2);
        expect(dialogSpy).toHaveBeenCalled();
        expect(gameListSpy).toHaveBeenCalledWith(mockGame);
    });
});
