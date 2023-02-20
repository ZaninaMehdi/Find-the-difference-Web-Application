/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { MAX_HEIGHT, MAX_WIDTH, MouseButton, WAIT_TIME } from '@app/constants';
import { GameData, GameTimes, ServerGameSheet } from '@app/interfaces/game-sheet';
import { Point2d } from '@app/interfaces/point2d';
import { Quadrant } from '@app/interfaces/quadrant';
import { ClassicRoom } from '@app/interfaces/rooms';
import { DifferenceDetectorService } from '@app/services/difference-detection-service/difference-detector.service';
import { PlayAreaService } from './play-area.service';

describe('PlayAreaService', () => {
    let playAreaService: PlayAreaService;
    let differenceDetectorService: DifferenceDetectorService;

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
    const mockRoomInfo: ClassicRoom = {
        hostId: 'hostId',
        roomId: '1',
        playerName: 'bleepbloop',
        hintPenalty: 5,
        game,
        gameMode: 'Classic - solo',
        timer: 0,
        differencesFound: 5,
        endGameMessage: '',
        currentDifference: [],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        playAreaService = TestBed.inject(PlayAreaService);
        differenceDetectorService = TestBed.inject(DifferenceDetectorService);
    });

    it('should be created', () => {
        expect(playAreaService).toBeTruthy();
    });

    it('should load an image', (done) => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const contextSpy = spyOn(context, 'drawImage').and.callFake(() => {});

        playAreaService.onLoad(context, 'assets/bmp_640.bmp');
        setTimeout(() => {
            expect(contextSpy).toHaveBeenCalled();
            done();
        }, 500);
    });

    it('should get the pixels from the current difference', () => {
        const currentDifference: Point2d[] = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 0 },
        ];
        const expectedImageDataIndexes = [0, 2560, 4];
        const imageDataIndexes = playAreaService.getImageDataIndexesFromDifference(currentDifference);

        expect(imageDataIndexes).toEqual(expectedImageDataIndexes);
    });

    it('should detect the mouse position when there is a mouse click', () => {
        expect(playAreaService.mouseHitDetect({ button: MouseButton.Left } as MouseEvent)).toBeTrue();
    });

    it('should not detect the mouse mouvement if there is not a left click', () => {
        expect(playAreaService.mouseHitDetect({ button: MouseButton.Right } as MouseEvent)).toBeFalse();
        expect(playAreaService.mouseHitDetect({ button: MouseButton.Back } as MouseEvent)).toBeFalse();
        expect(playAreaService.mouseHitDetect({ button: MouseButton.Forward } as MouseEvent)).toBeFalse();
        expect(playAreaService.mouseHitDetect({ button: MouseButton.Middle } as MouseEvent)).toBeFalse();
    });

    it('should not detect the mouse mouvement if stopClick is true', () => {
        playAreaService.stopClick = true;
        expect(playAreaService.mouseHitDetect({ button: MouseButton.Left } as MouseEvent)).toBeFalse();
    });

    it('should clear the contents of the canvas when resetCanves is called', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
        const expectedCtx: CanvasRenderingContext2D = canvas.getContext('2d')!;
        const methodSpy = spyOn(ctx, 'clearRect');

        expectedCtx.createImageData(MAX_WIDTH, MAX_HEIGHT);
        playAreaService.resetCanvas(ctx);

        expect(methodSpy).toHaveBeenCalled();
        expect(ctx.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT)).toEqual(expectedCtx.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT));
    });

    it('should get the imagesData of the two contexes when setImageData is called', () => {
        const originalCanvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const originalCanvasFG: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const modifiedCanvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const modifiedCanvasFG: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);

        playAreaService.originalContext = originalCanvas.getContext('2d')!;
        playAreaService.originalContextForeground = originalCanvasFG.getContext('2d')!;
        playAreaService.modifiedContext = modifiedCanvas.getContext('2d')!;
        playAreaService.modifiedContextForeground = modifiedCanvasFG.getContext('2d')!;

        const methodSpy = spyOn(playAreaService.originalContext, 'getImageData');
        const methodSpy1 = spyOn(playAreaService.originalContextForeground, 'getImageData');
        const methodSpy2 = spyOn(playAreaService.modifiedContext, 'getImageData');
        const methodSpy3 = spyOn(playAreaService.modifiedContextForeground, 'getImageData');

        playAreaService.originalContext.createImageData(MAX_WIDTH, MAX_HEIGHT);
        playAreaService.modifiedContext.createImageData(MAX_WIDTH, MAX_HEIGHT);
        playAreaService.originalContextForeground.createImageData(MAX_WIDTH, MAX_HEIGHT);
        playAreaService.modifiedContextForeground.createImageData(MAX_WIDTH, MAX_HEIGHT);

        playAreaService.setImageData();

        expect(methodSpy).toHaveBeenCalled();
        expect(methodSpy1).toHaveBeenCalled();
        expect(methodSpy2).toHaveBeenCalled();
        expect(methodSpy3).toHaveBeenCalled();

        expect(playAreaService.originalData).toEqual(playAreaService.originalContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT));
        expect(playAreaService.originalDataForeground).toEqual(playAreaService.originalContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT));
        expect(playAreaService.modifiedData).toEqual(playAreaService.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT));
        expect(playAreaService.modifiedDataForeground).toEqual(playAreaService.modifiedContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT));
    });

    it('should call displayError when displayErrorOnCanvas is called', () => {
        const methodSpy = spyOn(playAreaService, 'displayError');

        playAreaService.displayErrorOnCanvas(true);
        expect(methodSpy).toHaveBeenCalled();

        playAreaService.displayErrorOnCanvas(false);
        expect(methodSpy).toHaveBeenCalled();
    });

    it('should remove the current Diffrence from the modified canvas when this difference is found', () => {
        const originalCanvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const modifiedCanvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);

        playAreaService.originalContext = originalCanvas.getContext('2d')!;
        playAreaService.modifiedContext = modifiedCanvas.getContext('2d')!;

        const methodSpy = spyOn(playAreaService.modifiedContext, 'putImageData');

        playAreaService.originalContext.fillStyle = 'blue';
        playAreaService.originalContext.fillRect(0, 0, 1, 1);

        playAreaService.modifiedContext.createImageData(MAX_WIDTH, MAX_HEIGHT);

        mockRoomInfo.currentDifference = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ];

        playAreaService.originalData = playAreaService.originalContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        playAreaService.modifiedData = playAreaService.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);

        playAreaService.removeDifferenceFromModifiedCanvas(mockRoomInfo.currentDifference);

        expect(methodSpy).toHaveBeenCalled();
        expect(playAreaService.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT)).toEqual(
            playAreaService.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT),
        );
    });

    it('should display instantly an error when displayError is called', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
        const initialImageData: ImageData = ctx.createImageData(MAX_WIDTH, MAX_HEIGHT);
        const methodSpy = spyOn(ctx, 'fillText');

        playAreaService.mousePosition = { x: 0, y: 0 };
        playAreaService.displayError(ctx);

        expect(ctx.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT)).toEqual(initialImageData);
        expect(methodSpy).toHaveBeenCalled();

        playAreaService.mousePosition = { x: 615, y: 0 };
        playAreaService.displayError(ctx);

        expect(ctx.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT)).toEqual(initialImageData);
        expect(methodSpy).toHaveBeenCalled();
    });

    it('should flash the difference pixels when flashDifferencePixels is called', (done) => {
        const modifiedCanvasFG: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);

        playAreaService.modifiedContextForeground = modifiedCanvasFG.getContext('2d')!;
        const methodSpy = spyOn(playAreaService.modifiedContextForeground, 'putImageData');
        const methodSpy1 = spyOn(playAreaService, 'resetCanvas');
        const initialImageData = (playAreaService.modifiedDataForeground = playAreaService.modifiedContextForeground.createImageData(
            MAX_WIDTH,
            MAX_HEIGHT,
        ));

        mockRoomInfo.currentDifference = [{ x: 0, y: 0 }];

        playAreaService.flashDifferencePixels(mockRoomInfo.currentDifference);

        setTimeout(() => {
            expect(methodSpy).toHaveBeenCalled();
            expect(methodSpy1).toHaveBeenCalled();
            expect(playAreaService.modifiedDataForeground).toEqual(initialImageData);
            done();
        }, WAIT_TIME);
    });

    it('should flash the difference pixels while cheatMode is called', (done) => {
        const modifiedCanvasFG: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const originalCanvasFG: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);

        playAreaService.modifiedContextForeground = modifiedCanvasFG.getContext('2d')!;
        playAreaService.originalContextForeground = originalCanvasFG.getContext('2d')!;
        const methodSpy = spyOn(playAreaService.modifiedContextForeground, 'putImageData');
        const methodSpy1 = spyOn(playAreaService, 'resetCanvas');
        const initialImageData = (playAreaService.modifiedDataForeground = playAreaService.modifiedContextForeground.createImageData(
            MAX_WIDTH,
            MAX_HEIGHT,
        ));
        const methodSpy3 = spyOn(playAreaService.originalContextForeground, 'putImageData');
        const initialImageData1 = (playAreaService.originalDataForeground = playAreaService.originalContextForeground.createImageData(
            MAX_WIDTH,
            MAX_HEIGHT,
        ));

        mockRoomInfo.currentDifference = [{ x: 0, y: 0 }];

        playAreaService.flashDifferencePixelsCheatMode(mockRoomInfo.currentDifference);

        setTimeout(() => {
            expect(methodSpy).toHaveBeenCalled();
            expect(methodSpy1).toHaveBeenCalled();
            expect(methodSpy3).toHaveBeenCalled();
            expect(playAreaService.modifiedDataForeground).toEqual(initialImageData);
            expect(playAreaService.originalDataForeground).toEqual(initialImageData1);
            done();
        }, WAIT_TIME);
    });

    it('should find the right quadrant', () => {
        let randomDifferencePoint: Point2d = { x: 0, y: 0 };
        expect(playAreaService.findQuadrant(randomDifferencePoint, MAX_WIDTH, MAX_HEIGHT)).toEqual(Quadrant.TopLeft);
        randomDifferencePoint = { x: 400, y: 0 };
        expect(playAreaService.findQuadrant(randomDifferencePoint, MAX_WIDTH, MAX_HEIGHT)).toEqual(Quadrant.TopRight);
        randomDifferencePoint = { x: 0, y: 400 };
        expect(playAreaService.findQuadrant(randomDifferencePoint, MAX_WIDTH, MAX_HEIGHT)).toEqual(Quadrant.BottomLeft);
        randomDifferencePoint = { x: 400, y: 400 };
        expect(playAreaService.findQuadrant(randomDifferencePoint, MAX_WIDTH, MAX_HEIGHT)).toEqual(Quadrant.BottomRight);
    });

    it('should remove the hint from the modified canvas', () => {
        playAreaService.modifiedContext = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        playAreaService.modifiedContext.createImageData(MAX_WIDTH, MAX_HEIGHT);
        playAreaService.modifiedData = playAreaService.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);

        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!;
        const initialImageData: ImageData = ctx.createImageData(MAX_WIDTH, MAX_HEIGHT);
        const putImageDataSpy = spyOn(playAreaService.modifiedContext, 'putImageData');
        const currentDifference: Point2d[] = [{ x: 0, y: 0 }];

        playAreaService.removeHintFromModifiedCanvas(currentDifference, initialImageData);

        expect(putImageDataSpy).toHaveBeenCalled();
        expect(playAreaService.modifiedData).toEqual(initialImageData);
    });

    it('should return the coords of the quadrant to be flashed', () => {
        const convertDifferenceMatrixToDifferencesCoordsSpy = spyOn(differenceDetectorService, 'convertDifferenceMatrixToDifferencesCoords');
        const applyRadiusOnDifferencesSpy = spyOn(differenceDetectorService, 'applyRadiusOnDifferences');
        const startPoint: Point2d = { x: 0, y: 0 };

        playAreaService.returnQuadrant(Quadrant.TopLeft, MAX_WIDTH, MAX_HEIGHT, startPoint);
        expect(convertDifferenceMatrixToDifferencesCoordsSpy).toHaveBeenCalled();
        expect(applyRadiusOnDifferencesSpy).toHaveBeenCalled();
        playAreaService.returnQuadrant(Quadrant.TopRight, MAX_WIDTH, MAX_HEIGHT, startPoint);
        expect(convertDifferenceMatrixToDifferencesCoordsSpy).toHaveBeenCalled();
        expect(applyRadiusOnDifferencesSpy).toHaveBeenCalled();
        playAreaService.returnQuadrant(Quadrant.BottomRight, MAX_WIDTH, MAX_HEIGHT, startPoint);
        expect(convertDifferenceMatrixToDifferencesCoordsSpy).toHaveBeenCalled();
        expect(applyRadiusOnDifferencesSpy).toHaveBeenCalled();
        playAreaService.returnQuadrant(Quadrant.BottomLeft, MAX_WIDTH, MAX_HEIGHT, startPoint);
        expect(convertDifferenceMatrixToDifferencesCoordsSpy).toHaveBeenCalled();
        expect(applyRadiusOnDifferencesSpy).toHaveBeenCalled();
    });

    it('should return the smaller quadrant when the second hint is used', () => {
        const returnQuadrantSpy = spyOn(playAreaService, 'returnQuadrant');
        const findQuadrantSpy = spyOn(playAreaService, 'findQuadrant').and.callThrough();
        let randomDifferencePoint: Point2d = { x: 1, y: 0 };

        playAreaService.returnSmallerQuadrant(randomDifferencePoint);
        expect(findQuadrantSpy).toHaveBeenCalled();
        expect(returnQuadrantSpy).toHaveBeenCalled();

        randomDifferencePoint = { x: 400, y: 400 };
        playAreaService.returnSmallerQuadrant(randomDifferencePoint);
        expect(findQuadrantSpy).toHaveBeenCalled();
        expect(returnQuadrantSpy).toHaveBeenCalled();

        randomDifferencePoint = { x: 0, y: 400 };
        playAreaService.returnSmallerQuadrant(randomDifferencePoint);
        expect(findQuadrantSpy).toHaveBeenCalled();
        expect(returnQuadrantSpy).toHaveBeenCalled();

        randomDifferencePoint = { x: 400, y: 0 };
        playAreaService.returnSmallerQuadrant(randomDifferencePoint);
        expect(findQuadrantSpy).toHaveBeenCalled();
        expect(returnQuadrantSpy).toHaveBeenCalled();
    });
});
