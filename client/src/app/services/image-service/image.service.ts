import { Injectable } from '@angular/core';
import { MAX_HEIGHT, MAX_WIDTH, VALID_BMP_SIZE, VALID_FORMAT } from '@app/constants';
import { ImageAlert } from '@app/interfaces/image-alert';

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    originalContextBackground: CanvasRenderingContext2D;
    modifiableContextBackground: CanvasRenderingContext2D;
    image: ImageBitmap;

    async validateImage(file: File): Promise<ImageAlert> {
        const alert: ImageAlert = { error: '', valid: true };

        if (file) {
            if (file.type !== VALID_FORMAT) {
                alert.error = "L'image choisie n'est pas de format BMP";
                alert.valid = false;
            } else {
                this.image = await createImageBitmap(file);
                if (this.image.height !== MAX_HEIGHT || this.image.width !== MAX_WIDTH) {
                    alert.error = "L'image choisie n'est pas conforme à la taille demandée";
                    alert.valid = false;
                    return alert;
                }
                if (file.size !== VALID_BMP_SIZE) {
                    alert.error = "L'image ne représente pas un fichier BMP 24 bits";
                    alert.valid = false;
                    return alert;
                }
            }
        }
        return alert;
    }

    displayImage(context: CanvasRenderingContext2D): void {
        context.drawImage(this.image, 0, 0);
    }
}
