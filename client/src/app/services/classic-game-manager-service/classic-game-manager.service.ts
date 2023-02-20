import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { PlayAreaService } from '@app/services/play-area-service/play-area.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ClassicGameManagerService {
    currentRoom: ClassicRoom;
    roomInfo: Subject<ClassicRoom>;
    currentDifference: Subject<Point2d[]>;
    winSound: HTMLAudioElement;
    losingSound: HTMLAudioElement;
    stopClick: Subject<boolean>;

    constructor(private router: Router, private playAreaService: PlayAreaService, private clientSocket: ClientSocketService) {
        this.roomInfo = new Subject<ClassicRoom>();
        this.currentDifference = new Subject<Point2d[]>();
        this.stopClick = new Subject<boolean>();
        this.winSound = new Audio('assets/beep.wav');
        this.losingSound = new Audio('assets/errorBeep.mp3');
    }

    connect(): void {
        if (!this.clientSocket.isSocketAlive()) {
            this.clientSocket.connect();
        }
    }

    disconnect(): void {
        this.clientSocket.disconnect();
    }

    isConnected(): boolean {
        return this.clientSocket.isSocketAlive();
    }

    getRoomInfo(): Observable<ClassicRoom> {
        return this.roomInfo.asObservable();
    }

    addPenaltyTime(room: ClassicRoom): void {
        this.clientSocket.send('penalty', room);
    }

    quitGame(): void {
        this.clientSocket.disconnect();
    }

    redirection(route: string): void {
        this.router.navigate([route]);
    }

    sendCoords(room: ClassicRoom, coords: Point2d): void {
        this.clientSocket.send('verifyCoords', { room, coords });
    }

    gameStatus(room: ClassicRoom): void {
        this.clientSocket.send('checkStatus', room);
    }

    removeDifference(isMainCanvas: boolean): void {
        if (this.currentRoom.currentDifference.length === 0) {
            this.losingSound.play();
            this.playAreaService.displayErrorOnCanvas(isMainCanvas);
        } else {
            this.winSound.play();
            this.playAreaService.flashDifferencePixels(this.currentRoom.currentDifference);
            this.playAreaService.removeDifferenceFromModifiedCanvas(this.currentRoom.currentDifference);
            this.gameStatus(this.currentRoom);
        }
    }

    handleSocket(): void {
        this.clientSocket.on('timerStarted', (timer: number) => {
            this.currentRoom.timer = timer;
            if (this.router.url !== '/game') this.quitGame();
        });
        this.clientSocket.on('removedFoundDiff', (room: ClassicRoom) => {
            if (room.guestInfo && this.currentRoom.guestInfo && room.guestInfo.id.length > 0) {
                this.currentRoom.guestInfo.differencesFound = room.guestInfo.differencesFound;
                this.currentRoom.guestInfo.differenceLocations = room.guestInfo.differenceLocations;
            }
            this.currentRoom.differencesFound = room.differencesFound;
            this.currentRoom.game.gameSheet.differenceLocations = room.game.gameSheet.differenceLocations;
            this.currentRoom.currentDifference = room.currentDifference;

            this.currentDifference.next(room.currentDifference);
        });
        this.clientSocket.on('finishedGame', (message: string) => {
            this.currentRoom.endGameMessage = message;
            this.roomInfo.next(this.currentRoom);
            this.quitGame();
        });
        this.clientSocket.on('hasAbondonnedGame', (hasAbandoned: boolean) => {
            if (hasAbandoned) this.redirection('/selection');
        });
    }
}
