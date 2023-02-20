import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { SelectionViewComponent } from '@app/pages/selection-view/selection-view.component';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { of } from 'rxjs';

import { AlertMessageComponent } from './alert-message.component';

describe('AlertMessageComponent', () => {
    let component: AlertMessageComponent;
    let fixture: ComponentFixture<AlertMessageComponent>;
    let limitedService: LimitedTimeService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterModule.forRoot([
                    { path: 'selection', component: SelectionViewComponent },
                    { path: 'home', component: MainPageComponent },
                ]),
            ],
            declarations: [AlertMessageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AlertMessageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        limitedService = TestBed.inject(LimitedTimeService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit closed when we close the pop up', () => {
        spyOn(component.closed, 'emit');
        component.onClose();
        expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should call isLimitedTimeGame subscribe method', fakeAsync(() => {
        spyOn(limitedService.closePopUp, 'asObservable').and.returnValue(of(true));
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        const subscribeSpy = spyOn(limitedService.closePopUp.asObservable(), 'subscribe').and.callThrough();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        component.ngOnInit();
        tick();
        expect(subscribeSpy).toHaveBeenCalled();
        expect(component['route']).toEqual('/home');
    }));

    it('should redirect with redirection method', fakeAsync(() => {
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-empty-function
        const redirectSpy = spyOn(limitedService, 'redirection').and.callFake((route: string) => {});
        // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
        component['route'] = '/home';
        component.redirect();
        expect(redirectSpy).toHaveBeenCalledWith('/home');
        component['route'] = '/selection';
        component.redirect();
        expect(redirectSpy).toHaveBeenCalledWith('/selection');
    }));

    it('should unsubscribe', fakeAsync(() => {
        component.ngOnInit();
        tick();
        const firstSpy = spyOn(component['subscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(firstSpy).toHaveBeenCalled();
    }));
});
