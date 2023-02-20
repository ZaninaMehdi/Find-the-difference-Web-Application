import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { Tool } from '@app/classes/tool';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';
import { ImageAlert } from '@app/interfaces/image-alert';
import { Point2d } from '@app/interfaces/point2d';
import { DifferenceDetectorService } from '@app/services/difference-detection-service/difference-detector.service';
import { DrawingService } from '@app/services/drawing-service/drawing.service';
import { EraserService } from '@app/services/eraser-service/eraser.service';
import { ImageService } from '@app/services/image-service/image.service';
import { PencilService } from '@app/services/pencil-service/pencil.service';
import { UndoRedoService } from '@app/services/undo-redo-service/undo-redo.service';

@Component({
    selector: 'app-image-canvas',
    templateUrl: './image-canvas.component.html',
    styleUrls: ['./image-canvas.component.scss'],
    providers: [PencilService, EraserService],
})
export class ImageCanvasComponent implements AfterViewInit {
    @Input() isMainCanvas: boolean;
    @Input() height: number;
    @Input() width: number;
    @Input() isDefault: boolean;
    @Output() isDefaultChange: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() alert = new EventEmitter<ImageAlert>();
    @ViewChild('canvasFG', { static: false }) private canvasFG!: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvasBG', { static: false }) private canvasBG!: ElementRef<HTMLCanvasElement>;
    @ViewChild('invisibleCanvas', { static: false }) private invisibleCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild('selectedImage', { static: false }) private selectedImage: ElementRef<HTMLInputElement>;

    imageContext: CanvasRenderingContext2D;
    drawingContext: CanvasRenderingContext2D;
    pencilWidth: number;
    eraserWidth: number;
    isPencil: boolean;
    isPencilWidthShown: boolean;
    isEraserWidthShown: boolean;
    isUndoDisabled: boolean;
    isRedoDisabled: boolean;
    isEraser: boolean;
    private currentTool: Tool;
    private tools: Tool[];

    // Disabled the max-params lint error, all the services are needed to apply drawing functionality to the canvases
    // eslint-disable-next-line max-params
    constructor(
        private imageService: ImageService,
        private drawingService: DrawingService,
        private differenceService: DifferenceDetectorService,
        private pencilService: PencilService,
        private eraserService: EraserService,
        private undoRedoService: UndoRedoService,
    ) {
        this.drawingService.isMainCanvas = this.isMainCanvas;
        this.tools = [this.pencilService, this.eraserService];
        this.pencilWidth = this.pencilService.width;
        this.eraserWidth = this.eraserService.width;
        this.isPencil = this.currentTool === this.pencilService;
        this.isEraser = this.currentTool === this.eraserService;
        this.currentTool = this.tools[0];
        this.isRedoDisabled = this.isUndoDisabled = true;
        this.isEraserWidthShown = this.isPencilWidthShown = false;
    }

    @HostListener('window:mouseup', ['$event'])
    onMouseUp(): void {
        if (this.currentTool) {
            this.currentTool.onMouseUpOutside();

            if (this.currentTool.actionStarted) {
                this.newAction(this.drawingService.currentContext === this.drawingService.originalContextForeground);
            }
        }
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(): void {
        this.setDrawingContext();
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(): void {
        const mouseEvent = new MouseEvent('$event');
        if (this.currentTool.mouseDown) {
            const currentPosition: Point2d = this.currentTool.getPositionFromMouse(mouseEvent);
            if (currentPosition.x > MAX_WIDTH || currentPosition.y > MAX_HEIGHT || currentPosition.x < 0 || currentPosition.y < 0) {
                if (this.isPencil) this.pencilService.clearPath();
                if (this.isEraser) this.eraserService.clearPath();
            }
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (this.checkCtrlShiftZ(event) && !this.isRedoDisabled) this.redo();
        else if (this.checkCtrlZ(event) && !this.isUndoDisabled) this.undo();
    }

    checkCtrlShiftZ(event: KeyboardEvent): boolean {
        return event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z';
    }

    checkCtrlZ(event: KeyboardEvent): boolean {
        return event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z';
    }

    ngAfterViewInit(): void {
        if (this.isMainCanvas) {
            this.setOriginalContext();
        } else {
            this.setModifiableContext();
        }
        this.differenceService.context = this.invisibleCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.resetCanvasBG();
        this.setEventListeners();
        this.undoRedoService.setup(this.drawingContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT));
    }

    setModifiableContext(): void {
        this.imageContext = this.imageService.modifiableContextBackground = this.canvasBG.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.drawingContext =
            this.drawingService.modifiableContextForeground =
            this.drawingService.currentContext =
                this.canvasFG.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    }

    setOriginalContext(): void {
        this.imageContext = this.imageService.originalContextBackground = this.canvasBG.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.drawingContext =
            this.drawingService.originalContextForeground =
            this.drawingService.currentContext =
                this.canvasFG.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    }

    setEventListeners(): void {
        this.canvasFG.nativeElement.addEventListener('mousedown', (event: MouseEvent) => {
            this.isPencilWidthShown = this.isEraserWidthShown = false;
            this.setDrawingContext();
            if (this.isPencil || this.isEraser) this.currentTool.onMouseDown(event);
        });
        this.canvasFG.nativeElement.addEventListener('mousemove', (event: MouseEvent) => {
            if (this.currentTool && this.onTheCorrectCanvas()) this.currentTool.onMouseMove(event);
        });
        this.canvasFG.nativeElement.addEventListener('mouseup', (event: MouseEvent) => {
            if (this.currentTool && this.onTheCorrectCanvas()) this.currentTool.onMouseUp(event);
        });
    }

    onTheCorrectCanvas(): boolean {
        return (
            (this.isMainCanvas && this.drawingService.currentContext === this.drawingService.originalContextForeground) ||
            (!this.isMainCanvas && this.drawingService.currentContext === this.drawingService.modifiableContextForeground)
        );
    }

    setDrawingContext(): void {
        this.drawingService.currentContext = this.isMainCanvas
            ? this.drawingService.originalContextForeground
            : this.drawingService.modifiableContextForeground;
    }

    displayImage(event: Event): void {
        const target = event.target as HTMLInputElement;
        const files = target.files as FileList;
        this.imageService.validateImage(files[0]).then((alert) => {
            this.alert.emit(alert);
            if (alert.valid) {
                this.imageService.displayImage(this.imageContext);
                this.isDefaultChange.emit(false);
            }
        });
    }

    selectPencil(): void {
        this.currentTool = this.tools[0];
        this.isPencilWidthShown = true;
        this.isEraserWidthShown = false;
        this.isPencil = true;
        this.isEraser = false;
        this.changePencilWidth(this.pencilWidth);
    }

    selectEraser(): void {
        this.currentTool = this.tools[1];
        this.isEraserWidthShown = true;
        this.isPencilWidthShown = false;
        this.isEraser = true;
        this.isPencil = false;
        this.changeEraserWidth(this.eraserWidth);
    }

    changeColor(event: Event): void {
        this.pencilService.changeColor((event.target as HTMLInputElement).value);
    }

    changePencilWidth(newWidth: number): void {
        this.pencilService.changeWidth(newWidth);
        this.pencilWidth = newWidth;
    }

    changeEraserWidth(newWidth: number): void {
        this.eraserService.changeWidth(newWidth);
        this.eraserWidth = newWidth;
    }

    closePencilSlider(): void {
        this.isPencilWidthShown = false;
    }

    closeEraserSlider(): void {
        this.isEraserWidthShown = false;
    }

    resetCanvasFG(): void {
        this.drawingService.resetCanvas(this.drawingContext);
        this.newAction(this.isMainCanvas);
    }

    resetCanvasBG(): void {
        this.isDefaultChange.emit(true);
        this.imageContext.fillStyle = 'white';
        this.isEraser = false;
        this.isPencil = false;
        this.imageContext.fillRect(0, 0, this.width, this.height);
        this.selectedImage.nativeElement.value = '';
    }

    swapCanvasesFG(): void {
        this.drawingService.swapCanvases();
        this.newAction(this.isMainCanvas);
        this.drawingService.changeCurrentContext();
        this.newAction(!this.isMainCanvas);
        this.drawingService.changeCurrentContext();
    }

    duplicateCanvas(): void {
        this.drawingService.duplicateCanvas(this.isMainCanvas);
        this.newAction(!this.isMainCanvas);
    }

    undo(): void {
        if (this.drawingService.currentContext === this.drawingService.originalContextForeground && this.isMainCanvas) {
            this.undoAndUpdateContext(true);
        } else if (this.drawingService.currentContext === this.drawingService.modifiableContextForeground && !this.isMainCanvas) {
            this.undoAndUpdateContext(false);
        }
    }

    redo(): void {
        if (this.drawingService.currentContext === this.drawingService.originalContextForeground && this.isMainCanvas) {
            this.redoAndUpdateContext(true);
        } else if (this.drawingService.currentContext === this.drawingService.modifiableContextForeground && !this.isMainCanvas) {
            this.redoAndUpdateContext(false);
        }
    }
    newAction(isCorrectCanvas: boolean): void {
        this.undoRedoService.newAction(this.drawingService.currentContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT), isCorrectCanvas);
        this.currentTool.actionStarted = false;
        this.checkUndoRedoStacks(isCorrectCanvas);
    }

    checkUndoRedoStacks(isCorrectCanvas: boolean): void {
        this.isUndoDisabled = this.undoRedoService.checkUndoStack(isCorrectCanvas);
        this.isRedoDisabled = this.undoRedoService.checkRedoStack(isCorrectCanvas);
    }

    mergeCanvases(): ImageData {
        this.differenceService.context.putImageData(this.imageContext.getImageData(0, 0, this.width, this.height), 0, 0);
        this.differenceService.context.drawImage(this.drawingContext.canvas, 0, 0);
        const imageData = this.differenceService.context.getImageData(0, 0, this.width, this.height);
        this.differenceService.context.clearRect(0, 0, this.width, this.height);
        return imageData;
    }

    private undoAndUpdateContext(isMainCanvas: boolean): void {
        this.drawingContext.putImageData(this.undoRedoService.undo(isMainCanvas), 0, 0);
        this.checkUndoRedoStacks(isMainCanvas);
    }

    private redoAndUpdateContext(isMainCanvas: boolean) {
        this.drawingContext.putImageData(this.undoRedoService.redo(isMainCanvas), 0, 0);
        this.checkUndoRedoStacks(isMainCanvas);
    }
}
