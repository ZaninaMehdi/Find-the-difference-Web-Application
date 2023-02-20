import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayerNamePopUpComponent } from '@app/components/player-name-pop-up/player-name-pop-up.component';
import { DEFAULT_BEST_TIMES } from '@app/constants';
import { BestTimes, GameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom } from '@app/interfaces/rooms';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { GamesListService } from '@app/services/games-list-service/games-list.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-sheet',
    templateUrl: './game-sheet.component.html',
    styleUrls: ['./game-sheet.component.scss'],
    providers: [ConfirmationService],
})
export class GameSheetComponent implements OnInit, OnDestroy {
    @Input() game: GameSheet;
    @Input() componentName: string;
    sortedSoloGame: BestTimes[];
    sortedMultiplayerGame: BestTimes[];
    private availableRooms: ClassicRoom[];
    private availableRoomsSubscription: Subscription;

    // The last 3 services are needed to refresh the component instead of reloading the page once a game is deleted
    // hence the disabled lint (long parameter list lint error)
    // eslint-disable-next-line max-params
    constructor(
        private gamesListService: GamesListService,
        private playerNameDialog: MatDialog,
        private roomManager: RoomManagerService,
        private communicationService: CommunicationService,
        private confirmationService: ConfirmationService,
    ) {}

    ngOnInit(): void {
        this.roomManager.connect();
        this.roomManager.handleSocket();

        this.gamesListService.getAvailableRooms();

        this.availableRoomsSubscription = this.roomManager.availableRoomsEvent.asObservable().subscribe((rooms: ClassicRoom[]) => {
            this.availableRooms = rooms;
        });

        if (this.game) {
            this.sortedSoloGame = this.gamesListService.sortTimes(this.game.soloBestTimes);
            this.sortedMultiplayerGame = this.gamesListService.sortTimes(this.game.multiplayerBestTimes);
        }
    }

    isAvailableRoom(): boolean {
        if (
            this.availableRooms?.length > 0 &&
            this.availableRooms.find((room) => room.game.gameSheet.name === this.game.name && room.gameMode === 'Classic 1v1')
        )
            return true;
        else return false;
    }

    play(): void {
        this.playerNameDialog
            .open(PlayerNamePopUpComponent, { disableClose: true })
            .afterClosed()
            .subscribe((playerName: string) => {
                if (playerName.trim().length > 0) this.gamesListService.redirectToGame(this.game.name, playerName);
            });
    }

    createMultiplayerGame(): void {
        this.playerNameDialog
            .open(PlayerNamePopUpComponent, { disableClose: true })
            .afterClosed()
            .subscribe((hostName: string) => {
                if (hostName.trim().length > 0) {
                    this.gamesListService.createMultiplayerRoom(hostName, 'Classic 1v1', this.game.name);
                }
            });
    }

    joinMultiplayerGame(): void {
        this.playerNameDialog
            .open(PlayerNamePopUpComponent, { disableClose: true })
            .afterClosed()
            .subscribe((guestName: string) => {
                if (guestName && guestName.trim().length > 0) {
                    this.gamesListService.guest = { id: this.roomManager.getSocketId(), guestName };
                    this.gamesListService.redirectGuest(this.game.name);
                }
            });
    }

    confirmDeleteGame(event: Event): void {
        this.confirmationService.confirm({
            target: (event as Event).target as EventTarget,
            message: `Êtes vous sûr de vouloir supprimer ${this.game.name} définitivement ?`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',

            accept: () => {
                this.communicationService.getGameNames().subscribe((names: string[]) => {
                    if (names.length === 1) this.roomManager.onAllGamesDeleted();
                });
                this.communicationService.deleteGame(this.game.name).subscribe(() => {
                    this.roomManager.sendOnDelete(this.game);
                    this.gamesListService.updateGameSheet();
                });
            },
        });
    }

    shouldActivateResetButton(): boolean {
        return (
            this.gamesListService.compareTwoBestTimes(DEFAULT_BEST_TIMES, this.game.soloBestTimes) &&
            this.gamesListService.compareTwoBestTimes(DEFAULT_BEST_TIMES, this.game.multiplayerBestTimes)
        );
    }

    deleteBestTimes(): void {
        this.communicationService.deleteBestTimes(this.game.name).subscribe(() => {
            this.gamesListService.updateGameSheet();
        });
    }

    ngOnDestroy(): void {
        if (this.availableRoomsSubscription) this.availableRoomsSubscription.unsubscribe();
    }
}
