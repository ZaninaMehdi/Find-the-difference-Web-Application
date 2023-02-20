import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { MAX_HEIGHT, MAX_WIDTH, WAIT_TIME } from '@app/constants';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { PlayAreaService } from '@app/services/play-area-service/play-area.service';
import { ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
    providers: [ConfirmationService],
})
export class PlayAreaComponent implements AfterViewInit, OnDestroy {
    @ViewChild('originalCanvas', { static: false }) private originalCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('originalCanvasFG', { static: false }) private originalCanvasForeground!: ElementRef<HTMLCanvasElement>;
    @ViewChild('modifiedCanvas', { static: false }) private modifiedCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('modifiedCanvasFG', { static: false }) private modifiedCanvasForeground!: ElementRef<HTMLCanvasElement>;
    roomInformation: ClassicRoom;
    isMainCanvas: boolean;
    isLimitedGame: boolean;
    private isCheatMode: boolean;
    private differenceSubscription: Subscription;
    private subscription: Subscription;
    private canvasSize = { width: MAX_WIDTH, height: MAX_HEIGHT };
    private cheatModeInterval: ReturnType<typeof setInterval>;
    private limitedSubscription: Subscription;
    private secondLimitedSubscription: Subscription;

    // eslint-disable-next-line max-params
    constructor(
        private cdref: ChangeDetectorRef,
        private classicManager: ClassicGameManagerService,
        private playAreaService: PlayAreaService,
        private limitedTimeManager: LimitedTimeService,
        private confirmationService: ConfirmationService,
    ) {
        this.isCheatMode = false;
        this.isLimitedGame = false;
    }

    get width(): number {
        return this.canvasSize.width;
    }

    get height(): number {
        return this.canvasSize.height;
    }

    @HostListener('document:keyup', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (this.checkPressedT(event)) {
            if (!this.isCheatMode) {
                this.activateCheatMode();
                this.cheatModeInterval = setInterval(() => {
                    this.activateCheatMode();
                }, WAIT_TIME);
            } else {
                clearInterval(this.cheatModeInterval);
                this.isCheatMode = false;
            }
        }
    }

    ngOnDestroy(): void {
        clearInterval(this.cheatModeInterval);
        this.subscription.unsubscribe();
        this.differenceSubscription.unsubscribe();
        if (this.limitedSubscription) this.limitedSubscription.unsubscribe();
        if (this.secondLimitedSubscription) this.secondLimitedSubscription.unsubscribe();
    }

    checkPressedT(event: KeyboardEvent): boolean {
        return event.key.toLowerCase() === 't';
    }

    ngAfterViewInit(): void {
        this.limitedSubscription = this.limitedTimeManager.isLimitedTimeGame.asObservable().subscribe((isLimitedGame: boolean) => {
            this.isLimitedGame = isLimitedGame;
        });

        if (this.isLimitedGame) {
            this.secondLimitedSubscription = this.limitedTimeManager.isMainCanvas.asObservable().subscribe((value: boolean) => {
                this.isMainCanvas = value;
            });

            this.limitedTimeManager.connect();
            this.limitedTimeManager.handleSocket();

            this.subscription = this.limitedTimeManager.getRoomInfo().subscribe((room: ClassicRoom) => {
                this.setData(room);
            });

            this.differenceSubscription = this.limitedTimeManager.currentDifference.asObservable().subscribe(() => {
                this.limitedTimeManager.error(this.isMainCanvas);
            });
        } else {
            this.classicManager.connect();
            this.classicManager.handleSocket();

            this.subscription = this.classicManager.getRoomInfo().subscribe((roomInfo) => {
                this.setData(roomInfo);
            });

            this.differenceSubscription = this.classicManager.currentDifference.asObservable().subscribe((difference: Point2d[]) => {
                this.playAreaService.setImageData();
                this.classicManager.currentRoom.currentDifference = difference;
                this.classicManager.removeDifference(this.isMainCanvas);
            });
        }

        this.cdref.detectChanges();
    }

    setData(roomInfo: ClassicRoom): void {
        this.roomInformation = roomInfo;
        this.playAreaService.room = roomInfo;
        this.playAreaService.originalContext = this.originalCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.playAreaService.modifiedContext = this.modifiedCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.playAreaService.originalContextForeground = this.originalCanvasForeground.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.playAreaService.modifiedContextForeground = this.modifiedCanvasForeground.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.setCanvases();
    }

    setCanvases(): void {
        this.playAreaService.onLoad(this.playAreaService.originalContext, this.roomInformation.game.gameSheet.originalLink);
        this.playAreaService.onLoad(this.playAreaService.modifiedContext, this.roomInformation.game.gameSheet.modifiedLink);
    }

    quit(): void {
        if (this.isLimitedGame) {
            this.limitedTimeManager.redirection('/home');
            this.limitedTimeManager.disconnect();
        } else {
            this.classicManager.quitGame();
            this.classicManager.redirection('/selection');
        }
    }

    mouseHitDetectOriginalImage(event: MouseEvent) {
        this.isMainCanvas = true;
        if (this.playAreaService.mouseHitDetect(event)) {
            if (this.isLimitedGame) this.limitedTimeManager.sendCoords(this.roomInformation, this.playAreaService.mousePosition, this.isMainCanvas);
            else this.classicManager.sendCoords(this.roomInformation, this.playAreaService.mousePosition);
        }
    }

    mouseHitDetectModifiedImage(event: MouseEvent) {
        this.isMainCanvas = false;
        if (this.playAreaService.mouseHitDetect(event)) {
            if (this.isLimitedGame) this.limitedTimeManager.sendCoords(this.roomInformation, this.playAreaService.mousePosition, this.isMainCanvas);
            else this.classicManager.sendCoords(this.roomInformation, this.playAreaService.mousePosition);
        }
    }

    activateCheatMode() {
        this.isCheatMode = true;
        this.roomInformation.game.gameSheet.differenceLocations.forEach((element) => {
            this.playAreaService.setImageData();
            const initialModifiedCanvasImageData = this.playAreaService.modifiedContext.getImageData(0, 0, MAX_WIDTH, MAX_HEIGHT);
            this.playAreaService.flashDifferencePixelsCheatMode(element);
            this.playAreaService.removeHintFromModifiedCanvas(element, initialModifiedCanvasImageData);
        });
    }

    confirmQuitGame(event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: `Êtes vous sûr de vouloir quitter ${this.roomInformation.game.gameSheet.name} et par conséquent perdre la partie`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => {
                this.quit();
            },
        });
    }
}
