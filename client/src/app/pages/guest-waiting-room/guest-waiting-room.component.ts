import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { GamesListService } from '@app/services/games-list-service/games-list.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-guest-waiting-room',
    templateUrl: './guest-waiting-room.component.html',
    styleUrls: ['./guest-waiting-room.component.scss'],
})
export class GuestWaitingRoomComponent implements OnInit, OnDestroy {
    guestName: string;
    hasGoneBack: boolean;
    isGameDeleted: boolean;
    private multiplayerRoom: ClassicRoom;
    private goBackSubscription: Subscription;
    private refusedGuestSubscription: Subscription;
    private acceptedGuestSubscription: Subscription;
    private guestRoomSubscription: Subscription;
    private deleteSubscription: Subscription;
    private socketSubscription: Subscription;

    constructor(private roomManager: RoomManagerService, private gamesListService: GamesListService) {}

    ngOnInit(): void {
        if (!this.roomManager.isConnected()) {
            this.roomManager.redirection('/selection');
        } else {
            this.roomManager.handleSocket();

            this.goBackSubscription = this.roomManager.goBack.asObservable().subscribe((hasGoneBack: boolean) => {
                this.hasGoneBack = hasGoneBack;
            });

            this.refusedGuestSubscription = this.roomManager.refusedGuest.asObservable().subscribe((removedGuest: GuestPlayer) => {
                if (this.gamesListService.guest.id === removedGuest.id) this.guestName = removedGuest.guestName;
            });

            this.acceptedGuestSubscription = this.roomManager.acceptedGuest.asObservable().subscribe((acceptedGuest: GuestPlayer) => {
                if (this.gamesListService.guest.id !== acceptedGuest.id) this.guestName = acceptedGuest.guestName;
                if (this.gamesListService.guest.id === acceptedGuest.id) {
                    this.roomManager.guestJoinRoom(this.multiplayerRoom);
                }
            });

            this.guestRoomSubscription = this.roomManager.currentGuestRoom.asObservable().subscribe((room: ClassicRoom) => {
                this.multiplayerRoom = room;
            });

            this.deleteSubscription = this.roomManager.isGameDeleted.asObservable().subscribe((value: boolean) => {
                this.isGameDeleted = value;
            });

            this.socketSubscription = this.roomManager.isSocketRemoved.asObservable().subscribe((value: boolean) => {
                if (value) this.guestName = 'removedSocket';
            });
        }
    }

    goBack(): void {
        this.roomManager.connect();
        this.roomManager.refuseGuest(this.gamesListService.guest, this.multiplayerRoom);
        this.roomManager.redirection('/selection');
    }

    ngOnDestroy(): void {
        if (
            this.acceptedGuestSubscription &&
            this.deleteSubscription &&
            this.guestRoomSubscription &&
            this.goBackSubscription &&
            this.refusedGuestSubscription &&
            this.socketSubscription
        ) {
            this.acceptedGuestSubscription.unsubscribe();
            this.deleteSubscription.unsubscribe();
            this.guestRoomSubscription.unsubscribe();
            this.goBackSubscription.unsubscribe();
            this.refusedGuestSubscription.unsubscribe();
            this.socketSubscription.unsubscribe();
        }
    }
}
