import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BONUS_TIME, INITIAL_TIME, PENALTY_TIME } from '@app/constants';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { TimeConversionService } from '@app/services/time-conversion-service/time-conversion.service';
import { Confirmation, ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { AdminConstantsFormComponent } from './admin-constants-form.component';

describe('AdminConstantsFormComponent', () => {
    let component: AdminConstantsFormComponent;
    let fixture: ComponentFixture<AdminConstantsFormComponent>;
    let timeConversionService: TimeConversionService;
    let confirmationService: ConfirmationService;
    let communicationService: CommunicationService;
    let convertDateToSecondsSpy: jasmine.Spy<(date: Date) => number>;
    let convertSecondsToDateSpy: jasmine.Spy<(seconds: number) => Date>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule],
            declarations: [AdminConstantsFormComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminConstantsFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    beforeEach(() => {
        communicationService = TestBed.inject(CommunicationService);
        timeConversionService = TestBed.inject(TimeConversionService);
        convertSecondsToDateSpy = spyOn(timeConversionService, 'convertSecondsToDate').and.callThrough();
        convertDateToSecondsSpy = spyOn(timeConversionService, 'convertDateToSeconds').and.callThrough();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set adminConstants to correct constants when calling ngOnInit', () => {
        component.ngOnInit();
        expect(convertDateToSecondsSpy(component.adminConstants.initialTime)).toEqual(INITIAL_TIME);
        expect(convertDateToSecondsSpy(component.adminConstants.penaltyTime)).toEqual(PENALTY_TIME);
        expect(convertDateToSecondsSpy(component.adminConstants.bonusTime)).toEqual(BONUS_TIME);
    });

    it('should call convertDateToSeconds when ngOnInit', fakeAsync(() => {
        component.ngOnInit();
        expect(convertSecondsToDateSpy).toHaveBeenCalled();
    }));

    it('should call convertDateToSeconds when updating cosntants and call the put function', fakeAsync(() => {
        const putSpy = spyOn(communicationService, 'putAdminConstants').and.returnValue(of(void 0));
        component.updateConstants();
        expect(convertDateToSecondsSpy).toHaveBeenCalled();
        expect(putSpy).toHaveBeenCalled();
    }));

    it('should call confirmModifyConstants when updating cosntants and call the put function', fakeAsync(() => {
        const event: PointerEvent = new PointerEvent('any');
        confirmationService = fixture.debugElement.injector.get(ConfirmationService);
        const accept = spyOn(confirmationService, 'confirm').and.callFake((confirmation: Confirmation) => {
            if (confirmation.accept) {
                return confirmation.accept();
            }
        });
        component.confirmModifyConstants(event);
        expect(accept).toHaveBeenCalled();
    }));
});
