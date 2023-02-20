/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';
import { DrawingService } from '@app/services/drawing-service/drawing.service';

describe('DrawingService', () => {
    let service: DrawingService;
    let contextStub1: CanvasRenderingContext2D;
    let contextStub2: CanvasRenderingContext2D;

    beforeEach(() => {
        contextStub1 = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        contextStub2 = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
    });

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DrawingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should swap canvases', () => {
        contextStub1.fillStyle = 'white';
        contextStub1.fillRect(0, 0, 1, 1);
        service.originalContextForeground = contextStub1;
        contextStub2.fillStyle = 'black';
        contextStub2.fillRect(0, 0, 1, 1);
        service.modifiableContextForeground = contextStub2;
        const imageDataOriginal1 = contextStub1.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        const imageDataOriginal2 = contextStub2.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        service.swapCanvases();

        expect(service.originalContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT)).toEqual(imageDataOriginal2);
        expect(service.modifiableContextForeground.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT)).toEqual(imageDataOriginal1);
    });

    it('should duplicate from the correct canvas', () => {
        service.modifiableContextForeground = contextStub1;
        service.originalContextForeground = contextStub2;
        const resetCanvasSpy = spyOn(service, 'resetCanvas').and.callThrough();
        service.duplicateCanvas(true);
        expect(resetCanvasSpy).toHaveBeenCalledWith(service.modifiableContextForeground);

        service.duplicateCanvas(false);
        expect(resetCanvasSpy).toHaveBeenCalledWith(service.originalContextForeground);
    });

    it('should reset canvas', () => {
        service.resetCanvas(contextStub1);
        contextStub2.clearRect(0, 0, MAX_WIDTH, MAX_HEIGHT);

        expect(contextStub1.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT)).toEqual(contextStub2.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT));
    });

    it('should change lineWidth', () => {
        service.currentContext = contextStub1;
        const lineWidth = 5;
        service.currentContext.lineWidth = 2;
        service.changeLineWidth(lineWidth);
        expect(service.currentContext.lineWidth).toBe(lineWidth);
    });

    it('should change strokeStyle', () => {
        service.currentContext = contextStub1;
        const strokeStyle = '#000000';
        service.currentContext.strokeStyle = '#ff00ff';
        service.changeContextColor(strokeStyle);
        expect(service.currentContext.strokeStyle).toBe(strokeStyle);
    });

    it('should change globalComposition', () => {
        service.currentContext = contextStub1;
        const globalComposition = 'destination-out';
        service.changeGlobalComposition(globalComposition);
        expect(service.currentContext.globalCompositeOperation).toBe(globalComposition);
    });

    it('should swap the current context', () => {
        service.originalContextForeground = contextStub1;
        service.originalContextForeground.fillRect(1, 1, 1, 1);
        service.modifiableContextForeground = contextStub2;
        service.currentContext = service.originalContextForeground;
        service.changeCurrentContext();
        expect(service.currentContext).toEqual(service.modifiableContextForeground);
        service.changeCurrentContext();
        expect(service.currentContext).toEqual(service.originalContextForeground);
    });
});
