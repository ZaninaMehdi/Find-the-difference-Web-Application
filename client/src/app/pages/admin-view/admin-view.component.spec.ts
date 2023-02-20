import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminViewComponent } from './admin-view.component';

describe('AdminViewComponent', () => {
    let component: AdminViewComponent;
    let fixture: ComponentFixture<AdminViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminViewComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
