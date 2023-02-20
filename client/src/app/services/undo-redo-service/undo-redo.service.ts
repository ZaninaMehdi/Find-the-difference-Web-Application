import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class UndoRedoService {
    originalUndoStack: ImageData[];
    originalRedoStack: ImageData[];
    modifiedUndoStack: ImageData[];
    modifiedRedoStack: ImageData[];
    private emptyCanvas: ImageData;

    constructor() {
        this.originalUndoStack = [];
        this.originalRedoStack = [];
        this.modifiedUndoStack = [];
        this.modifiedRedoStack = [];
    }

    setup(image: ImageData): void {
        this.resetRedoStack(true);
        this.resetRedoStack(false);
        this.setUndoStack(image, true);
        this.setUndoStack(image, false);
        this.setEmptyCanvas(image);
    }

    redo(isMainCanvas: boolean): ImageData {
        const undoStack = this.findUndoStack(isMainCanvas);
        const redoStack = this.findRedoStack(isMainCanvas);
        const data = redoStack.pop();
        if (data) {
            undoStack.push(data);
            return data;
        } else return this.emptyCanvas;
    }

    undo(isMainCanvas: boolean): ImageData {
        const undoStack = this.findUndoStack(isMainCanvas);
        const redoStack = this.findRedoStack(isMainCanvas);
        if (undoStack.length <= 1) this.setUndoStack(this.emptyCanvas, isMainCanvas);
        else if (undoStack.length > 1) {
            const data = undoStack.pop();
            if (data) {
                redoStack.push(data);
            }
            return undoStack[undoStack.length - 1];
        }
        return this.emptyCanvas;
    }

    newAction(image: ImageData, isMainCanvas: boolean): void {
        const undoStack = this.findUndoStack(isMainCanvas);
        undoStack.push(image);
        this.resetRedoStack(isMainCanvas);
    }

    setUndoStack(image: ImageData, isMainCanvas: boolean): void {
        if (isMainCanvas) this.originalUndoStack = [image];
        else this.modifiedUndoStack = [image];
    }

    setEmptyCanvas(image: ImageData): void {
        this.emptyCanvas = image;
    }

    resetRedoStack(isMainCanvas: boolean): void {
        if (isMainCanvas) this.originalRedoStack = [];
        else this.modifiedRedoStack = [];
    }

    checkUndoStack(isMainCanvas: boolean): boolean {
        const undoStack = this.findUndoStack(isMainCanvas);
        return undoStack.length === 1;
    }

    checkRedoStack(isMainCanvas: boolean): boolean {
        const redoStack = this.findRedoStack(isMainCanvas);
        return redoStack.length === 0;
    }

    findUndoStack(isMainCanvas: boolean): ImageData[] {
        return isMainCanvas ? this.originalUndoStack : this.modifiedUndoStack;
    }

    findRedoStack(isMainCanvas: boolean): ImageData[] {
        return isMainCanvas ? this.originalRedoStack : this.modifiedRedoStack;
    }
}
