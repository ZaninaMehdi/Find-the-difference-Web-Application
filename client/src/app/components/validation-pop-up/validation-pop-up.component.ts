import { AfterViewInit, Component, ElementRef, HostListener, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MAX_DIFFERENCES, MAX_HEIGHT, MAX_WIDTH, MIN_DIFFERENCES } from '@app/constants';
import { ValidationDialogData } from '@app/interfaces/validation-dialog-data';

@Component({
    selector: 'app-validation-pop-up',
    templateUrl: './validation-pop-up.component.html',
    styleUrls: ['./validation-pop-up.component.scss'],
})
export class ValidationPopUpComponent implements AfterViewInit {
    @ViewChild('canvas', { static: false }) private canvas: ElementRef<HTMLCanvasElement>;
    context: CanvasRenderingContext2D;
    name: string;

    private canvasSize = { height: MAX_HEIGHT, width: MAX_WIDTH };

    constructor(@Inject(MAT_DIALOG_DATA) public data: ValidationDialogData, public dialogRef: MatDialogRef<ValidationPopUpComponent>) {
        this.name = '';
    }

    get width(): number {
        return this.canvasSize.width;
    }

    get height(): number {
        return this.canvasSize.height;
    }

    @HostListener('document:keyup', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') this.createGame();
    }

    ngAfterViewInit(): void {
        this.context = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        if (this.data.canvasData) this.context.drawImage(this.data.canvasData, 0, 0);
    }

    createGame(): void {
        this.data.gameName = this.name;
        this.dialogRef.close(this.data.gameName);
    }

    areDifferencesValid(): boolean {
        return this.data.numberOfDifferences >= MIN_DIFFERENCES && this.data.numberOfDifferences <= MAX_DIFFERENCES;
    }
}
