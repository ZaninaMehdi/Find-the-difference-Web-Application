import { Injectable } from '@angular/core';
import { HOUR_TO_SECONDS, MILLISECOND_TO_SECOND, MINUTE_TO_SECONDS } from '@app/constants';

@Injectable({
    providedIn: 'root',
})
export class TimeConversionService {
    convertDateToSeconds(date: Date): number {
        return date.getSeconds() + MINUTE_TO_SECONDS * date.getMinutes() + HOUR_TO_SECONDS * date.getHours();
    }

    convertSecondsToDate(seconds: number): Date {
        const date = new Date(seconds * MILLISECOND_TO_SECOND);
        date.setHours(0);
        return date;
    }
}
