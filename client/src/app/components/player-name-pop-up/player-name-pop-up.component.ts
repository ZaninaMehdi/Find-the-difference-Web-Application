import { Component, HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-player-name-pop-up',
    templateUrl: './player-name-pop-up.component.html',
    styleUrls: ['./player-name-pop-up.component.scss'],
})
export class PlayerNamePopUpComponent {
    playerName: string;
    constructor(private dialogRef: MatDialogRef<PlayerNamePopUpComponent>) {
        this.playerName = '';
    }

    @HostListener('document:keyup', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') this.enterGame();
    }

    enterGame(): void {
        this.dialogRef.close(this.playerName);
    }
}
