import { TestBed } from '@angular/core/testing';

import { DataSharingService } from './data-sharing.service';

describe('DataSharingService', () => {
    let service: DataSharingService;
    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DataSharingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should update the subject attribute', () => {
        service.notifyOther(true);
        service.notifyObservable$.subscribe((value) => {
            expect(value).toBe(true);
        });
    });
});
