import { HostListener, Injectable } from '@angular/core';
import {
    ALPHA,
    BLUE,
    CENTERING_DISTANCE,
    CHEAT_FLICKER_WAIT_TIME,
    FLICKER_BLUE_TIME,
    FLICKER_GREEN_TIME,
    FLICKER_WAIT_TIME,
    GREEN,
    MAX_HEIGHT,
    MAX_WIDTH,
    MouseButton,
    PIXEL_LENGTH,
    RIGHT_EDGE_COORD,
    WAIT_TIME,
} from '@app/constants';
import { Point2d } from '@app/interfaces/point2d';
import { Quadrant } from '@app/interfaces/quadrant';
import { ClassicRoom } from '@app/interfaces/rooms';
import { DifferenceDetectorService } from '@app/services/difference-detection-service/difference-detector.service';

@Injectable({
    providedIn: 'root',
})
export class PlayAreaService {
    originalContext: CanvasRenderingContext2D;
    originalContextForeground: CanvasRenderingContext2D;
    modifiedContext: CanvasRenderingContext2D;
    modifiedContextForeground: CanvasRenderingContext2D;
    currentContext: CanvasRenderingContext2D;
    originalData: ImageData;
    originalDataForeground: ImageData;
    modifiedData: ImageData;
    modifiedDataForeground: ImageData;
    room: ClassicRoom;
    mousePosition: Point2d;
    buttonPressed: string;
    stopClick: boolean;

    constructor(private differenceDetectorService: DifferenceDetectorService) {
        this.mousePosition = { x: 0, y: 0 };
        this.buttonPressed = '';
        this.stopClick = false;
    }

    @HostListener('keydown', ['$event'])
    resetCanvas(context: CanvasRenderingContext2D): void {
        context.clearRect(0, 0, MAX_WIDTH, MAX_HEIGHT);
    }

    onLoad(context: CanvasRenderingContext2D, link: string) {
        const image = new Image();
        image.onload = async () => {
            context.drawImage(await createImageBitmap(image), 0, 0);
        };
        image.src = link;
    }

    mouseHitDetect(event: MouseEvent): boolean {
        if (event.button === MouseButton.Left && !this.stopClick) {
            this.mousePosition = { x: event.offsetX, y: event.offsetY };
            return true;
        }
        return false;
    }

    setImageData(): void {
        this.originalData = this.originalContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        this.modifiedData = this.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        this.modifiedDataForeground = this.modifiedContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        this.originalDataForeground = this.originalContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
    }

    getImageDataIndexesFromDifference(currentDifference: Point2d[]): number[] {
        const imageDataIndexes: number[] = [];
        for (const coord of currentDifference) {
            imageDataIndexes.push((coord.x + MAX_WIDTH * coord.y) * PIXEL_LENGTH);
        }
        return imageDataIndexes;
    }

    removeDifferenceFromModifiedCanvas(currentDifference: Point2d[]): void {
        for (const index of this.getImageDataIndexesFromDifference(currentDifference)) {
            for (let i = 0; i < PIXEL_LENGTH; i++) {
                this.modifiedData.data[index + i] = this.originalData.data[index + i];
            }
        }

        this.modifiedContext.putImageData(this.modifiedData, 0, 0);
    }

    removeHintFromModifiedCanvas(currentDifference: Point2d[], initialImageData: ImageData): void {
        for (const index of this.getImageDataIndexesFromDifference(currentDifference)) {
            for (let i = 0; i < PIXEL_LENGTH; i++) {
                this.modifiedData.data[index + i] = initialImageData.data[index + i];
            }
        }
        this.modifiedContext.putImageData(this.modifiedData, 0, 0);
    }

    displayErrorOnCanvas(isMainCanvas: boolean): void {
        if (isMainCanvas) this.displayError(this.originalContextForeground);
        else this.displayError(this.modifiedContextForeground);
    }

    displayError(context: CanvasRenderingContext2D): void {
        this.resetCanvas(context);
        context.font = '30px system-ui';
        context.fillStyle = 'red';
        if (this.mousePosition.x + RIGHT_EDGE_COORD > MAX_WIDTH)
            context.fillText('Erreur', this.mousePosition.x - RIGHT_EDGE_COORD, this.mousePosition.y);
        else context.fillText('Erreur', this.mousePosition.x - CENTERING_DISTANCE, this.mousePosition.y);
        this.stopClick = true;

        setTimeout(() => {
            this.resetCanvas(context);
            this.stopClick = false;
        }, WAIT_TIME);
    }

    flashDifferencePixels(currentDifference: Point2d[]): void {
        const imageDataIndexes = this.getImageDataIndexesFromDifference(currentDifference);
        const firstInterval = setInterval(() => {
            const secondInterval = setInterval(() => {
                for (const index of imageDataIndexes) {
                    this.modifiedDataForeground.data[index] = 0;
                    this.modifiedDataForeground.data[index + 1] = GREEN;
                    this.modifiedDataForeground.data[index + 2] = 0;
                    this.modifiedDataForeground.data[index + 3] = ALPHA;
                }
                this.modifiedContextForeground.putImageData(this.modifiedDataForeground, 0, 0);
            }, FLICKER_GREEN_TIME);

            for (const index of imageDataIndexes) {
                this.modifiedDataForeground.data[index] = 0;
                this.modifiedDataForeground.data[index + 1] = 0;
                this.modifiedDataForeground.data[index + 2] = BLUE;
                this.modifiedDataForeground.data[index + 3] = ALPHA;
            }
            this.modifiedContextForeground.putImageData(this.modifiedDataForeground, 0, 0);

            setTimeout(() => {
                clearInterval(secondInterval);
                this.resetCanvas(this.modifiedContextForeground);
            }, FLICKER_WAIT_TIME);
        }, FLICKER_BLUE_TIME);

        setTimeout(() => {
            clearInterval(firstInterval);
            this.resetCanvas(this.modifiedContextForeground);
        }, FLICKER_WAIT_TIME);
    }

    // eslint-disable-next-line max-params
    returnQuadrant(quadrant: Quadrant, width: number, height: number, startPoint: Point2d): Point2d[] {
        const outlineQuadrant = Array.from({ length: MAX_HEIGHT }, () => Array.from({ length: MAX_WIDTH }, () => 0));
        let startPointX = startPoint.x;
        let finishPointX = startPoint.x + width / 2;
        let startPointY = startPoint.y;
        let finishPointY = startPoint.y + height / 2;

        switch (quadrant) {
            case Quadrant.TopRight:
                startPointX = startPoint.x + width / 2;
                finishPointX = startPointX + width / 2;
                startPointY = startPoint.y;
                finishPointY = startPoint.y + height / 2;
                break;

            case Quadrant.BottomRight:
                startPointX = startPoint.x + width / 2;
                finishPointX = startPointX + width / 2;
                startPointY = startPoint.y + height / 2;
                finishPointY = startPointY + height / 2;
                break;

            case Quadrant.TopLeft:
                startPointX = startPoint.x;
                finishPointX = startPointX + width / 2;
                startPointY = startPoint.y;
                finishPointY = startPointY + height / 2;
                break;

            case Quadrant.BottomLeft:
                startPointX = startPoint.x;
                finishPointX = startPoint.x + width / 2;
                startPointY = startPoint.y + height / 2;
                finishPointY = startPointY + height / 2;
                break;
        }
        for (let i = startPointX; i <= finishPointX; i += width / 2 - 1) {
            for (let j = startPointY; j < finishPointY; j++) {
                outlineQuadrant[j][i] = 1;
            }
        }
        for (let i = startPointY; i <= finishPointY; i += height / 2 - 1) {
            for (let j = startPointX; j < finishPointX; j++) {
                outlineQuadrant[i][j] = 1;
            }
        }

        return this.differenceDetectorService.convertDifferenceMatrixToDifferencesCoords(
            this.differenceDetectorService.applyRadiusOnDifferences(outlineQuadrant, 3),
        );
    }

    flashDifferencePixelsCheatMode(currentDifference: Point2d[]): void {
        const imageDataIndexes = this.getImageDataIndexesFromDifference(currentDifference);
        const firstInterval = setInterval(() => {
            const secondInterval = setInterval(() => {
                for (const index of imageDataIndexes) {
                    this.modifiedDataForeground.data[index] = 0;
                    this.modifiedDataForeground.data[index + 1] = 0;
                    this.modifiedDataForeground.data[index + 2] = BLUE;
                    this.modifiedDataForeground.data[index + 3] = ALPHA;
                    this.originalDataForeground.data[index] = 0;
                    this.originalDataForeground.data[index + 1] = 0;
                    this.originalDataForeground.data[index + 2] = BLUE;
                    this.originalDataForeground.data[index + 3] = ALPHA;
                }
                this.modifiedContextForeground.putImageData(this.modifiedDataForeground, 0, 0);
                this.originalContextForeground.putImageData(this.originalDataForeground, 0, 0);
            }, CHEAT_FLICKER_WAIT_TIME);

            for (const index of imageDataIndexes) {
                this.modifiedDataForeground.data[index] = 0;
                this.modifiedDataForeground.data[index + 1] = 0;
                this.modifiedDataForeground.data[index + 2] = BLUE;
                this.modifiedDataForeground.data[index + 3] = ALPHA;
                this.originalDataForeground.data[index] = 0;
                this.originalDataForeground.data[index + 1] = 0;
                this.originalDataForeground.data[index + 2] = BLUE;
                this.originalDataForeground.data[index + 3] = ALPHA;
            }
            this.modifiedContextForeground.putImageData(this.modifiedDataForeground, 0, 0);
            this.originalContextForeground.putImageData(this.originalDataForeground, 0, 0);

            setTimeout(() => {
                clearInterval(secondInterval);
                this.resetCanvas(this.modifiedContextForeground);
                this.resetCanvas(this.originalContextForeground);
            }, CHEAT_FLICKER_WAIT_TIME);
        }, 2 * CHEAT_FLICKER_WAIT_TIME);

        setTimeout(() => {
            clearInterval(firstInterval);
            this.resetCanvas(this.modifiedContextForeground);
            this.resetCanvas(this.originalContextForeground);
        }, WAIT_TIME);
    }

    findQuadrant(randomDifferencePoint: Point2d, width: number, height: number): number {
        if (0 <= randomDifferencePoint.x && randomDifferencePoint.x < width / 2) {
            if (0 <= randomDifferencePoint.y && randomDifferencePoint.y < height / 2) {
                return Quadrant.TopLeft;
            } else return Quadrant.BottomLeft;
        } else {
            if (0 <= randomDifferencePoint.y && randomDifferencePoint.y < height / 2) {
                return Quadrant.TopRight;
            } else return Quadrant.BottomRight;
        }
    }

    returnSmallerQuadrant(randomDifferencePoint: Point2d): Point2d[] {
        let difference: Point2d = { ...randomDifferencePoint };
        let startPoint: Point2d = { x: 0, y: 0 };
        switch (this.findQuadrant(randomDifferencePoint, MAX_WIDTH, MAX_HEIGHT)) {
            case Quadrant.TopLeft:
                difference = randomDifferencePoint;
                break;
            case Quadrant.TopRight:
                difference.x = randomDifferencePoint.x - MAX_WIDTH / 2;
                startPoint = { x: MAX_WIDTH / 2, y: 0 };
                break;
            case Quadrant.BottomLeft:
                difference.y = randomDifferencePoint.y - MAX_HEIGHT / 2;
                startPoint = { x: 0, y: MAX_HEIGHT / 2 };
                break;
            case Quadrant.BottomRight:
                difference.x = randomDifferencePoint.x - MAX_WIDTH / 2;
                difference.y = randomDifferencePoint.y - MAX_HEIGHT / 2;
                startPoint = { x: MAX_WIDTH / 2, y: MAX_HEIGHT / 2 };
                break;
        }
        return this.returnQuadrant(this.findQuadrant(difference, MAX_WIDTH / 2, MAX_HEIGHT / 2), MAX_WIDTH / 2, MAX_HEIGHT / 2, startPoint);
    }
}
