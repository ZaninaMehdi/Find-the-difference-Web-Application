import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MAX_HEIGHT, MAX_WIDTH } from '@app/constants';
import { HintNumber } from '@app/interfaces/hint-number';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { PlayAreaService } from '@app/services/play-area-service/play-area.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
    roomInformation: ClassicRoom;
    hintsCount: number = 3;
    hintDisabled: boolean;
    private isLimitedGame: boolean;
    private subscription: Subscription;
    private limitedSubscription: Subscription;

    constructor(
        private classicManager: ClassicGameManagerService,
        private limitedTimeManager: LimitedTimeService,
        private playAreaService: PlayAreaService,
    ) {}

    @HostListener('document:keyup', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (!this.roomInformation.guestInfo) {
            if (event.key.toLowerCase() === 'i' && this.hintsCount > 0) this.hint();
        }
    }

    ngOnInit(): void {
        this.limitedSubscription = this.limitedTimeManager.isLimitedTimeGame.asObservable().subscribe((isLimitedGame: boolean) => {
            this.isLimitedGame = isLimitedGame;
        });

        if (this.isLimitedGame) {
            this.subscription = this.limitedTimeManager.getRoomInfo().subscribe((room: ClassicRoom) => {
                this.roomInformation = room;
            });
        } else {
            this.subscription = this.classicManager.getRoomInfo().subscribe((roomInfo: ClassicRoom) => {
                this.roomInformation = roomInfo;
            });
        }

        this.hintDisabled = false;
    }

    ngOnDestroy(): void {
        if (this.subscription) this.subscription.unsubscribe();
        if (this.limitedSubscription) this.limitedSubscription.unsubscribe();
    }

    hint(): void {
        const initialModifiedCanvasImageData = this.playAreaService.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
        const currentDifferenceTableLength = this.roomInformation.game.gameSheet.differenceLocations.length;
        const randomDifference = Math.floor(Math.random() * currentDifferenceTableLength);
        const randomDifferenceHint: Point2d[] = this.roomInformation.game.gameSheet.differenceLocations[randomDifference];
        const random = Math.floor(Math.random() * randomDifferenceHint.length);
        const randomDifferencePoint: Point2d = randomDifferenceHint[random];

        this.classicManager.addPenaltyTime(this.roomInformation);
        this.playAreaService.setImageData();
        switch (--this.hintsCount) {
            case HintNumber.FirstHint:
                this.playAreaService.removeHintFromModifiedCanvas(randomDifferenceHint, initialModifiedCanvasImageData);
                this.playAreaService.flashDifferencePixels(
                    this.playAreaService.returnQuadrant(
                        this.playAreaService.findQuadrant(randomDifferencePoint, MAX_WIDTH, MAX_HEIGHT),
                        MAX_WIDTH,
                        MAX_HEIGHT,
                        {
                            x: 0,
                            y: 0,
                        },
                    ),
                );
                break;
            case HintNumber.SecondHint:
                this.playAreaService.removeHintFromModifiedCanvas(randomDifferenceHint, initialModifiedCanvasImageData);
                this.playAreaService.flashDifferencePixels(this.playAreaService.returnSmallerQuadrant(randomDifferencePoint));
                break;
            case HintNumber.ThirdHint:
                this.playAreaService.flashDifferencePixels(randomDifferenceHint);
                this.hintDisabled = true;
                break;
        }
        this.classicManager.gameStatus(this.roomInformation);
    }
}
