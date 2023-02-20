import { TestBed } from '@angular/core/testing';

import { TimeConversionService } from './time-conversion.service';

describe('TimeConversionService', () => {
    let service: TimeConversionService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TimeConversionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should convert a duration with Date type to duration with number type ', () => {
        const date = new Date(0);
        date.setHours(0);
        date.setMinutes(2);
        date.setSeconds(3);
        const equivalentSeconds = 123;
        expect(service.convertDateToSeconds(date)).toEqual(equivalentSeconds);
    });

    it('should convert seconds to Date', () => {
        const timeInSeconds = 123;
        const equivalentDateTime = new Date(0);
        equivalentDateTime.setMinutes(2);
        equivalentDateTime.setSeconds(3);
        expect(service.convertSecondsToDate(timeInSeconds).getTime).toEqual(equivalentDateTime.getTime);
    });
});
