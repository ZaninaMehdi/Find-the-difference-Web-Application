import { Injectable } from '@angular/core';
import { FIRST_INDEX, GAMES_PER_SLIDE, LAST_INDEX } from '@app/constants';
import { BestTimes, GameSheet, ServerGameSheet } from '@app/interfaces/game-sheet';
import { GuestPlayer } from '@app/interfaces/rooms';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';

@Injectable({
    providedIn: 'root',
})
export class GamesListService {
    guest: GuestPlayer;

    constructor(private communicationService: CommunicationService, private roomManager: RoomManagerService) {}

    sortTimes(bestTimes: BestTimes[]) {
        return bestTimes.sort((a, b) => a.time - b.time).slice(FIRST_INDEX, LAST_INDEX);
    }

    createMatrixOfGames(allGames: GameSheet[]): GameSheet[][] {
        return Array.from({ length: Math.ceil(allGames.length / GAMES_PER_SLIDE) }, (_, i) => i).map((i) =>
            allGames.slice(i * GAMES_PER_SLIDE, i * GAMES_PER_SLIDE + GAMES_PER_SLIDE),
        );
    }

    createGame(game: ServerGameSheet): void {
        this.communicationService.getGameNames().subscribe((res) => {
            if (!res.includes(game.name)) {
                this.communicationService.postGame(game).subscribe(() => {
                    this.roomManager.redirection('/admin');
                });
            }
        });
    }
    compareTwoBestTimes(bestTimes1: BestTimes[], bestTimes2: BestTimes[]): boolean {
        return (
            bestTimes1.length === bestTimes2.length &&
            bestTimes1.every((bestTime1) => bestTimes2.some((bestTime2) => bestTime1.name === bestTime2.name && bestTime1.time === bestTime2.time))
        );
    }

    redirectToGame(gameName: string, playerName: string): void {
        this.communicationService.getGame(gameName).subscribe((game) => {
            if (game) {
                this.roomManager.startSoloGame(playerName, game);
            }
        });
    }

    createMultiplayerRoom(hostName: string, gameMode: string, gameName: string): void {
        this.communicationService.getGame(gameName).subscribe((game) => {
            if (game) {
                this.roomManager.connect();
                this.roomManager.createMultiGame(hostName, gameMode, game);
                this.roomManager.redirection('/waiting-room');
            }
        });
    }

    redirectGuest(gameName: string): void {
        this.roomManager.createGuest(this.guest, gameName);
        this.roomManager.redirection('/guest-waiting-room');
    }

    getAvailableRooms(): void {
        this.roomManager.getAvailableRooms();
    }

    sendOnDeleteAllGames(): void {
        this.roomManager.connect();
        this.roomManager.onAllGamesDeleted();
    }

    updateGameSheet(): void {
        this.roomManager.updateGameSheet();
    }

    refreshComponent(): void {
        this.roomManager.isRefreshed.asObservable().subscribe((isRefreshed: boolean) => {
            if (isRefreshed) this.roomManager.onRefresh(window);
        });
    }
}
