import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { MenuItem } from 'primeng/api';
import { of, Subscription } from 'rxjs';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let roomManager: RoomManagerService;
    let fixture: ComponentFixture<HeaderComponent>;
    const mockItems: MenuItem[] = [
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

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule],
            declarations: [HeaderComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderComponent);
        roomManager = TestBed.inject(RoomManagerService);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set items when calling ngOnInit', () => {
        component.ngOnInit();
        expect(component.items).toEqual(mockItems);
    });

    it('should call isBddConnected', fakeAsync(() => {
        spyOn(roomManager.isBddNotConnected, 'asObservable').and.returnValue(of(true));
        const spy = spyOn(roomManager.isBddNotConnected.asObservable(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(spy).toHaveBeenCalled();
        expect(component.isBddNotConnected).toBeDefined();
    }));

    it('should unsnscribe from subscription when ngOnDestroy', () => {
        component['subscription'] = new Subscription();
        const subscriptionSpy = spyOn(component['subscription'], 'unsubscribe');

        component.ngOnDestroy();
        expect(subscriptionSpy).toHaveBeenCalled();
    });
});
