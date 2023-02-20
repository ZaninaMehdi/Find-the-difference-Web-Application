import { Component, OnInit, OnDestroy } from '@angular/core';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnInit, OnDestroy {
    isBddNotConnected: boolean;
    private subscription: Subscription;
    constructor(private roomManager: RoomManagerService) {}

    ngOnInit() {
        this.roomManager.connect();
        this.roomManager.getConnexionStatus();
        this.roomManager.handleSocket();
        this.subscription = this.roomManager.isBddNotConnected.asObservable().subscribe((isBddNotConnected: boolean) => {
            this.isBddNotConnected = isBddNotConnected;
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
