/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';

import { UndoRedoService } from './undo-redo.service';

describe('UndoRedoService', () => {
    let service: UndoRedoService;
    const emptyArr: Uint8ClampedArray = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const arr1: Uint8ClampedArray = new Uint8ClampedArray([1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1]);
    const arr2: Uint8ClampedArray = new Uint8ClampedArray([1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1]);
    const arr3: Uint8ClampedArray = new Uint8ClampedArray([1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1]);
    const emptyImageData: ImageData = new ImageData(emptyArr, 2, 2);
    const imageData1: ImageData = new ImageData(arr1, 2, 2);
    const imageData2: ImageData = new ImageData(arr2, 2, 2);
    const imageData3: ImageData = new ImageData(arr3, 2, 2);

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UndoRedoService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call the correct methods in setup', () => {
        const resetRedoStackSpy = spyOn<any>(service, 'resetRedoStack').and.callThrough();
        const setUndoStackSpy = spyOn<any>(service, 'setUndoStack').and.callThrough();
        const setEmptyCanvasSpy = spyOn<any>(service, 'setEmptyCanvas').and.callThrough();
        service.setup(imageData1);
        expect(resetRedoStackSpy).toHaveBeenCalledTimes(2);
        expect(setUndoStackSpy).toHaveBeenCalledTimes(2);
        expect(setEmptyCanvasSpy).toHaveBeenCalled();
    });

    it('should call findUndoStack and findRedoStack in redo and undo', () => {
        const findUndoStackSpy = spyOn<any>(service, 'findUndoStack').and.callThrough();
        const findRedoStackSpy = spyOn<any>(service, 'findRedoStack').and.callThrough();
        service.redo(false);
        expect(findUndoStackSpy).toHaveBeenCalledWith(false);
        expect(findRedoStackSpy).toHaveBeenCalledWith(false);
        service.undo(true);
        expect(findUndoStackSpy).toHaveBeenCalledWith(true);
        expect(findRedoStackSpy).toHaveBeenCalledWith(true);
    });

    it('redo should remove element from redoStack and put it in undoStack', () => {
        service.originalUndoStack = [imageData1];
        service.originalRedoStack = [imageData2];
        service['emptyCanvas'] = emptyImageData;
        const expectedUndoStack: ImageData[] = [imageData1, imageData2];
        const expectedRedoStack: ImageData[] = [];
        const expectedImageDataResult: ImageData = imageData2;
        const result: ImageData = service.redo(true);
        expect(service.originalUndoStack).toEqual(expectedUndoStack);
        expect(service.originalRedoStack).toEqual(expectedRedoStack);
        expect(result).toEqual(expectedImageDataResult);

        service.originalUndoStack = [imageData1];
        service.originalRedoStack = [];
        expect(service.redo(true)).toEqual(emptyImageData);
        expect(service.originalUndoStack).toEqual([imageData1]);
    });

    it('undo should remove element from undoStack and put it in redoStack', () => {
        service.modifiedUndoStack = [];
        service.modifiedRedoStack = [imageData2];
        service['emptyCanvas'] = emptyImageData;
        const setUndoStackSpy = spyOn<any>(service, 'setUndoStack').and.callThrough();
        expect(service.undo(false)).toEqual(emptyImageData);
        expect(setUndoStackSpy).toHaveBeenCalled();

        service.modifiedUndoStack = [emptyImageData, imageData3, imageData1];
        const expectedImageDataResult: ImageData = imageData3;
        const expectedUndoStack: ImageData[] = [emptyImageData, imageData3];
        const expectedRedoStack: ImageData[] = [imageData2, imageData1];
        const result: ImageData = service.undo(false);
        expect(service.modifiedUndoStack).toEqual(expectedUndoStack);
        expect(service.modifiedRedoStack).toEqual(expectedRedoStack);
        expect(result).toEqual(expectedImageDataResult);
    });

    it('newAction should add a new ImageData to the UndoStack', () => {
        service.originalUndoStack = [emptyImageData, imageData2];
        service.modifiedUndoStack = [emptyImageData, imageData3];

        const resetRedoStackSpy = spyOn<any>(service, 'resetRedoStack').and.callThrough();
        const findUndoStackSpy = spyOn<any>(service, 'findUndoStack').and.callThrough();
        const expectedOriginalUndoStack: ImageData[] = [emptyImageData, imageData2, imageData1];
        const expectedModifiedUndoStack: ImageData[] = [emptyImageData, imageData3, imageData1];
        service.newAction(imageData1, true);
        expect(service.originalUndoStack).toEqual(expectedOriginalUndoStack);
        expect(resetRedoStackSpy).toHaveBeenCalledWith(true);
        expect(findUndoStackSpy).toHaveBeenCalledWith(true);
        service.newAction(imageData1, false);
        expect(service.modifiedUndoStack).toEqual(expectedModifiedUndoStack);
        expect(resetRedoStackSpy).toHaveBeenCalledWith(false);
        expect(findUndoStackSpy).toHaveBeenCalledWith(false);
    });

    it('setUndoStack should put an emptyCanvas in the undoStack', () => {
        service.originalUndoStack = [];
        service.modifiedUndoStack = [imageData2, imageData3];
        const expectedUndoStack = [emptyImageData];

        service.setUndoStack(emptyImageData, true);
        expect(service.originalUndoStack).toEqual(expectedUndoStack);

        service.setUndoStack(emptyImageData, false);
        expect(service.modifiedUndoStack).toEqual(expectedUndoStack);
    });

    it('should set the emptyCanvas', () => {
        service.setEmptyCanvas(emptyImageData);
        const expectedEmptyCanvas: ImageData = emptyImageData;
        expect(service['emptyCanvas']).toEqual(expectedEmptyCanvas);
    });

    it('resetRedoStack should empty the redoStack', () => {
        service.originalRedoStack = [imageData1];
        service.modifiedRedoStack = [imageData2, imageData3];
        const expectedRedoStack: ImageData[] = [];

        service.resetRedoStack(true);
        expect(service.originalRedoStack).toEqual(expectedRedoStack);

        service.resetRedoStack(false);
        expect(service.modifiedRedoStack).toEqual(expectedRedoStack);
    });

    it('checkUndoStack should return the correct result depending on the stack sizes', () => {
        service.originalUndoStack = [emptyImageData, imageData1];
        service.modifiedUndoStack = [emptyImageData];

        expect(service.checkUndoStack(true)).toBe(false);
        expect(service.checkUndoStack(false)).toBe(true);
    });

    it('checkRedoStack should return the correct result depending on the stack sizes', () => {
        service.originalRedoStack = [];
        service.modifiedRedoStack = [imageData2];

        expect(service.checkRedoStack(true)).toBe(true);
        expect(service.checkRedoStack(false)).toBe(false);
    });

    it('should return the correct undoStack', () => {
        service.originalUndoStack = [imageData1];
        service.modifiedUndoStack = [imageData2, imageData3];

        expect(service.findUndoStack(true)).toEqual([imageData1]);
        expect(service.findUndoStack(false)).toEqual([imageData2, imageData3]);
    });

    it('should return the correct redoStack', () => {
        service.originalRedoStack = [imageData1];
        service.modifiedRedoStack = [imageData2, imageData3];

        expect(service.findRedoStack(true)).toEqual([imageData1]);
        expect(service.findRedoStack(false)).toEqual([imageData2, imageData3]);
    });
});
