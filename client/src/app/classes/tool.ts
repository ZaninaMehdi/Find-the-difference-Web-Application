import { Point2d } from '@app/interfaces/point2d';
import { DrawingService } from '@app/services/drawing-service/drawing.service';

// This is justified since we have functions that will be managed by the child classes
/* eslint-disable @typescript-eslint/no-empty-function */

export abstract class Tool {
    lastPoint: Point2d;
    mouseDown: boolean = false;
    actionStarted: boolean = false;
    width: number = 1;

    constructor(protected drawingService: DrawingService) {}

    getPositionFromMouse(event: MouseEvent): Point2d {
        return { x: event.offsetX, y: event.offsetY };
    }

    onMouseUpOutside(): void {
        this.mouseDown = false;
    }

    abstract onMouseDown(event: MouseEvent): void;

    abstract onMouseUp(event: MouseEvent): void;

    abstract onMouseMove(event: MouseEvent): void;

    abstract changeWidth(newWidth: number): void;
}
