import { Injectable } from '@angular/core';
import { Tool } from '@app/classes/tool';
import { MIN_ERASER_WIDTH, MouseButton } from '@app/constants';
import { Point2d } from '@app/interfaces/point2d';
import { DrawingService } from '@app/services/drawing-service/drawing.service';

@Injectable({
    providedIn: 'root',
})
export class EraserService extends Tool {
    private pathData: Point2d[];

    constructor(drawingService: DrawingService) {
        super(drawingService);
        this.width = MIN_ERASER_WIDTH;
        this.clearPath();
    }

    onMouseDown(event: MouseEvent): void {
        this.mouseDown = event.button === MouseButton.Left;
        if (this.mouseDown) {
            this.clearPath();
            this.drawingService.changeGlobalComposition('destination-out');
            this.actionStarted = true;
            this.lastPoint = this.getPositionFromMouse(event);
            this.pathData.push(this.lastPoint);
            this.eraseSquare(this.lastPoint);
        }
    }

    clearPath(): void {
        this.pathData = [];
    }

    onMouseUp(event: MouseEvent): void {
        if (this.mouseDown) {
            this.updateCurrentPosition(event);
            this.eraseSquare(this.lastPoint);
        }
        this.mouseDown = false;
        this.clearPath();
    }

    onMouseMove(event: MouseEvent): void {
        if (this.mouseDown) {
            this.updateCurrentPosition(event);
        }
    }

    changeWidth(newWidth: number) {
        if (newWidth >= MIN_ERASER_WIDTH) {
            this.width = newWidth;
            this.drawingService.changeLineWidth(newWidth);
        }
    }

    updateCurrentPosition(event: MouseEvent): void {
        const mousePosition = this.getPositionFromMouse(event);
        this.pathData.push(mousePosition);
        this.erasePath(this.pathData);
        this.lastPoint = mousePosition;
    }

    private erasePath(path: Point2d[]): void {
        this.drawingService.currentContext.beginPath();
        for (const point of path) {
            this.drawingService.currentContext.lineTo(point.x, point.y);
        }
        this.drawingService.currentContext.stroke();
    }

    private eraseSquare(point: Point2d): void {
        this.drawingService.currentContext.clearRect(point.x - this.width / 2, point.y - this.width / 2, this.width, this.width);
    }
}
