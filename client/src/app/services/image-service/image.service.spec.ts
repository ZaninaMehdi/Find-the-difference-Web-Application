/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';
import { ImageAlert } from '@app/interfaces/image-alert';
import { ImageService } from './image.service';

describe('ImageService', () => {
    let service: ImageService;
    let contextStub: CanvasRenderingContext2D;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ImageService);
        contextStub = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        service.originalContextBackground = service.modifiableContextBackground = contextStub;

        const image = new Image();
        image.onload = async () => {
            service.image = await createImageBitmap(image);
        };
        image.src = 'assets/bmp_640.bmp';
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should draw image on canvas', () => {
        const canvas: HTMLCanvasElement = CanvasTestHelper.createCanvas(MAX_WIDTH, MAX_HEIGHT);
        const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
        const contextSpy = spyOn(context, 'drawImage').and.callFake(() => {});

        service.displayImage(context);
        expect(contextSpy).toHaveBeenCalled();
    });

    it('should return an alert for a given image file that is not of the correct format', async () => {
        const invalidFormatImage = new Image();
        invalidFormatImage.src = 'assets/img_the_scream.png';
        const imageFile = new File([''], invalidFormatImage.src, { type: 'image/png' });

        const alert: ImageAlert = await service.validateImage(imageFile);
        expect(alert.error).toEqual("L'image choisie n'est pas de format BMP");
        expect(alert.valid).toBe(false);
    });

    it('should return an alert for a given image file that is not of the correct size', async () => {
        const image = await fetch('assets/smol_bmp.bmp');
        const blob = await image.blob();
        const imageFile = new File([blob], 'image.bmp', blob);

        const alert: ImageAlert = await service.validateImage(imageFile);
        expect(alert.error).toEqual("L'image choisie n'est pas conforme à la taille demandée");
        expect(alert.valid).toBe(false);
    });

    it('should return an alert for a given image file that is not of the correct depth', async () => {
        const image = await fetch('assets/image_wrong_bit_depth.bmp');
        const blob = await image.blob();
        const imageFile = new File([blob], 'image.bmp', blob);

        const alert: ImageAlert = await service.validateImage(imageFile);
        expect(alert.error).toEqual("L'image ne représente pas un fichier BMP 24 bits");
        expect(alert.valid).toBe(false);
    });

    it('should validate a correct image', async () => {
        const image = await fetch('assets/bmp_640.bmp');
        const blob = await image.blob();
        const imageFile = new File([blob], 'image.bmp', blob);

        const alert: ImageAlert = await service.validateImage(imageFile);
        expect(alert.error).toEqual('');
        expect(alert.valid).toBe(true);
    });
});
