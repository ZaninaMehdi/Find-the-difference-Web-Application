import { Component, OnInit } from '@angular/core';
import { BONUS_TIME, INITIAL_TIME, MAX_TIME, MIN_TIME, PENALTY_TIME } from '@app/constants';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { AdminConstantsToNumber } from '@app/interfaces/admin-constants-number';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { TimeConversionService } from '@app/services/time-conversion-service/time-conversion.service';
import { ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-admin-constants-form',
    templateUrl: './admin-constants-form.component.html',
    styleUrls: ['./admin-constants-form.component.scss'],
    providers: [ConfirmationService],
})
export class AdminConstantsFormComponent implements OnInit {
    display: boolean;
    minDate: Date;
    maxDate: Date;
    minDateInitialTime: Date;
    maxDateInitialTime: Date;
    adminConstants: AdminConstants;

    constructor(
        private timeConversion: TimeConversionService,
        private communicationService: CommunicationService,
        private confirmationService: ConfirmationService,
    ) {
        this.display = false;
    }

    ngOnInit(): void {
        this.adminConstants = {
            initialTime: this.timeConversion.convertSecondsToDate(INITIAL_TIME),
            penaltyTime: this.timeConversion.convertSecondsToDate(PENALTY_TIME),
            bonusTime: this.timeConversion.convertSecondsToDate(BONUS_TIME),
        };
        this.minDateInitialTime = this.timeConversion.convertSecondsToDate(MIN_TIME);
        this.maxDateInitialTime = this.timeConversion.convertSecondsToDate(MAX_TIME);
        this.minDate = this.timeConversion.convertSecondsToDate(1);
        this.maxDate = this.timeConversion.convertSecondsToDate(MIN_TIME);
    }

    updateConstants(): void {
        const newConstants: AdminConstantsToNumber = {
            initialTime: this.timeConversion.convertDateToSeconds(this.adminConstants.initialTime),
            penaltyTime: this.timeConversion.convertDateToSeconds(this.adminConstants.penaltyTime),
            bonusTime: this.timeConversion.convertDateToSeconds(this.adminConstants.bonusTime),
        };
        this.communicationService.putAdminConstants(newConstants).subscribe();
    }

    confirmModifyConstants(event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Êtes vous sûrs de vouloir modifier les constantes de jeu ?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.display = false;
                this.updateConstants();
            },
        });
    }
}
