import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-waiting-room',
    templateUrl: './waiting-room.component.html',
    styleUrls: ['./waiting-room.component.scss'],
})
export class WaitingRoomComponent implements OnInit, OnDestroy {
    isGameDeleted: boolean;
    isLimitedGame: boolean;
    guestPlayers: GuestPlayer[];
    private createdRoom: ClassicRoom;
    private roomInfoSubscription: Subscription;
    private guestNamesSubscription: Subscription;
    private deleteSubscription: Subscription;
    private limitedRoomSubscription: Subscription;
    private limitedSubscription: Subscription;

    constructor(private roomManager: RoomManagerService, private limitedManager: LimitedTimeService) {}

    ngOnInit(): void {
        if (!this.roomManager.isConnected()) {
            this.roomManager.redirection('/selection');
        } else {
            this.limitedSubscription = this.limitedManager.isLimitedTimeGame.asObservable().subscribe((isLimitedGame: boolean) => {
                this.isLimitedGame = isLimitedGame;
            });

            this.roomInfoSubscription = this.roomManager.getRoomInfo().subscribe((room: ClassicRoom) => {
                this.createdRoom = room;
            });

            if (this.isLimitedGame) {
                this.limitedRoomSubscription = this.limitedManager.getRoomInfo().subscribe((room: ClassicRoom) => {
                    this.createdRoom = room;
                });
            }

            this.guestNamesSubscription = this.roomManager.guestNames.asObservable().subscribe((names: GuestPlayer[]) => {
                this.guestPlayers = names;
            });

            this.deleteSubscription = this.roomManager.isGameDeleted.asObservable().subscribe((isGameDeleted: boolean) => {
                this.isGameDeleted = isGameDeleted;
            });
        }
    }

    acceptGuestPlayer(guest: GuestPlayer): void {
        this.roomManager.connect();
        this.roomManager.joinGuest(guest, this.createdRoom);
    }

    refuseGuestPlayer(guest: GuestPlayer): void {
        this.roomManager.connect();
        this.roomManager.refuseGuest(guest, this.createdRoom);
    }

    goBack(): void {
        if (this.isLimitedGame) {
            this.roomManager.deleteLimitedRoom(this.createdRoom);
            this.limitedManager.isLimitedTimeGame.next(false);
            this.roomManager.redirection('/home');
        } else {
            this.roomManager.removeGuests(this.createdRoom);
            this.roomManager.deleteRoom(this.createdRoom);
            this.roomManager.redirection('/selection');
        }
    }

    ngOnDestroy(): void {
        if (this.deleteSubscription && this.guestNamesSubscription && this.roomInfoSubscription) {
            this.deleteSubscription.unsubscribe();
            this.guestNamesSubscription.unsubscribe();
            this.roomInfoSubscription.unsubscribe();
        }

        if (this.limitedSubscription) this.limitedSubscription.unsubscribe();
        if (this.limitedRoomSubscription) this.limitedRoomSubscription.unsubscribe();
    }
}
