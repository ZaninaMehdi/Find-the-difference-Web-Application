import { Injectable } from '@angular/core';
import { Tool } from '@app/classes/tool';
import { MouseButton } from '@app/constants';
import { Point2d } from '@app/interfaces/point2d';
import { DrawingService } from '@app/services/drawing-service/drawing.service';

@Injectable({
    providedIn: 'root',
})
export class PencilService extends Tool {
    color: string;
    private pathData: Point2d[];

    constructor(drawingService: DrawingService) {
        super(drawingService);
        this.color = 'black';
        this.clearPath();
    }

    onMouseDown(event: MouseEvent): void {
        this.mouseDown = event.button === MouseButton.Left;
        if (this.mouseDown) {
            this.clearPath();
            this.drawingService.changeGlobalComposition('source-over');
            this.actionStarted = true;
            this.lastPoint = this.getPositionFromMouse(event);
            this.pathData.push(this.lastPoint);
            this.drawCircle(this.lastPoint);
        }
    }

    clearPath(): void {
        this.pathData = [];
    }

    onMouseUp(event: MouseEvent): void {
        if (this.mouseDown) {
            this.updateCurrentPosition(event);
            this.drawCircle(this.lastPoint);
        }
        this.mouseDown = false;
        this.clearPath();
    }

    onMouseMove(event: MouseEvent): void {
        if (this.mouseDown) {
            this.updateCurrentPosition(event);
        }
    }

    changeColor(newColor: string) {
        this.color = newColor;
        this.drawingService.changeContextColor(newColor);
    }

    changeWidth(newWidth: number) {
        if (newWidth > 0) {
            this.width = newWidth;
            this.drawingService.changeLineWidth(newWidth);
        }
    }

    updateCurrentPosition(event: MouseEvent): void {
        const mousePosition = this.getPositionFromMouse(event);
        this.pathData.push(mousePosition);
        this.drawLine(this.pathData);
        this.lastPoint = mousePosition;
    }

    private drawLine(path: Point2d[]): void {
        this.drawingService.currentContext.beginPath();
        for (const point of path) {
            this.drawingService.currentContext.lineTo(point.x, point.y);
        }
        this.drawingService.currentContext.stroke();
    }

    private drawCircle(point: Point2d): void {
        this.drawingService.changeLineWidth(1);
        this.drawingService.currentContext.beginPath();
        this.drawingService.currentContext.arc(point.x, point.y, this.width / 2, 0, Math.PI * 2);
        this.drawingService.currentContext.fill();
        this.drawingService.changeLineWidth(this.width);
    }
}
