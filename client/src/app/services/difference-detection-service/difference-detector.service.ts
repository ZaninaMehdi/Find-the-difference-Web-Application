import { Injectable } from '@angular/core';
import { ALPHA, MAX_HEIGHT, MAX_WIDTH, PIXEL_LENGTH } from '@app/constants';
import { Point2d } from '@app/interfaces/point2d';

@Injectable({
    providedIn: 'root',
})
export class DifferenceDetectorService {
    context: CanvasRenderingContext2D;
    imageWidth: number = MAX_WIDTH;
    imageHeight: number = MAX_HEIGHT;

    detectAndDrawDifferences(originalImage: ImageData, modifiedImage: ImageData, radius: number): Point2d[][] {
        const visitedCoords = Array.from({ length: this.imageHeight }, () => Array.from({ length: this.imageWidth }, () => false));
        const ok: Point2d[] = this.convertDifferenceMatrixToDifferencesCoords(
            this.applyRadiusOnDifferences(this.convertDifferencesToOnesAndZeroes(originalImage, modifiedImage), radius),
        );
        this.context.putImageData(this.transformCoordsToImageData(ok), 0, 0);
        return this.mergeAdjacentPixels(visitedCoords, ok);
    }

    findDifferentPixels(originalImage: ImageData, modifiedImage: ImageData): number[] {
        const pixelsPositions: number[] = [];
        for (let i = 0; i < originalImage.data.length; ++i) {
            if (originalImage.data[i] !== modifiedImage.data[i]) {
                const index = Math.floor(i / PIXEL_LENGTH);
                pixelsPositions.push(index);
                i = (index + 1) * PIXEL_LENGTH;
            }
        }

        return pixelsPositions;
    }

    findDifferentPixelsCoords(pixelsTable: number[]): Point2d[] {
        const differentPixelsCoords: Point2d[] = [];

        for (const pixel of pixelsTable) {
            differentPixelsCoords.push({ x: pixel % this.imageWidth, y: Math.floor(pixel / this.imageWidth) });
        }

        return differentPixelsCoords;
    }

    findSurroundingPixelsCoords(point2d: Point2d): Point2d[] {
        const surroundingCoords: Point2d[] = [];

        for (let x = point2d.x - 1; x <= point2d.x + 1; x++) {
            for (let y = point2d.y - 1; y <= point2d.y + 1; y++) {
                if (this.isCoordInImage(x, y)) {
                    surroundingCoords.push({ x, y });
                }
            }
        }

        return surroundingCoords;
    }

    mergeAndFilter(array1: Point2d[], array2: Point2d[]): Point2d[] {
        return array1.concat(array2).reduce((accumulatedArray: Point2d[], currentCoord) => {
            if (!accumulatedArray.find((coord) => coord.x === currentCoord.x && coord.y === currentCoord.y))
                return accumulatedArray.concat([currentCoord]);

            return accumulatedArray;
        }, []);
    }

    transformCoordsToImageData(coordsTable: Point2d[]): ImageData {
        const imageData: Uint8ClampedArray = new Uint8ClampedArray(this.imageWidth * this.imageHeight * PIXEL_LENGTH);
        for (const coord of coordsTable) {
            const index: number = (coord.x + this.imageWidth * coord.y) * PIXEL_LENGTH;
            imageData[index] = 0;
            imageData[index + 1] = 0;
            imageData[index + 2] = 0;
            imageData[index + 3] = ALPHA;
        }
        return new ImageData(imageData, this.imageWidth, this.imageHeight);
    }

    bfsSearch(visited: boolean[][], point: Point2d, differenceCoords: Point2d[]): Point2d[] {
        const queue: Point2d[] = [];
        const difference: Point2d[] = [];

        queue.push(point);
        visited[point.y][point.x] = true;
        while (queue.length !== 0) {
            this.addCoordIfValid(queue, visited, differenceCoords);
            this.updateDifferenceCoords(queue, difference, differenceCoords);
        }

        return difference;
    }

    isCoordIncludedInDifferenceArray(differenceArray: Point2d[], point: Point2d): boolean {
        return differenceArray.some((coord) => {
            return coord.x === point.x && coord.y === point.y;
        });
    }

    isCoordIncludedInDifferenceRadius(point: Point2d, center: Point2d, radius: number): boolean {
        return Math.round(Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2))) <= radius;
    }

    isCoordValid(point: Point2d, visitedCoords: boolean[][], differenceCoords: Point2d[]): boolean {
        return !visitedCoords[point.y][point.x] && this.isCoordIncludedInDifferenceArray(differenceCoords, point);
    }

    mergeAdjacentPixels(visitedCoords: boolean[][], differentPixelsCoords: Point2d[]): Point2d[][] {
        const mergedDifferences: Point2d[][] = [];

        for (let differentCoordsIndex = 0; differentCoordsIndex < differentPixelsCoords.length; differentCoordsIndex++) {
            mergedDifferences.push(this.bfsSearch(visitedCoords, differentPixelsCoords[differentCoordsIndex], differentPixelsCoords));
            differentCoordsIndex--;
        }

        return mergedDifferences;
    }
    convertDifferencesToOnesAndZeroes(originalImage: ImageData, modifiedImage: ImageData): number[][] {
        const differencesMatrix = Array.from({ length: this.imageHeight }, () => Array.from({ length: this.imageWidth }, () => 0));
        const differencesArray2d: Point2d[] = this.findDifferentPixelsCoords(this.findDifferentPixels(originalImage, modifiedImage));

        for (const point of differencesArray2d) {
            differencesMatrix[point.y][point.x] = 1;
        }

        return differencesMatrix;
    }

    manhattan(differenceMatrix: number[][]): number[][] {
        for (let i = 0; i < differenceMatrix.length; i++) {
            for (let j = 0; j < differenceMatrix[0].length; j++) {
                if (differenceMatrix[i][j] === 1) {
                    differenceMatrix[i][j] = 0;
                } else {
                    differenceMatrix[i][j] = differenceMatrix.length + differenceMatrix[i].length;
                    if (i > 0) differenceMatrix[i][j] = Math.min(differenceMatrix[i][j], differenceMatrix[i - 1][j] + 1);
                    if (j > 0) differenceMatrix[i][j] = Math.min(differenceMatrix[i][j], differenceMatrix[i][j - 1] + 1);
                }
            }
        }

        for (let i = differenceMatrix.length - 1; i >= 0; i--) {
            for (let j = differenceMatrix[0].length - 1; j >= 0; j--) {
                if (i + 1 < differenceMatrix.length) differenceMatrix[i][j] = Math.min(differenceMatrix[i][j], differenceMatrix[i + 1][j] + 1);
                if (j + 1 < differenceMatrix[i].length) differenceMatrix[i][j] = Math.min(differenceMatrix[i][j], differenceMatrix[i][j + 1] + 1);
            }
        }

        return differenceMatrix;
    }

    applyRadiusOnDifferences(differenceMatrix: number[][], radius: number): number[][] {
        differenceMatrix = this.manhattan(differenceMatrix);
        differenceMatrix.forEach((element, index) => {
            for (let j = 0; j < element.length; j++) {
                differenceMatrix[index][j] = differenceMatrix[index][j] <= radius ? 1 : 0;
            }
        });

        return differenceMatrix;
    }

    convertDifferenceMatrixToDifferencesCoords(differenceMatrix: number[][]): Point2d[] {
        const differencesCoords: Point2d[] = [];
        for (let i = 0; i < differenceMatrix.length; i++) {
            for (let j = 0; j < differenceMatrix[0].length; j++) {
                if (differenceMatrix[i][j] === 1) differencesCoords.push({ x: j, y: i });
            }
        }

        return differencesCoords;
    }

    private addCoordIfValid(queue: Point2d[], visited: boolean[][], differenceCoords: Point2d[]): void {
        for (const coord of this.findSurroundingPixelsCoords(queue[0])) {
            if (this.isCoordValid(coord, visited, differenceCoords)) {
                queue.push(coord);
                visited[coord.y][coord.x] = true;
            }
        }
    }

    private updateDifferenceCoords(queue: Point2d[], difference: Point2d[], differenceCoords: Point2d[]): void {
        const firstQueueElement: Point2d | undefined = queue.shift();
        if (firstQueueElement !== undefined) difference.push(firstQueueElement);
        differenceCoords.splice(
            differenceCoords.findIndex(
                (element) => element.x === difference[difference.length - 1].x && element.y === difference[difference.length - 1].y,
            ),
            1,
        );
    }

    private isCoordInImage(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.imageWidth && y < this.imageHeight;
    }
}
