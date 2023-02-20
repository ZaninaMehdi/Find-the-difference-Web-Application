import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DataSharingService {
    notify = new BehaviorSubject<boolean>(false);
    notifyObservable$ = this.notify.asObservable();

    notifyOther(data: boolean) {
        if (data) {
            this.notify.next(data);
        }
    }
}
