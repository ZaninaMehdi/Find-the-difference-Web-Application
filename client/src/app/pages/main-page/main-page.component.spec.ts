import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { RoomManagerService } from '@app/services/room-manager-service/room-manager.service';
import { of, Subscription } from 'rxjs';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let roomManager: RoomManagerService;
    let fixture: ComponentFixture<MainPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientModule],
            declarations: [MainPageComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        roomManager = TestBed.inject(RoomManagerService);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call isBddConnected', fakeAsync(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(roomManager, 'connect').and.callFake(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        spyOn(roomManager, 'handleSocket').and.callFake(() => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const firstSpy = spyOn(roomManager, 'getConnexionStatus').and.callFake(() => {});
        spyOn(roomManager.isBddNotConnected, 'asObservable').and.returnValue(of(true));
        const spy = spyOn(roomManager.isBddNotConnected.asObservable(), 'subscribe').and.callThrough();
        component.ngOnInit();
        tick();
        expect(spy).toHaveBeenCalled();
        expect(firstSpy).toHaveBeenCalled();
        expect(component.isBddNotConnected).toBe(true);
    }));

    it('should unsnscribe from subscription when ngOnDestroy', () => {
        component['subscription'] = new Subscription();
        const subscriptionSpy = spyOn(component['subscription'], 'unsubscribe');

        component.ngOnDestroy();
        expect(subscriptionSpy).toHaveBeenCalled();
    });
});
