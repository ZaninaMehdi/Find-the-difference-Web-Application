import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { PlayAreaService } from '@app/services/play-area-service/play-area.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LimitedTimeService {
    currentRoom: ClassicRoom;
    roomInformation: BehaviorSubject<ClassicRoom>;
    currentDifference: Subject<Point2d[]>;
    winSound: HTMLAudioElement;
    losingSound: HTMLAudioElement;
    stopClick: Subject<boolean>;
    isLimitedTimeGame: BehaviorSubject<boolean>;
    closePopUp: BehaviorSubject<boolean>;
    moreGames: Subject<boolean>;
    isMainCanvas: BehaviorSubject<boolean>;

    constructor(private router: Router, private clientSocket: ClientSocketService, private playAreaService: PlayAreaService) {
        this.roomInformation = new BehaviorSubject<ClassicRoom>(undefined as unknown as ClassicRoom);
        this.currentDifference = new Subject<Point2d[]>();
        this.stopClick = new Subject<boolean>();
        this.winSound = new Audio('assets/beep.wav');
        this.losingSound = new Audio('assets/errorBeep.mp3');
        this.isLimitedTimeGame = new BehaviorSubject<boolean>(false);
        this.moreGames = new Subject<boolean>();
        this.isMainCanvas = new BehaviorSubject<boolean>(false);
        this.closePopUp = new BehaviorSubject<boolean>(false);
    }

    connect(): void {
        if (!this.clientSocket.isSocketAlive()) {
            this.clientSocket.connect();
        }
    }

    resetClosePopUp(): void {
        this.closePopUp.next(false);
    }

    disconnect(): void {
        this.isLimitedTimeGame.next(false);
        this.clientSocket.disconnect();
    }

    isConnected(): boolean {
        return this.clientSocket.isSocketAlive();
    }

    getRoomInfo(): Observable<ClassicRoom> {
        return this.roomInformation.asObservable();
    }

    quitGame(): void {
        this.clientSocket.disconnect();
    }

    redirection(route: string): void {
        this.router.navigate([route]);
    }

    sendCoords(room: ClassicRoom, coords: Point2d, isMainCanvas: boolean): void {
        this.clientSocket.send('verifyCoordsLimitedMode', { room, coords, isMainCanvas });
    }

    error(isMainCanvas: boolean): void {
        if (this.currentRoom.currentDifference.length === 0) {
            this.losingSound.play();
            this.playAreaService.displayErrorOnCanvas(isMainCanvas);
        }
    }

    handleSocket(): void {
        this.clientSocket.on('countDownStarted', (timer: number) => {
            this.currentRoom.timer = timer;

            if (timer === 0) {
                this.currentRoom.endGameMessage = 'Le temps est fini. Vous avez perdu le jeu.';
                this.roomInformation.next(this.currentRoom);
                this.disconnect();
            } else {
                if (this.router.url !== '/game') this.disconnect();
            }
            this.closePopUp.next(true);
        });
        this.clientSocket.on('newGame', (room: ClassicRoom) => {
            this.currentRoom = room;
            this.roomInformation.next(room);
        });
        this.clientSocket.on('foundDifference', (object: { difference: Point2d[]; isMainCanvas: boolean }) => {
            this.currentRoom.currentDifference = object.difference;
            this.isMainCanvas.next(object.isMainCanvas);
            this.currentDifference.next(object.difference);
            this.roomInformation.next(this.currentRoom);
        });
        this.clientSocket.on('noMoreGames', () => {
            this.moreGames.next(true);
            this.currentRoom.differencesFound++;
            this.currentRoom.endGameMessage = 'Félicitations! Vous êtes le gagnant de cette partie.';
            this.roomInformation.next(this.currentRoom);
            this.isLimitedTimeGame.next(false);
            this.quitGame();
            this.isLimitedTimeGame.next(false);
            this.closePopUp.next(true);
        });
    }
}
