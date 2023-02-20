import { Point2d } from '@app/interfaces/point2d';
import { DrawingService } from '@app/services/drawing-service/drawing.service';
import { Tool } from './tool';

class MockTool extends Tool {
    // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
    onMouseDown(event: MouseEvent): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
    onMouseUp(event: MouseEvent): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function, no-unused-vars
    onMouseMove(event: MouseEvent): void {}
    changeWidth(newWidth: number): void {
        this.width = newWidth;
    }
}

describe('Tool', () => {
    let tool: MockTool;
    let drawingService: DrawingService;

    beforeEach(() => {
        tool = new MockTool(drawingService);
    });

    it('should be created', () => {
        expect(tool).toBeTruthy();
    });

    it('should return the right coordinates of the mouseclick', () => {
        const mouseEvent = {
            offsetX: 25,
            offsetY: 27,
            button: 0,
        } as MouseEvent;
        const pos: Point2d = tool.getPositionFromMouse(mouseEvent);
        expect(pos.x).toBe(mouseEvent.offsetX);
        expect(pos.y).toBe(mouseEvent.offsetY);
    });

    it('should put mouseDown to false on calling onMouseUpOutside', () => {
        tool.mouseDown = true;
        tool.onMouseUpOutside();
        expect(tool.mouseDown).toBe(false);
    });
});
