import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-alert-message',
    templateUrl: './alert-message.component.html',
    styleUrls: ['./alert-message.component.scss'],
})
export class AlertMessageComponent implements OnInit, OnDestroy {
    @Input() error: string;
    @Output() closed = new EventEmitter<void>();
    @Input() endGameMessage: string;
    private route: string;
    private subscription: Subscription;

    constructor(private limitedTimeManager: LimitedTimeService) {
        this.route = '/selection';
    }

    ngOnInit(): void {
        this.subscription = this.limitedTimeManager.closePopUp.asObservable().subscribe((closePopUp: boolean) => {
            if (closePopUp) {
                this.route = '/home';
            }
        });
    }

    onClose(): void {
        this.closed.emit();
    }

    redirect(): void {
        if (this.route === '/home') {
            this.limitedTimeManager.redirection('/home');
            this.limitedTimeManager.resetClosePopUp();
        } else this.limitedTimeManager.redirection('/selection');
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
