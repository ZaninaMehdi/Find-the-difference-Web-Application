import { Injectable } from '@angular/core';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';

@Injectable({
    providedIn: 'root',
})
export class DrawingService {
    originalContextForeground: CanvasRenderingContext2D;
    modifiableContextForeground: CanvasRenderingContext2D;
    currentContext: CanvasRenderingContext2D;
    isMainCanvas: boolean;

    swapCanvases(): void {
        const tempCtx = this.originalContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        const tempCtx2 = this.modifiableContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        this.resetCanvas(this.originalContextForeground);
        this.resetCanvas(this.modifiableContextForeground);
        this.originalContextForeground.putImageData(tempCtx2, 0, 0);
        this.modifiableContextForeground.putImageData(tempCtx, 0, 0);
    }

    duplicateCanvas(isMainCanvas: boolean): void {
        if (isMainCanvas) {
            this.resetCanvas(this.modifiableContextForeground);
            this.modifiableContextForeground.drawImage(this.originalContextForeground.canvas, 0, 0);
        } else {
            this.resetCanvas(this.originalContextForeground);
            this.originalContextForeground.drawImage(this.modifiableContextForeground.canvas, 0, 0);
        }
    }

    resetCanvas(context: CanvasRenderingContext2D): void {
        context.clearRect(0, 0, MAX_WIDTH, MAX_HEIGHT);
    }

    changeLineWidth(newWidth: number) {
        this.currentContext.lineWidth = newWidth;
    }

    changeContextColor(newColor: string) {
        this.currentContext.strokeStyle = newColor;
        this.currentContext.fillStyle = newColor;
    }

    changeGlobalComposition(newGC: string): void {
        this.currentContext.globalCompositeOperation = newGC as GlobalCompositeOperation;
    }

    changeCurrentContext() {
        this.currentContext =
            this.currentContext === this.originalContextForeground ? this.modifiableContextForeground : this.originalContextForeground;
    }
}
