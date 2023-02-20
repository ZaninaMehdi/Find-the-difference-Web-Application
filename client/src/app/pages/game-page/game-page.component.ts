import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    roomInfo: ClassicRoom;
    isLimitedGame: boolean;
    private subscription: Subscription;
    private limitedSubscription: Subscription;

    constructor(private classicManager: ClassicGameManagerService, private limitedTimeManager: LimitedTimeService) {}

    ngOnInit(): void {
        if (!this.classicManager.isConnected()) {
            this.classicManager.redirection('/selection');
        }

        this.limitedSubscription = this.limitedTimeManager.isLimitedTimeGame.asObservable().subscribe((value: boolean) => {
            this.isLimitedGame = value;
        });

        if (this.isLimitedGame) {
            this.subscription = this.limitedTimeManager.getRoomInfo().subscribe((room: ClassicRoom) => {
                this.roomInfo = room;
            });
        } else {
            this.subscription = this.classicManager.getRoomInfo().subscribe((roomInfo: ClassicRoom) => {
                this.roomInfo = roomInfo;
            });
        }
    }

    ngOnDestroy(): void {
        if (this.subscription) this.subscription.unsubscribe();
        if (this.limitedSubscription) this.limitedSubscription.unsubscribe();
    }
}
