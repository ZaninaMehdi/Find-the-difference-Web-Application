import { Point2d } from './point2d';

export interface ServerGameSheet {
    originalLink: string;
    modifiedLink: string;
    differenceCounter: number;
    differenceLocations: Point2d[][];
    name: string;
}
