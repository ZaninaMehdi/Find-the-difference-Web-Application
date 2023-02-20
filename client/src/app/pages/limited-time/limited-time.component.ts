import { Component, OnDestroy, OnInit } from '@angular/core';
import { GameData } from '@app/interfaces/game-sheet';
import { ClassicRoom } from '@app/interfaces/rooms';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-limited-time',
    templateUrl: './limited-time.component.html',
    styleUrls: ['./limited-time.component.scss'],
})
export class LimitedTimeComponent implements OnInit, OnDestroy {
    playerName: string;
    currentAvailableRoom: ClassicRoom;
    goBackLimited: boolean;
    games: GameData[];
    isLimitedRoomCreated: boolean;
    private availableRooms: ClassicRoom[];
    private communicationSubscription: Subscription;
    private roomSubscription: Subscription;
    private goBackSubscription: Subscription;
    private gameCreatedSubscription: Subscription;

    constructor(
        private roomManager: RoomManagerService,
        private communicationService: CommunicationService,
        private limitedManager: LimitedTimeService,
    ) {
        this.playerName = '';
        this.games = [];
        this.isLimitedRoomCreated = false;
    }

    ngOnInit(): void {
        this.communicationSubscription = this.communicationService.getAllGames().subscribe((games: GameData[]) => {
            this.games = games;
        });

        this.roomManager.connect();
        this.roomManager.handleSocket();
        this.roomManager.getAvailableLimitedModerooms();

        this.roomSubscription = this.roomManager.availableRoomsEvent.asObservable().subscribe((rooms: ClassicRoom[]) => {
            this.availableRooms = rooms;
        });

        this.gameCreatedSubscription = this.roomManager.isCreated.asObservable().subscribe((isCreated: boolean) => {
            this.isLimitedRoomCreated = isCreated;
        });

        this.goBackSubscription = this.roomManager.goBackLimited.asObservable().subscribe((goBackLimited: boolean) => {
            this.goBackLimited = goBackLimited;
        });
    }

    ngOnDestroy(): void {
        this.communicationSubscription.unsubscribe();
        this.goBackSubscription.unsubscribe();
        this.roomSubscription.unsubscribe();
        this.gameCreatedSubscription.unsubscribe();
    }

    isAvailableRoom(): boolean | void {
        if (this.availableRooms) return this.availableRooms.length > 0;
    }

    goBack(): void {
        this.limitedManager.isLimitedTimeGame.next(false);
        this.roomManager.redirection('/home');
    }

    createSoloGame(): void {
        this.roomManager.connect();
        this.roomManager.createLimitedSolo(this.playerName, this.games);
    }

    createMultiGame(): void {
        this.roomManager.connect();
        this.roomManager.createLimitedMulti(this.playerName, this.games);
    }

    joinMultiGame(): void {
        this.roomManager.connect();
        this.roomManager.redirectGuest(this.playerName);
    }
}
