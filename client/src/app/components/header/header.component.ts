import { Component, OnInit, OnDestroy } from '@angular/core';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
    items: MenuItem[];
    isBddNotConnected: boolean;
    private subscription: Subscription;
    constructor(private roomManager: RoomManagerService) {}

    ngOnInit(): void {
        this.subscription = this.roomManager.isBddNotConnected.asObservable().subscribe((isBddConnected: boolean) => {
            this.isBddNotConnected = isBddConnected;
        });

        this.items = [
            {
                label: 'Accueil',
                routerLink: 'home',
                icon: 'pi pi-home',
            },
            {
                label: 'Sélection de jeu',
                routerLink: '/selection',
                icon: 'pi pi-play',
            },
            {
                label: 'Portail administrateur',
                routerLink: '/admin',
                icon: 'pi pi-fw pi-user',
            },
        ];
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
