import { Component, Input, OnInit } from '@angular/core';
import { DEFAULT_BEST_TIMES } from '@app/constants';
import { GameSheet } from '@app/interfaces/game-sheet';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { DataSharingService } from '@app/services/data-sharing-service/data-sharing.service';
import { GamesListService } from '@app/services/games-list-service/games-list.service';
import { ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-carousel',
    templateUrl: './carousel.component.html',
    styleUrls: ['./carousel.component.scss'],
    providers: [ConfirmationService],
})
export class CarouselComponent implements OnInit {
    @Input() componentName: string;
    customGames: GameSheet[];
    gamesInSlide: GameSheet[][];
    currentSlideIndex: number;
    lastSlideIndex: number;

    // eslint-disable-next-line max-params
    constructor(
        private gamesListService: GamesListService,
        private communicationService: CommunicationService,
        private dataSharingService: DataSharingService,
        private confirmationService: ConfirmationService,
    ) {
        this.customGames = [];
    }

    ngOnInit(): void {
        this.getAllGames();
        this.gamesListService.refreshComponent();
    }

    leftButtonClick() {
        this.currentSlideIndex--;
    }

    rightButtonClick() {
        this.currentSlideIndex++;
    }

    getAllGames() {
        this.communicationService.getGames().subscribe((games: GameSheet[]) => {
            this.customGames = games;
            this.currentSlideIndex = 0;
            this.gamesInSlide = this.gamesListService.createMatrixOfGames(this.customGames);
            this.lastSlideIndex = Object.keys(this.gamesInSlide).length - 1;
            this.dataSharingService.notifyOther(true);
        });
    }

    confirmDeleteGames(event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Êtes vous sûr de vouloir supprimer tous les jeux  définitivement ?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',

            accept: () => {
                this.communicationService.deleteGames().subscribe(() => {
                    this.gamesListService.sendOnDeleteAllGames();
                    this.gamesListService.updateGameSheet();
                    this.dataSharingService.notifyOther(true);
                });
            },
        });
    }

    confirmDeleteBestTimes(event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Êtes vous sûr de vouloir réinitialiser tous les meilleurs temps  définitivement ?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',

            accept: () => {
                this.communicationService.deleteAllBestTimes().subscribe(() => {
                    this.gamesListService.updateGameSheet();
                });
            },
        });
    }

    updateConstantTimes(event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Êtes vous sûr de vouloir réinitialiser toutes les constantes du jeu ?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',

            accept: () => {
                this.communicationService.resetConstants().subscribe(() => {
                    this.gamesListService.updateGameSheet();
                });
            },
        });
    }

    shouldActivateResetBestTimesButton(games: GameSheet[]): boolean {
        for (const game of games) {
            if (
                !this.gamesListService.compareTwoBestTimes(DEFAULT_BEST_TIMES, game.soloBestTimes) ||
                !this.gamesListService.compareTwoBestTimes(DEFAULT_BEST_TIMES, game.multiplayerBestTimes)
            )
                return false;
        }
        return true;
    }
}
