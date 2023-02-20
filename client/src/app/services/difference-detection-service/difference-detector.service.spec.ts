/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-lines */
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { ALPHA } from '@app/constants';
import { Point2d } from '@app/interfaces/point2d';
import { DifferenceDetectorService } from '@app/services/difference-detection-service/difference-detector.service';

describe('DifferenceDetectorService', () => {
    let service: DifferenceDetectorService;
    const arr: Uint8ClampedArray = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const arr1: Uint8ClampedArray = new Uint8ClampedArray([1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]);
    const imageData1: ImageData = new ImageData(arr, 2, 2);
    const imageData2: ImageData = new ImageData(arr1, 2, 2);

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DifferenceDetectorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return no difference between 2 same images', () => {
        const differentPixels: number[] = service.findDifferentPixels(imageData1, imageData1);
        const differences: number[] = [];
        expect(differentPixels).toEqual(differences);
    });

    it('should return differences between 2 different images', () => {
        const differentPixels: number[] = service.findDifferentPixels(imageData1, imageData2);
        const differences: number[] = [0, 1, 2, 3];
        expect(differentPixels).toEqual(differences);
    });

    it('should return an empty array if there are no different pixels', () => {
        service.imageHeight = service.imageWidth = 2;
        const coords: Point2d[] = service.findDifferentPixelsCoords(service.findDifferentPixels(imageData1, imageData1));
        const correctCoords: Point2d[] = [];
        expect(coords).toEqual(correctCoords);
    });

    it('should return the correct coordinates of the different pixels', () => {
        service.imageHeight = service.imageWidth = 2;
        const coordinates: Point2d[] = service.findDifferentPixelsCoords(service.findDifferentPixels(imageData1, imageData2));
        const correctCoordinates: Point2d[] = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ];
        expect(coordinates).toEqual(correctCoordinates);
    });

    it('should return a group of adjacent pixels', () => {
        const visitedCoords = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false));
        const point: Point2d = { x: 0, y: 0 };
        const differenceCoords: Point2d[] = [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 0, y: 2 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 4, y: 2 },
            { x: 3, y: 2 },
            { x: 3, y: 3 },
        ];
        const correctCoords: Point2d[] = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 0, y: 2 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 3, y: 2 },
            { x: 3, y: 3 },
            { x: 4, y: 2 },
        ];
        expect(service.bfsSearch(visitedCoords, point, differenceCoords)).toEqual(correctCoords);
    });

    it('should return an imageData array froma table of coordinates', () => {
        service.imageHeight = service.imageWidth = 3;
        const differenceTable: Uint8ClampedArray = new Uint8ClampedArray([
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            ALPHA,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            ALPHA,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            ALPHA,
        ]);
        const coordsTable: Point2d[] = [
            { x: 1, y: 1 },
            { x: 1, y: 0 },
            { x: 2, y: 2 },
        ];
        expect(service.transformCoordsToImageData(coordsTable).data).toEqual(differenceTable);
    });

    it('should return true if an element is included in the array', () => {
        const coordsArray: Point2d[] = [
            { x: 1, y: 2 },
            { x: 1, y: 1 },
        ];
        const coordInArray: Point2d = { x: 1, y: 2 };
        expect(service.isCoordIncludedInDifferenceArray(coordsArray, coordInArray)).toBeTrue();
    });

    it('should return false if an element is not included included in the array', () => {
        const coordsArray: Point2d[] = [{ x: 1, y: 2 }];
        const coordInArray: Point2d = { x: 0, y: 1 };
        expect(service.isCoordIncludedInDifferenceArray(coordsArray, coordInArray)).toBeFalse();
    });

    it('should return true if an element is included in the radius', () => {
        const radius = 2;
        const coordInRadius: Point2d = { x: 2, y: 3 };
        const center: Point2d = { x: 2, y: 2 };
        expect(service.isCoordIncludedInDifferenceRadius(coordInRadius, center, radius)).toBeTrue();
    });

    it('should return false if an element is not included included in the radius', () => {
        const radius = 2;
        const coordInRadius: Point2d = { x: 4, y: 4 };
        const center: Point2d = { x: 2, y: 2 };
        expect(service.isCoordIncludedInDifferenceRadius(coordInRadius, center, radius)).toBeFalse();
    });

    it('should return the correct surronding coords of a given point', () => {
        const point = { x: 2, y: 2 };
        const surrondingCoords: Point2d[] = [
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 1, y: 3 },
            { x: 2, y: 1 },
            { x: 2, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 1 },
            { x: 3, y: 2 },
            { x: 3, y: 3 },
        ];
        expect(service.findSurroundingPixelsCoords(point)).toEqual(surrondingCoords);
    });

    it('should return the correct surronding coords of an edge point considering the imageBorders', () => {
        const point = { x: 0, y: 0 };
        const surrondingCoords: Point2d[] = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
        ];
        expect(service.findSurroundingPixelsCoords(point)).toEqual(surrondingCoords);
    });

    it('should return the merged array without duplicates', () => {
        const array1: Point2d[] = [
            { x: 0, y: 1 },
            { x: 2, y: 1 },
            { x: 0, y: 4 },
            { x: 0, y: 0 },
        ];
        const array2: Point2d[] = [
            { x: 0, y: 0 },
            { x: 2, y: 2 },
            { x: 1, y: 4 },
            { x: 2, y: 1 },
        ];
        const mergedArray: Point2d[] = [
            { x: 0, y: 1 },
            { x: 2, y: 1 },
            { x: 0, y: 4 },
            { x: 0, y: 0 },
            { x: 2, y: 2 },
            { x: 1, y: 4 },
        ];
        expect(service.mergeAndFilter(array1, array2)).toEqual(mergedArray);
    });

    it('should return an array of merged differences', () => {
        service.imageHeight = service.imageWidth = 5;
        const visitedCoords = Array.from({ length: service.imageHeight }, () => Array.from({ length: service.imageWidth }, () => false));
        const differentPixels: Point2d[] = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 2, y: 2 },
            { x: 2, y: 3 },
            { x: 4, y: 4 },
        ];
        const correctMergedDifferences: Point2d[][] = [
            [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 0 },
            ],
            [
                { x: 2, y: 2 },
                { x: 2, y: 3 },
            ],
            [{ x: 4, y: 4 }],
        ];
        expect(service.mergeAdjacentPixels(visitedCoords, differentPixels)).toEqual(correctMergedDifferences);
    });

    it('should return the coordinates of all the differences', () => {
        service.imageWidth = service.imageHeight = 5;
        const coordinates1: Uint8ClampedArray = new Uint8ClampedArray([
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ]);
        const coordinates2: Uint8ClampedArray = new Uint8ClampedArray([
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 1, 0, 0,
        ]);
        const data1 = new ImageData(coordinates1, service.imageWidth, service.imageHeight);
        const data2 = new ImageData(coordinates2, service.imageWidth, service.imageHeight);
        const radius = 1;
        service.context = CanvasTestHelper.createCanvas(service.imageWidth, service.imageHeight).getContext('2d') as CanvasRenderingContext2D;
        const putImageDataSpy = spyOn(service.context, 'putImageData').and.callFake(() => {});
        const finalCoords: Point2d[][] = [
            [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 0 },
            ],
            [
                { x: 4, y: 3 },
                { x: 3, y: 4 },
                { x: 4, y: 4 },
            ],
        ];
        const differences: Point2d[][] = service.detectAndDrawDifferences(data1, data2, radius);
        expect(differences).toEqual(finalCoords);
        expect(putImageDataSpy).toHaveBeenCalled();
    });

    it('should verify if a coord is in the image', () => {
        const x = 650;
        const y = -2;

        expect(service['isCoordInImage'](x, y)).toBeFalse();
    });

    it('should return a matrix of ones and zeroes given 2 data images', () => {
        const differencesMatrix: number[][] = [
            [1, 1],
            [1, 1],
        ];
        service.imageHeight = service.imageWidth = 2;
        const findDifferentPixelsCoordsSpy = spyOn(service, 'findDifferentPixelsCoords').and.callThrough();

        expect(service.convertDifferencesToOnesAndZeroes(imageData1, imageData2)).toEqual(differencesMatrix);
        expect(findDifferentPixelsCoordsSpy).toHaveBeenCalled();
    });

    it('should apply manhattan algorithm to an image', () => {
        const differenceMatrix: number[][] = [
            [0, 1],
            [0, 0],
        ];
        const expectedResult: number[][] = [
            [1, 0],
            [2, 1],
        ];

        expect(service.manhattan(differenceMatrix)).toEqual(expectedResult);
    });

    it('should apply the given radius to the differences', () => {
        const differenceMatrix: number[][] = [
            [0, 1],
            [0, 0],
        ];
        const radius = 2;
        const expectedResult: number[][] = [
            [1, 1],
            [1, 1],
        ];

        expect(service.applyRadiusOnDifferences(differenceMatrix, radius)).toEqual(expectedResult);
    });

    it('should convert the difference matrix to differences coords', () => {
        const differenceMatrix: number[][] = [
            [0, 1],
            [0, 0],
        ];
        const expectedResult = [{ x: 1, y: 0 }];

        expect(service.convertDifferenceMatrixToDifferencesCoords(differenceMatrix)).toEqual(expectedResult);
    });
});
