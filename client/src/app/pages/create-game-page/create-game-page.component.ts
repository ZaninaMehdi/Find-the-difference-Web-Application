import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageCanvasComponent } from '@app/components/image-canvas/image-canvas.component';
import { ValidationPopUpComponent } from '@app/components/validation-pop-up/validation-pop-up.component';
import { MAX_HEIGHT, MAX_WIDTH, RADIUS_DEFAULT_VALUE, RADIUS_VALUES } from '@app/constants';
import { ServerGameSheet } from '@app/interfaces/game-sheet';
import { ImageAlert } from '@app/interfaces/image-alert';
import { Point2d } from '@app/interfaces/point2d';
import { ValidationDialogData } from '@app/interfaces/validation-dialog-data';
import { DifferenceDetectorService } from '@app/services/difference-detection-service/difference-detector.service';
import { GamesListService } from '@app/services/games-list-service/games-list.service';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent {
    @ViewChild('originalCanvas', { static: false }) private mainCanvasArea!: ImageCanvasComponent;
    @ViewChild('modifiableCanvas', { static: false }) private modifiableCanvasArea!: ImageCanvasComponent;

    isOriginalDefault: boolean = true;
    isModifiedDefault: boolean = true;
    isEmptyName: boolean = true;
    alert: ImageAlert = { error: '', valid: true };
    radius: number = RADIUS_DEFAULT_VALUE;
    readonly radiusValues: number[] = RADIUS_VALUES;
    private isMainCanvas: boolean = true;
    private canvasSize = { height: MAX_HEIGHT, width: MAX_WIDTH };

    constructor(public validateDialog: MatDialog, private differenceService: DifferenceDetectorService, private gameListService: GamesListService) {}

    get mainCanvas(): boolean {
        return this.isMainCanvas;
    }

    get width(): number {
        return this.canvasSize.width;
    }

    get height(): number {
        return this.canvasSize.height;
    }

    displayBothCanvases(event: Event): void {
        this.mainCanvasArea.displayImage(event);
        this.modifiableCanvasArea.displayImage(event);
        this.isOriginalDefault = this.isModifiedDefault = false;
    }

    closeAlert(): void {
        this.alert.valid = true;
        this.alert.error = '';
    }

    handleAlert(event: ImageAlert): void {
        this.alert = event;
        if (!this.alert.valid) this.isOriginalDefault = this.isModifiedDefault = true;
    }

    openValidateDialog(): void {
        const differences: Point2d[][] = this.differenceService.detectAndDrawDifferences(
            this.mainCanvasArea.mergeCanvases(),
            this.modifiableCanvasArea.mergeCanvases(),
            this.radius,
        );
        this.validateDialog
            .open(ValidationPopUpComponent, {
                data: {
                    numberOfDifferences: differences.length,
                    canvasData: this.differenceService.context.canvas,
                } as ValidationDialogData,
                disableClose: true,
            })
            .afterClosed()
            .subscribe((gameName) => {
                if (gameName && gameName.trim().length > 0) {
                    this.isEmptyName = false;
                    this.mainCanvasArea.imageContext.putImageData(this.mainCanvasArea.mergeCanvases(), 0, 0);
                    this.modifiableCanvasArea.imageContext.putImageData(this.modifiableCanvasArea.mergeCanvases(), 0, 0);
                    const game: ServerGameSheet = {
                        originalLink: this.mainCanvasArea.imageContext.canvas.toDataURL(),
                        modifiedLink: this.modifiableCanvasArea.imageContext.canvas.toDataURL(),
                        differenceCounter: differences.length,
                        differenceLocations: differences,
                        name: gameName,
                    };

                    this.gameListService.createGame(game);
                }
            });
    }
}
