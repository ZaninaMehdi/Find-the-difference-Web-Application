/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';
import { ImageAlert } from '@app/interfaces/image-alert';
import { DifferenceDetectorService } from '@app/services/difference-detection-service/difference-detector.service';
import { DrawingService } from '@app/services/drawing-service/drawing.service';
import { EraserService } from '@app/services/eraser-service/eraser.service';
import { ImageService } from '@app/services/image-service/image.service';
import { PencilService } from '@app/services/pencil-service/pencil.service';
import { ImageCanvasComponent } from './image-canvas.component';

describe('ImageCanvasComponent', () => {
    let drawingServiceSpy: jasmine.SpyObj<DrawingService>;
    let imageServiceSpy: ImageService;
    let differenceServiceSpy: DifferenceDetectorService;
    let component: ImageCanvasComponent;
    let fixture: ComponentFixture<ImageCanvasComponent>;
    let originalCtxStub: CanvasRenderingContext2D;
    let pencilServiceSpy: PencilService;
    let eraserServiceSpy: EraserService;

    beforeEach(() => {
        drawingServiceSpy = jasmine.createSpyObj('DrawingService', ['duplicateCanvas', 'swapCanvases', 'resetCanvas', 'changeCurrentContext']);
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImageCanvasComponent],
            providers: [{ provide: DrawingService, useValue: drawingServiceSpy }],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(ImageCanvasComponent);
        component = fixture.componentInstance;
        differenceServiceSpy = TestBed.inject(DifferenceDetectorService);
        imageServiceSpy = TestBed.inject(ImageService);
        pencilServiceSpy = TestBed.inject(PencilService);
        eraserServiceSpy = TestBed.inject(EraserService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set the original canvas area when isMainCanvas is true', () => {
        component.isMainCanvas = true;
        const spySetOriginalContext = spyOn(component, 'setOriginalContext').and.callThrough();
        const spySetModifiableContext = spyOn(component, 'setModifiableContext').and.callThrough();
        const spyResetCanvasBG = spyOn(component, 'resetCanvasBG').and.callThrough();
        component.ngAfterViewInit();
        expect(spySetOriginalContext).toHaveBeenCalled();
        expect(spySetModifiableContext).not.toHaveBeenCalled();
        expect(spyResetCanvasBG).toHaveBeenCalled();
    });

    it('should set the modifiable canvas area when isMainCanvas is false', () => {
        const spySetOriginalContext = spyOn(component, 'setOriginalContext').and.callThrough();
        const spySetModifiableContext = spyOn(component, 'setModifiableContext').and.callThrough();
        const spyResetCanvasBG = spyOn(component, 'resetCanvasBG').and.callThrough();
        const setEventListenersSpy = spyOn(component, 'setEventListeners').and.callThrough();
        component.isMainCanvas = false;
        component.ngAfterViewInit();
        expect(spySetOriginalContext).not.toHaveBeenCalled();
        expect(spySetModifiableContext).toHaveBeenCalled();
        expect(spyResetCanvasBG).toHaveBeenCalled();
        expect(setEventListenersSpy).toHaveBeenCalled();
    });

    it('should call drawingService resetCanvas', () => {
        component.resetCanvasFG();
        expect(drawingServiceSpy.resetCanvas).toHaveBeenCalled();
    });

    it('should call drawingService swapCanvases', () => {
        component.swapCanvasesFG();
        expect(drawingServiceSpy.swapCanvases).toHaveBeenCalled();
    });

    it('should call drawingService duplicateCanvas', () => {
        component.duplicateCanvas();
        expect(drawingServiceSpy.duplicateCanvas).toHaveBeenCalled();
    });

    it('should merge canvases', () => {
        originalCtxStub = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        originalCtxStub.clearRect(0, 0, MAX_WIDTH, MAX_HEIGHT);
        const emptyCanvasData = originalCtxStub.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        const getImgDataSpy1 = spyOn<any>(component.imageContext, 'getImageData').and.callFake(() => {
            return emptyCanvasData;
        });
        const getImgDataSpy2 = spyOn<any>(differenceServiceSpy.context, 'getImageData').and.callFake(() => {
            return emptyCanvasData;
        });
        component.mergeCanvases();
        expect(getImgDataSpy1).toHaveBeenCalled();
        expect(getImgDataSpy2).toHaveBeenCalled();
    });

    it('should display an image on the canvas', async () => {
        const alert: ImageAlert = { error: '', valid: true };
        const image = await fetch('assets/bmp_640.bmp');
        const blob = await image.blob();
        const imageFile = new File([blob], 'image.bmp', blob);
        const mockEvt = { target: { files: [imageFile] } };

        spyOn(component.isDefaultChange, 'emit');
        const spy2 = spyOn(imageServiceSpy, 'displayImage').and.callFake((context: CanvasRenderingContext2D) => {});
        const spy = spyOn(imageServiceSpy, 'validateImage').and.resolveTo(alert);

        component.displayImage(mockEvt as any);
        expect(await spy).toHaveBeenCalledWith(imageFile);
        expect(spy2).toHaveBeenCalled();
        expect(component.isDefaultChange.emit).toHaveBeenCalled();
    });

    it('window onMouseUp should call tool onMouseUpOutside', () => {
        component['currentTool'] = pencilServiceSpy;
        pencilServiceSpy.mouseDown = true;
        component.onMouseUp();
        expect(component['currentTool'].mouseDown).toBe(false);
    });

    it('window onMouseUp should call newAction', () => {
        component['currentTool'] = pencilServiceSpy;
        component['currentTool'].actionStarted = true;
        const newActionSpy = spyOn(component, 'newAction').and.stub();
        component.onMouseUp();
        expect(newActionSpy).toHaveBeenCalled();
    });

    it('window onMouseDown should call setDrawingContext', () => {
        const setDrawingContextSpy = spyOn(component, 'setDrawingContext').and.stub();
        component.onMouseDown();
        expect(setDrawingContextSpy).toHaveBeenCalled();
    });

    it('onKeyDown should call undo or redo if we enter Ctrl+Z or Ctrl+Shift+Z', () => {
        const ctrlZEvent: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: false, key: 'z' });
        const ctrlShiftZEvent: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'z' });
        component.isUndoDisabled = false;
        component.isRedoDisabled = false;
        const redoSpy = spyOn(component, 'redo').and.stub();
        const undoSpy = spyOn(component, 'undo').and.stub();
        component.onKeyDown(ctrlZEvent);
        expect(undoSpy).toHaveBeenCalled();
        component.onKeyDown(ctrlShiftZEvent);
        expect(redoSpy).toHaveBeenCalled();
    });

    it('onKeyDown should not call undo nor redo if we enter a wrong key', () => {
        const wrongKey: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: false, key: 'k' });
        component.isUndoDisabled = false;
        component.isRedoDisabled = false;
        const redoSpy = spyOn(component, 'redo').and.stub();
        const undoSpy = spyOn(component, 'undo').and.stub();
        component.onKeyDown(wrongKey);
        expect(undoSpy).not.toHaveBeenCalled();
        expect(redoSpy).not.toHaveBeenCalled();
    });

    it('checkCtrlShiftZ should return true if we enter ctrl+shift+z or ctrl+shift+Z and false otherwise', () => {
        const goodEntry1: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'z' });
        const goodEntry2: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'Z' });
        const badEntry: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: true, key: 'r' });

        expect(component.checkCtrlShiftZ(goodEntry1)).toBe(true);
        expect(component.checkCtrlShiftZ(goodEntry2)).toBe(true);
        expect(component.checkCtrlShiftZ(badEntry)).toBe(false);
    });

    it('checkCtrlZ should return true if we enter ctrl+z or ctrl+Z and false otherwise', () => {
        const goodEntry1: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: false, key: 'z' });
        const goodEntry2: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: true, shiftKey: false, key: 'Z' });
        const badEntry: KeyboardEvent = new KeyboardEvent('keydown', { ctrlKey: false, shiftKey: true, key: 'r' });

        expect(component.checkCtrlZ(goodEntry1)).toBe(true);
        expect(component.checkCtrlZ(goodEntry2)).toBe(true);
        expect(component.checkCtrlZ(badEntry)).toBe(false);
    });

    it('should receive the mousedown event on canvas', () => {
        component['currentTool'] = pencilServiceSpy;
        const onMouseDownSpy = spyOn(component['currentTool'], 'onMouseDown').and.stub();
        const setDrawingContextSpy = spyOn(component, 'setDrawingContext').and.stub();
        component.isEraserWidthShown = component.isPencilWidthShown = true;
        component.isPencil = component.isEraser = false;
        component.setEventListeners();
        component['canvasFG'].nativeElement.dispatchEvent(new MouseEvent('mousedown'));
        expect(setDrawingContextSpy).toHaveBeenCalled();
        expect(component.isEraserWidthShown || component.isPencilWidthShown).toBe(false);
        expect(onMouseDownSpy).not.toHaveBeenCalled();
        component.isPencil = true;
        component['canvasFG'].nativeElement.dispatchEvent(new MouseEvent('mousedown'));
        expect(onMouseDownSpy).toHaveBeenCalled();
    });

    it('should receive the mousemove event on canvas', () => {
        component['currentTool'] = pencilServiceSpy;
        const onMouseMoveSpy = spyOn(component['currentTool'], 'onMouseMove').and.stub();
        const onTheCorrectCanvasSpy = spyOn(component, 'onTheCorrectCanvas').and.callFake(() => {
            return true;
        });
        component.setEventListeners();
        component['canvasFG'].nativeElement.dispatchEvent(new MouseEvent('mousemove'));
        expect(onMouseMoveSpy).toHaveBeenCalled();
        expect(onTheCorrectCanvasSpy).toHaveBeenCalled();
    });

    it('should receive the mouseup event on canvas', () => {
        component['currentTool'] = pencilServiceSpy;
        const onMouseUpSpy = spyOn(component['currentTool'], 'onMouseUp').and.stub();
        const onTheCorrectCanvasSpy = spyOn(component, 'onTheCorrectCanvas').and.callFake(() => {
            return true;
        });
        component.setEventListeners();
        component['canvasFG'].nativeElement.dispatchEvent(new MouseEvent('mouseup'));
        expect(onMouseUpSpy).toHaveBeenCalled();
        expect(onTheCorrectCanvasSpy).toHaveBeenCalled();
    });

    it('onTheCorrectCanvas should return true if we are on the mainCanvas', () => {
        component.isMainCanvas = true;
        component['drawingService'].currentContext = component['drawingService'].originalContextForeground;
        expect(component.onTheCorrectCanvas()).toBe(true);
        component.isMainCanvas = false;
        expect(component.onTheCorrectCanvas()).toBe(false);
        component['drawingService'].currentContext = component['drawingService'].modifiableContextForeground;
        expect(component.onTheCorrectCanvas()).toBe(true);
        component.isMainCanvas = true;
        expect(component.onTheCorrectCanvas()).toBe(false);
    });

    it('setDrawingContext should set the correct drawingContext', () => {
        component.isMainCanvas = true;
        component.setDrawingContext();
        expect(component['drawingService'].currentContext).toEqual(component['drawingService'].originalContextForeground);
        component.isMainCanvas = false;
        component.setDrawingContext();
        expect(component['drawingService'].currentContext).toEqual(component['drawingService'].modifiableContextForeground);
    });

    it('selectPencil should select pencil', () => {
        component['tools'] = [pencilServiceSpy, eraserServiceSpy];
        const width: number = (component.pencilWidth = 5);
        const changePencilWidthSpy = spyOn(component, 'changePencilWidth').and.stub();
        component.selectPencil();
        expect(component['currentTool']).toEqual(pencilServiceSpy);
        expect(component.isPencilWidthShown).toBe(true);
        expect(component.isPencil).toBe(true);
        expect(component.isEraser).toBe(false);
        expect(changePencilWidthSpy).toHaveBeenCalledWith(width);
    });

    it('selectEraser should select eraser', () => {
        component['tools'] = [pencilServiceSpy, eraserServiceSpy];
        const width: number = (component.eraserWidth = 5);
        const changeEraserWidthSpy = spyOn(component, 'changeEraserWidth').and.stub();
        component.selectEraser();
        expect(component['currentTool']).toEqual(eraserServiceSpy);
        expect(component.isEraserWidthShown).toBe(true);
        expect(component.isPencil).toBe(false);
        expect(component.isEraser).toBe(true);
        expect(changeEraserWidthSpy).toHaveBeenCalledWith(width);
    });

    it('changePencilWidth should call pencilService changeWidth', () => {
        const width = 10;
        const changeWidthSpy = spyOn(component['pencilService'], 'changeWidth').and.stub();
        component.pencilWidth = 3;
        component.changePencilWidth(width);
        expect(component.pencilWidth).toBe(width);
        expect(changeWidthSpy).toHaveBeenCalledWith(width);
    });

    it('changeEraserWidth should call eraserService changeWidth', () => {
        const width = 10;
        const changeWidthSpy = spyOn(component['eraserService'], 'changeWidth').and.stub();
        component.eraserWidth = 3;
        component.changeEraserWidth(width);
        expect(component.eraserWidth).toBe(width);
        expect(changeWidthSpy).toHaveBeenCalledWith(width);
    });

    it('closePencilSlider should change showPencilWidth to false', () => {
        component.isPencilWidthShown = true;
        component.closePencilSlider();
        expect(component.isPencilWidthShown).toBe(false);
    });

    it('closeEraserSlider should change showEraserWidth to false', () => {
        component.isEraserWidthShown = true;
        component.closeEraserSlider();
        expect(component.isEraserWidthShown).toBe(false);
    });

    it('undo should call the undoAndUpdateContext for the correct canvas', () => {
        component.isMainCanvas = true;
        component['drawingService'].currentContext = component['drawingService'].originalContextForeground;
        const undoAndUpdateContextSpy = spyOn<any>(component, 'undoAndUpdateContext').and.stub();
        component.undo();
        expect(undoAndUpdateContextSpy).toHaveBeenCalledWith(true);
        component.isMainCanvas = false;
        component['drawingService'].currentContext = component['drawingService'].modifiableContextForeground;
        component.undo();
        expect(undoAndUpdateContextSpy).toHaveBeenCalledWith(false);
    });

    it('redo should call the undoAndUpdateContext for the correct canvas', () => {
        component.isMainCanvas = true;
        component['drawingService'].currentContext = component['drawingService'].originalContextForeground;
        const redoAndUpdateContextSpy = spyOn<any>(component, 'redoAndUpdateContext').and.stub();
        component.redo();
        expect(redoAndUpdateContextSpy).toHaveBeenCalledWith(true);
        component.isMainCanvas = false;
        component['drawingService'].currentContext = component['drawingService'].modifiableContextForeground;
        component.redo();
        expect(redoAndUpdateContextSpy).toHaveBeenCalledWith(false);
    });

    it('undoAndUpdateCOntext should update the context', () => {
        component.drawingContext = CanvasTestHelper.createCanvas(2, 2).getContext('2d') as CanvasRenderingContext2D;
        const array: Uint8ClampedArray = new Uint8ClampedArray([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1]);
        const expectedImageData: ImageData = new ImageData(array, 2, 2);
        component.drawingContext.putImageData(expectedImageData, 0, 0);
        const undoSpy = spyOn(component['undoRedoService'], 'undo').and.callFake(() => {
            return expectedImageData;
        });
        const putImageDataSpy = spyOn(component.drawingContext, 'putImageData').and.callThrough();
        const checkUndoRedoStacksSpy = spyOn(component, 'checkUndoRedoStacks').and.stub();
        component['undoAndUpdateContext'](true);
        expect(undoSpy).toHaveBeenCalled();
        expect(component.drawingContext.getImageData(0, 0, 2, 2)).toEqual(expectedImageData);
        expect(checkUndoRedoStacksSpy).toHaveBeenCalledWith(true);
        expect(putImageDataSpy).toHaveBeenCalled();
    });

    it('redoAndUpdateCOntext should update the context', () => {
        component.drawingContext = CanvasTestHelper.createCanvas(2, 2).getContext('2d') as CanvasRenderingContext2D;
        const array: Uint8ClampedArray = new Uint8ClampedArray([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1]);
        const expectedImageData: ImageData = new ImageData(array, 2, 2);
        component.drawingContext.putImageData(expectedImageData, 0, 0);
        const redoSpy = spyOn(component['undoRedoService'], 'redo').and.callFake(() => {
            return expectedImageData;
        });
        const putImageDataSpy = spyOn(component.drawingContext, 'putImageData').and.callThrough();
        const checkUndoRedoStacksSpy = spyOn(component, 'checkUndoRedoStacks').and.stub();
        component['redoAndUpdateContext'](false);
        expect(redoSpy).toHaveBeenCalled();
        expect(component.drawingContext.getImageData(0, 0, 2, 2)).toEqual(expectedImageData);
        expect(checkUndoRedoStacksSpy).toHaveBeenCalledWith(false);
        expect(putImageDataSpy).toHaveBeenCalled();
    });

    it('should call pencilService changeColor with the right color', () => {
        const mockEvt = { target: { value: '#00000F' } };
        const changeColorSpy = spyOn(component['pencilService'], 'changeColor').and.stub();
        component.changeColor(mockEvt as any);
        expect(changeColorSpy).toHaveBeenCalledWith(mockEvt.target.value);
    });

    it('should clear pencil path while mouseDown outside the canvas', () => {
        component['currentTool'].mouseDown = true;
        const getPositionFromMouseSpy = spyOn(component['currentTool'], 'getPositionFromMouse').and.callFake(() => {
            return { x: 0, y: -1 };
        });
        component.isPencil = true;
        const clearPathPencilSpy = spyOn(component['pencilService'], 'clearPath').and.stub();

        component.onMouseMove();

        expect(getPositionFromMouseSpy).toHaveBeenCalled();
        expect(clearPathPencilSpy).toHaveBeenCalled();
    });

    it('should clear pencil path while mouseDown outside the canvas', () => {
        component['currentTool'].mouseDown = true;
        const getPositionFromMouseSpy = spyOn(component['currentTool'], 'getPositionFromMouse').and.callFake(() => {
            return { x: 0, y: -1 };
        });
        component.isEraser = true;
        const clearPathEraserSpy = spyOn(component['eraserService'], 'clearPath').and.stub();

        component.onMouseMove();

        expect(getPositionFromMouseSpy).toHaveBeenCalled();
        expect(clearPathEraserSpy).toHaveBeenCalled();
    });
});
