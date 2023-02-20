/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';

import { ValidationPopUpComponent } from './validation-pop-up.component';

describe('ValidationPopUpComponent', () => {
    const matDialogSpy: jasmine.SpyObj<MatDialogRef<any>> = jasmine.createSpyObj('MatDialogRef', ['open', 'close']);
    let component: ValidationPopUpComponent;
    let fixture: ComponentFixture<ValidationPopUpComponent>;
    let contextStub: CanvasRenderingContext2D;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ValidationPopUpComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: matDialogSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ValidationPopUpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should draw canvas', () => {
        contextStub = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        component.context = contextStub;
        const drawImageSpy = spyOn(component.context, 'drawImage').and.stub();
        contextStub.clearRect(0, 0, MAX_WIDTH, MAX_HEIGHT);
        component.data.canvasData = contextStub.canvas;
        component.ngAfterViewInit();
        expect(drawImageSpy).not.toHaveBeenCalled();
    });

    it('should close the dialog and send the gameName to the parent', () => {
        component.name = 'testName';
        component.createGame();
        expect(component.data.gameName).toBe('testName');
        expect(matDialogSpy.close).toHaveBeenCalled();
    });

    it('should return true if number of differences is between 3 and 9, and false otherwise', () => {
        component.data.numberOfDifferences = 5;
        const goodResult = component.areDifferencesValid();
        component.data.numberOfDifferences = 1;
        const badResult1 = component.areDifferencesValid();
        component.data.numberOfDifferences = 15;
        const badResult2 = component.areDifferencesValid();
        component.data.numberOfDifferences = -3;
        const badResult3 = component.areDifferencesValid();
        expect(goodResult).toBe(true);
        expect(badResult1).toBe(false);
        expect(badResult2).toBe(false);
        expect(badResult3).toBe(false);
    });

    it('should call onKeyDown once i is pressed', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const createGameSpy = spyOn(component, 'createGame').and.callFake(() => {});
        const enterEvent: KeyboardEvent = new KeyboardEvent('keyup', { key: 'Enter' });

        component.onKeyDown(enterEvent);

        expect(createGameSpy).toHaveBeenCalled();
    });
});
