/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';
import { Point2d } from '@app/interfaces/point2d';
import { DrawingService } from '@app/services/drawing-service/drawing.service';
import { PencilService } from '@app/services/pencil-service/pencil.service';

// tslint:disable:no-any
describe('PencilService', () => {
    let service: PencilService;
    let mouseEvent: MouseEvent;
    let drawingServiceSpy: jasmine.SpyObj<DrawingService>;
    let ctxStub: CanvasRenderingContext2D;
    let updateCurrentPositionSpy: jasmine.Spy<any>;
    let drawLineSpy: jasmine.Spy<any>;

    beforeEach(() => {
        drawingServiceSpy = jasmine.createSpyObj('DrawingService', ['changeContextColor', 'changeLineWidth', 'changeGlobalComposition']);
        ctxStub = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        TestBed.configureTestingModule({
            providers: [{ provide: DrawingService, useValue: drawingServiceSpy }],
        });

        service = TestBed.inject(PencilService);
        updateCurrentPositionSpy = spyOn<any>(service, 'updateCurrentPosition').and.callThrough();
        // tslint:disable:no-string-literal
        service['drawingService'].currentContext = ctxStub;
        mouseEvent = {
            offsetX: 10,
            offsetY: 10,
            button: 0,
        } as MouseEvent;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it(' onMouseDown should set lastPoint to the right coords', () => {
        const expectedResult: Point2d = { x: 10, y: 10 };
        service.onMouseDown(mouseEvent);
        expect(service.lastPoint).toEqual(expectedResult);
    });

    it(' onMouseDown should set mouseDown property to true on left click', () => {
        service.onMouseDown(mouseEvent);
        expect(service.mouseDown).toEqual(true);
    });

    it(' onMouseDown should set mouseDown property to false on right click', () => {
        const mouseEventRClick = {
            offsetX: 17,
            offsetY: 180,
            button: 2,
        } as MouseEvent;
        service.onMouseDown(mouseEventRClick);
        expect(service.mouseDown).toEqual(false);
    });

    it(' onMouseUp should call updateCurrentPosition if mouseDown is true', () => {
        service.lastPoint = { x: 10, y: 10 };
        service.mouseDown = true;
        drawLineSpy = spyOn<any>(service, 'drawLine').and.stub();

        service.onMouseUp(mouseEvent);
        expect(updateCurrentPositionSpy).toHaveBeenCalled();
    });

    it(' onMouseUp should not call updateCurrentPosition if mouseDown is false', () => {
        service.lastPoint = { x: 10, y: 10 };
        service.mouseDown = false;

        service.onMouseUp(mouseEvent);
        expect(updateCurrentPositionSpy).not.toHaveBeenCalled();
    });

    it(' onMouseMove should call updateCurrentPosition if mouseDown is true', () => {
        service.lastPoint = { x: 10, y: 10 };
        service.mouseDown = true;
        drawLineSpy = spyOn<any>(service, 'drawLine').and.stub();

        service.onMouseMove(mouseEvent);
        expect(updateCurrentPositionSpy).toHaveBeenCalled();
    });

    it(' onMouseMove should not call updateCurrentPosition if mouseDown is false', () => {
        service.lastPoint = { x: 10, y: 10 };
        service.mouseDown = false;

        service.onMouseMove(mouseEvent);
        expect(updateCurrentPositionSpy).not.toHaveBeenCalled();
    });

    it(' changeColor should set color to new Value and call drawingService changeStrokeStyle', () => {
        service.color = 'black';
        const newColor = '#00ff00';
        service.changeColor(newColor);
        expect(service.color).toBe(newColor);
        expect(drawingServiceSpy.changeContextColor).toHaveBeenCalled();
        expect(drawingServiceSpy.changeContextColor).toHaveBeenCalledWith(newColor);
    });

    it(' changeWidth should set width to new Value and call drawingService changeLineWidth', () => {
        service.width = 5;
        const newWidth = 7;
        service.changeWidth(newWidth);
        expect(service.width).toBe(newWidth);
        expect(drawingServiceSpy.changeLineWidth).toHaveBeenCalled();
        expect(drawingServiceSpy.changeLineWidth).toHaveBeenCalledWith(newWidth);
    });

    it(' updateCurrentPosition should call drawLine', () => {
        const expectedResult: Point2d = { x: 10, y: 10 };
        service.lastPoint = { x: 11, y: 11 };
        service.mouseDown = true;
        drawLineSpy = spyOn<any>(service, 'drawLine').and.stub();

        service.updateCurrentPosition(mouseEvent);

        expect(service.lastPoint).toEqual(expectedResult);
        expect(drawLineSpy).toHaveBeenCalled();
    });

    it('should draw a line', () => {
        const path: Point2d[] = [{ x: 10, y: 10 }];
        const beginPathSpy = spyOn<any>(drawingServiceSpy.currentContext, 'beginPath').and.callThrough();
        const lineToMethodSpy = spyOn<any>(drawingServiceSpy.currentContext, 'lineTo').and.callThrough();
        const strokeMethodSpy = spyOn<any>(drawingServiceSpy.currentContext, 'stroke').and.callThrough();

        service['drawLine'](path);

        expect(beginPathSpy).toHaveBeenCalled();
        expect(lineToMethodSpy).toHaveBeenCalled();
        expect(strokeMethodSpy).toHaveBeenCalled();
    });

    it('should draw a circle', () => {
        const point: Point2d = { x: 10, y: 10 };
        const expectedWidth = (service['width'] = 5);
        const beginPathSpy = spyOn<any>(drawingServiceSpy.currentContext, 'beginPath').and.callThrough();
        const arcMethodSpy = spyOn<any>(drawingServiceSpy.currentContext, 'arc').and.callThrough();
        const fillMethodSpy = spyOn<any>(drawingServiceSpy.currentContext, 'fill').and.callThrough();

        service['drawCircle'](point);
        expect(drawingServiceSpy.changeLineWidth).toHaveBeenCalledTimes(2);
        expect(beginPathSpy).toHaveBeenCalled();
        expect(arcMethodSpy).toHaveBeenCalled();
        expect(fillMethodSpy).toHaveBeenCalled();
        expect(service['width']).toEqual(expectedWidth);
    });

    it('should clear Path', () => {
        const expectedPath: Point2d[] = [];
        service['pathData'] = [{ x: 1, y: 1 }];
        service.clearPath();
        expect(service['pathData']).toEqual(expectedPath);
    });
});
