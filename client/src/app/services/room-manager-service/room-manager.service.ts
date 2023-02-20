import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GameData, GameSheet } from '@app/interfaces/game-sheet';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RoomManagerService {
    guestNames: Subject<GuestPlayer[]>;
    refusedGuest: Subject<GuestPlayer>;
    acceptedGuest: Subject<GuestPlayer>;
    currentGuestRoom: Subject<ClassicRoom>;
    availableRooms: ClassicRoom[];
    availableRoomsEvent: Subject<ClassicRoom[]>;
    currentRoom: ClassicRoom;
    roomInfo: Subject<ClassicRoom>;
    goBack: Subject<boolean>;
    goBackLimited: BehaviorSubject<boolean>;
    isGameDeleted: Subject<boolean>;
    isSocketRemoved: Subject<boolean>;
    noGamesExist: Subject<boolean>;
    isRefreshed: Subject<boolean>;
    isCreated: BehaviorSubject<boolean>;
    isBddNotConnected: Subject<boolean>;

    // eslint-disable-next-line max-params
    constructor(
        private clientSocket: ClientSocketService,
        private router: Router,
        private classicManager: ClassicGameManagerService,
        private limitedManager: LimitedTimeService,
    ) {
        this.availableRooms = [];
        this.availableRoomsEvent = new Subject<ClassicRoom[]>();
        this.guestNames = new Subject<GuestPlayer[]>();
        this.refusedGuest = new Subject<GuestPlayer>();
        this.acceptedGuest = new Subject<GuestPlayer>();
        this.currentGuestRoom = new Subject<ClassicRoom>();
        this.roomInfo = new Subject<ClassicRoom>();
        this.goBack = new Subject<boolean>();
        this.isGameDeleted = new Subject<boolean>();
        this.isSocketRemoved = new Subject<boolean>();
        this.noGamesExist = new Subject<boolean>();
        this.isRefreshed = new Subject<boolean>();
        this.goBackLimited = new BehaviorSubject<boolean>(false);
        this.isCreated = new BehaviorSubject<boolean>(false);
        this.isBddNotConnected = new Subject<boolean>();
    }

    connect(): void {
        if (!this.clientSocket.isSocketAlive()) {
            this.clientSocket.connect();
        }
    }

    isConnected(): boolean {
        return this.clientSocket.isSocketAlive();
    }

    getRoomInfo(): Observable<ClassicRoom> {
        return this.roomInfo.asObservable();
    }

    removeGuests(room: ClassicRoom): void {
        this.clientSocket.send('removeAllGuests', room);
    }

    getAvailableRooms(): void {
        this.clientSocket.send('getMultRooms');
    }

    getAvailableLimitedModerooms(): void {
        this.clientSocket.send('getLimitedRooms');
    }

    createSoloGame(playerName: string, gameMode: string, gameInfo: GameData): void {
        this.clientSocket.send('createSoloRoom', { playerName, gameMode, gameInfo });
    }

    createGuest(guest: GuestPlayer, gameName: string): void {
        this.clientSocket.send('createGuest', { guest, gameName });
    }

    createMultiGame(hostName: string, gameMode: string, gameInfo: GameData): void {
        this.clientSocket.send('createMultRoom', { hostName, gameMode, gameInfo });
    }

    guestJoinRoom(room: ClassicRoom): void {
        this.clientSocket.send('connectGuestToRoom', room);
    }

    getSocketId(): string {
        return this.clientSocket.socket.id;
    }

    redirection(route: string): void {
        this.router.navigate([route]);
    }

    deleteRoom(room: ClassicRoom): void {
        this.clientSocket.send('deleteRoom', room);
    }

    deleteLimitedRoom(room: ClassicRoom): void {
        this.clientSocket.send('deleteLimitedRoom', room);
    }

    onRefresh(window: Window) {
        if (this.router.url === '/admin' || this.router.url === '/selection') window.location.reload();
    }

    refreshJoinButton(window: Window): void {
        if (this.router.url === '/limited-time') window.location.reload();
    }

    joinGuest(guest: GuestPlayer, createdRoom: ClassicRoom): void {
        this.clientSocket.send('joinRoom', { guest, createdRoom });
    }

    refuseGuest(guest: GuestPlayer, room: ClassicRoom): void {
        this.clientSocket.send('refuseGuest', { guest, room });
        if (this.clientSocket.socket.id === guest.id) this.clientSocket.disconnect();
    }

    startSoloGame(playerName: string, game: GameData): void {
        this.createSoloGame(playerName, 'Classic - solo', game);
        this.handleSocket();
        this.redirection('/game');
    }

    sendOnDelete(game: GameSheet): void {
        this.clientSocket.send('removedGame', game);
    }

    onAllGamesDeleted(): void {
        this.clientSocket.send('AllGamesDeleted');
    }

    updateGameSheet(): void {
        this.clientSocket.send('needsUpdate');
    }

    createLimitedSolo(playerName: string, games: GameData[]): void {
        for (const game of games) if (game) this.clientSocket.send('addLimitedGame', game);
        this.clientSocket.send('createLimitedSolo', playerName);
    }

    createLimitedMulti(playerName: string, games: GameData[]): void {
        for (const game of games) if (game) this.clientSocket.send('addLimitedGame', game);
        this.clientSocket.send('createLimitedMulti', playerName);
    }

    redirectGuest(playerName: string): void {
        this.clientSocket.send('connectGuestLimitedMode', playerName);
    }

    getConnexionStatus(): void {
        this.clientSocket.send('checkBDDConnection');
    }

    handleSocket(): void {
        this.clientSocket.on('createdSoloRoom', (room: ClassicRoom) => {
            this.classicManager.currentRoom = room;
            this.classicManager.roomInfo.next(room);
        });
        this.clientSocket.on('createdMultRoom', (room: ClassicRoom) => {
            this.currentRoom = room;
            this.roomInfo.next(room);
        });
        this.clientSocket.on('listOfAvailableRooms', (rooms: ClassicRoom[]) => {
            this.availableRooms = rooms;
            this.availableRoomsEvent.next(rooms);
        });
        this.clientSocket.on('listOfAvailableLimitedRooms', (room: ClassicRoom) => {
            if (room && this.limitedManager.isLimitedTimeGame) {
                this.availableRooms = [room];
                this.availableRoomsEvent.next(this.availableRooms);
            }
        });
        this.clientSocket.on('updatedRoom', (room: ClassicRoom) => {
            this.currentRoom = room;
            this.roomInfo.next(room);
            this.currentGuestRoom.next(room);
        });
        this.clientSocket.on('createdGuest', (guests: GuestPlayer[]) => {
            this.guestNames.next(guests);
        });
        this.clientSocket.on('refusedGuest', (guest: GuestPlayer) => {
            this.refusedGuest.next(guest);
        });
        this.clientSocket.on('acceptedGuest', (guest: GuestPlayer) => {
            this.acceptedGuest.next(guest);
        });
        this.clientSocket.on('removedAllGuests', (goBack: boolean) => {
            this.goBack.next(goBack);
        });
        this.clientSocket.on('gameStarted', (room: ClassicRoom) => {
            this.classicManager.currentRoom = room;
            this.redirection('/game');
            this.classicManager.roomInfo.next(room);
        });
        this.clientSocket.on('deletedGame', (isGameDeleted: boolean) => {
            this.isGameDeleted.next(isGameDeleted);
        });
        this.clientSocket.on('removedRefusedSockets', () => {
            this.isSocketRemoved.next(true);
        });
        this.clientSocket.on('createdLimitedSolo', (room: ClassicRoom) => {
            if (room) {
                this.limitedManager.isLimitedTimeGame.next(true);
                this.limitedManager.currentRoom = room;
                this.redirection('/game');
                this.limitedManager.roomInformation.next(room);
            } else {
                this.noGamesExist.next(true);
            }
        });
        this.clientSocket.on('createdLimitedMulti', (room: ClassicRoom) => {
            this.limitedManager.isLimitedTimeGame.next(true);
            this.limitedManager.currentRoom = room;
            this.redirection('/waiting-room');
            this.limitedManager.roomInformation.next(room);
        });
        this.clientSocket.on('startedLimitedMulti', (room: ClassicRoom) => {
            this.limitedManager.isLimitedTimeGame.next(true);
            this.limitedManager.currentRoom = room;
            this.redirection('/game');
            this.limitedManager.roomInformation.next(room);
        });
        this.clientSocket.on('goBackLimited', () => {
            this.limitedManager.isLimitedTimeGame.next(false);
            this.goBackLimited.next(true);
        });
        this.clientSocket.on('updateGameSheet', () => {
            this.isRefreshed.next(true);
        });
        this.clientSocket.on('roomIsCreated', () => {
            this.isCreated.next(true);
        });
        this.clientSocket.on('guestDidJoin', () => {
            this.refreshJoinButton(window);
            this.isCreated.next(false);
        });
        this.clientSocket.on('connectionStatus', (isBddNotConnected: boolean) => {
            this.isBddNotConnected.next(isBddNotConnected);
            if (isBddNotConnected) {
                alert('Erreur dans la connexion avec la base de donnees de MondoDB');
            }
        });
    }
}
