/* eslint-disable @typescript-eslint/no-empty-function */
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlayerNamePopUpComponent } from './player-name-pop-up.component';

describe('PlayerNamePopUpComponent', () => {
    let component: PlayerNamePopUpComponent;
    let fixture: ComponentFixture<PlayerNamePopUpComponent>;

    const dialogMock = {
        close: () => {},
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlayerNamePopUpComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: dialogMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerNamePopUpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        component.playerName = 'bleepbloop';
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialog and return the playerName value', () => {
        const spy = spyOn(component['dialogRef'], 'close').and.callThrough();
        component.enterGame();
        expect(spy).toHaveBeenCalledWith(component.playerName);
    });

    it('should call onKeyDown once i is pressed', () => {
        const enterGameSpy = spyOn(component, 'enterGame').and.callFake(() => {});
        const enterEvent: KeyboardEvent = new KeyboardEvent('keyup', { key: 'Enter' });

        component.onKeyDown(enterEvent);

        expect(enterGameSpy).toHaveBeenCalled();
    });
});
