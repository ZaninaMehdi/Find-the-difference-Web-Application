/* eslint-disable max-lines */
import { BEGIN_SUBSTRING_NUMBER, FIRST_INDEX, INDEX_NOT_FOUND, KEY_SIZE, LAST_INDEX, NUMBER_LENGTH_FOR_KEY } from '@app/constants';
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { AdminService } from '@app/services/admin/admin.service';
import * as io from 'socket.io';
import { Service } from 'typedi';

@Service()
export class ClassicModeService {
    rooms: Map<string, ClassicRoom>;
    server: io.Server;
    guests: Map<string, GuestPlayer[]>;

    constructor(private adminService: AdminService) {
        this.rooms = new Map<string, ClassicRoom>();
        this.guests = new Map<string, GuestPlayer[]>();
    }

    generateRoomId(): string {
        return Math.random().toString(NUMBER_LENGTH_FOR_KEY).substring(BEGIN_SUBSTRING_NUMBER, KEY_SIZE);
    }

    async createRoom(name: string, gameMode: string, gameInfo: GameData): Promise<ClassicRoom> {
        const adminConstants = await this.adminService.getConstants();
        return {
            hostId: '',
            roomId: this.generateRoomId(),
            playerName: name,
            hintPenalty: adminConstants[0].penaltyTime,
            game: gameInfo,
            gameMode,
            timer: 0,
            differencesFound: 0,
            endGameMessage: '',
            currentDifference: [],
        };
    }

    updateTimer(room: ClassicRoom): void {
        room.timer++;
        this.rooms.set(room.roomId, room);
        this.server.to(room.roomId).emit('timerStarted', room.timer);
    }

    addPenalty(room: ClassicRoom): void {
        room.timer += room.hintPenalty;
        this.rooms.set(room.roomId, room);
        this.server.to(room.roomId).emit('askHint', (this.rooms.get(room.roomId) as ClassicRoom).playerName);
    }

    iterateDifferenceLocations(socket: io.Socket, room: ClassicRoom, coords: Point2d): number {
        for (let diffIndex = 0; diffIndex < room.game.gameSheet.differenceLocations.length; diffIndex++) {
            for (const coord of room.game.gameSheet.differenceLocations[diffIndex]) {
                if (coord.x === coords.x && coord.y === coords.y) {
                    if (room.guestInfo && socket.id === room.guestInfo.id && (room.guestInfo.differencesFound as number).valueOf) {
                        (room.guestInfo.differencesFound as number)++;
                        this.server.to(room.roomId).emit('differenceFound', room.guestInfo.guestName);
                    } else {
                        room.differencesFound++;
                        this.server.to(room.roomId).emit('differenceFound', room.playerName);
                    }

                    room.currentDifference = room.game.gameSheet.differenceLocations[diffIndex];
                    this.rooms.set(room.roomId, room);
                    return diffIndex;
                }
            }
        }

        return INDEX_NOT_FOUND;
    }

    verifyClickedCoordinates(socket: io.Socket, room: ClassicRoom, coords: Point2d): void {
        const differenceIndex = this.iterateDifferenceLocations(socket, room, coords);
        const updatedRoom = this.rooms.get(room.roomId) as ClassicRoom;

        if (differenceIndex >= 0) {
            updatedRoom.game.gameSheet.differenceLocations.splice(differenceIndex, 1);
            this.server.to(room.roomId).emit('removedFoundDiff', updatedRoom);
        } else {
            updatedRoom.currentDifference = [];
            this.server.to(socket.id).emit('removedFoundDiff', updatedRoom);

            if (updatedRoom.guestInfo && socket.id === updatedRoom.guestInfo.id) {
                this.server.to(room.roomId).emit('differenceError', updatedRoom.guestInfo.guestName);
            } else {
                this.server.to(room.roomId).emit('differenceError', updatedRoom.playerName);
            }
        }

        this.rooms.set(updatedRoom.roomId, updatedRoom);
    }

    minimumDifferences(room: ClassicRoom): number {
        return room.game.gameSheet.differenceCounter % 2 === 0
            ? Math.floor(room.game.gameSheet.differenceCounter / 2)
            : Math.floor(room.game.gameSheet.differenceCounter / 2) + 1;
    }

    getRoomById(socketId: string): ClassicRoom | void {
        for (const room of this.rooms.values()) {
            if (room.hostId === socketId || room.guestInfo?.id === socketId) {
                return room;
            }
        }
    }

    isHost(socket: io.Socket, room: ClassicRoom): boolean {
        return room.hostId === socket.id;
    }

    setMessageOnRefresh(playerLeft: string): string {
        return `Le joueur ${playerLeft} a abandonne le jeu. Vous avez gagné. Cliquez sur revenir pour être redirigés vers la page sélection.`;
    }

    deleteRoomAndDisconnectSockets(socket: io.Socket, room: ClassicRoom): void {
        socket.to(room.roomId).disconnectSockets();
        this.rooms.delete(room.roomId);
    }

    onMultiRoomAbandon(socket: io.Socket, room: ClassicRoom): void {
        socket.broadcast.to(room.roomId).emit('finishedGame', room.endGameMessage);
        this.server.to(socket.id).emit('hasAbondonnedGame', true);
        this.deleteRoomAndDisconnectSockets(socket, room);
    }

    playerAbandoned(socket: io.Socket, room: ClassicRoom): void {
        if (room.guestInfo && socket.id === room.guestInfo.id) socket.broadcast.to(room.roomId).emit('playerLeft', room.guestInfo.guestName);
        else if (socket.id === room.hostId) socket.broadcast.to(room.roomId).emit('playerLeft', room.playerName);
    }

    finishGame(room: ClassicRoom, socket: io.Socket): void {
        this.server.to(room.roomId).emit('finishedGame', room.endGameMessage);
        this.deleteRoomAndDisconnectSockets(socket, room);
    }

    compareTwoBestTimes(bestTimes1: BestTimes[], bestTimes2: BestTimes[]): boolean {
        return (
            bestTimes1.length === bestTimes2.length &&
            bestTimes1.every((bestTime1) => bestTimes2.some((bestTime2) => bestTime1.name === bestTime2.name && bestTime1.time === bestTime2.time))
        );
    }

    async isNewBestTime(room: ClassicRoom, sortedBestTimes: BestTimes[], gameBestTimes: BestTimes[]): Promise<boolean> {
        return this.compareTwoBestTimes(gameBestTimes, sortedBestTimes);
    }

    getSortedTimes(winnerName: string, timer: number, bestTimesMode: BestTimes[]): BestTimes[] {
        return this.sortTimes(bestTimesMode, { name: winnerName, time: timer });
    }

    findPosition(winnerName: string, timer: number, sortedBestTimes: BestTimes[]): number {
        return sortedBestTimes.findIndex((element) => {
            return element.name === winnerName && element.time === timer;
        });
    }

    sendBestTime(winnerName: string, room: ClassicRoom, sortedBestTimes: BestTimes[]): void {
        this.server.emit('newBestTime', {
            winnerName,
            index: this.findPosition(winnerName, room.timer, sortedBestTimes) + 1,
            gameMode: room.gameMode,
            gameName: room.game.gameTimes.name,
            roomId: room.roomId,
        });
    }

    sortTimes(bestTimes: BestTimes[], newTime: BestTimes) {
        bestTimes.push(newTime);
        return bestTimes.sort((a, b) => a.time - b.time).slice(FIRST_INDEX, LAST_INDEX);
    }

    setMessageOnEndGameMultiplayer(winner: string, loser: string): string {
        return `Le joueur ${winner} a gagne et le joueur ${loser} a perdu.
        Vous allez être redirigés vers la page sélection.`;
    }

    setMessageOnEndGameSolo(differencesNumber: number): string {
        return `Félicitations! Vous avez pu trouver les ${differencesNumber} différences!
        Vous allez être redirigés vers la page sélection.`;
    }

    setMessageOnNewBestTimeMultiplayer(recordHolder: string, loser: string, position: number): string {
        return (
            this.setMessageOnEndGameMultiplayer(recordHolder, loser) +
            ` Le joueur ${recordHolder} obtient la position ${position} dans les meilleurs temps.`
        );
    }

    setMessageOnNewBestTimeSolo(recordHolder: string, position: number, differencesNumber: number): string {
        return (
            this.setMessageOnEndGameSolo(differencesNumber) + ` Le joueur ${recordHolder} obtient la position ${position} dans les meilleurs temps.`
        );
    }

    // eslint-disable-next-line max-params
    setBestTime(room: ClassicRoom, socket: io.Socket, sortedTimes: BestTimes[], player: string): void {
        this.finishGame(room, socket);
        this.sendBestTime(player, room, sortedTimes);
        this.adminService.updateGameBestTimes(room, sortedTimes);
    }

    async endGame(socket: io.Socket, room: ClassicRoom): Promise<void> {
        if (room.guestInfo) {
            if (room.differencesFound === this.minimumDifferences(room)) {
                const bestTimes = (await this.adminService.getGameBestTimes(room))[0];
                if (bestTimes === undefined) {
                    room.endGameMessage = this.setMessageOnEndGameMultiplayer(room.playerName, room.guestInfo.guestName);
                    this.finishGame(room, socket);
                } else {
                    const sortedTimes = this.getSortedTimes(room.playerName, room.timer, bestTimes.bestMultiplayerTimes);
                    if (!(await this.isNewBestTime(room, sortedTimes, bestTimes.bestMultiplayerTimes))) {
                        room.endGameMessage = this.setMessageOnNewBestTimeMultiplayer(
                            room.playerName,
                            room.guestInfo.guestName,
                            this.findPosition(room.playerName, room.timer, sortedTimes) + 1,
                        );
                        this.setBestTime(room, socket, sortedTimes, room.playerName);
                    } else {
                        room.endGameMessage = this.setMessageOnEndGameMultiplayer(room.playerName, room.guestInfo.guestName);
                        this.finishGame(room, socket);
                    }
                }
            }
            if (room.guestInfo.differencesFound === this.minimumDifferences(room)) {
                const bestTimes = (await this.adminService.getGameBestTimes(room))[0];
                if (bestTimes === undefined) {
                    room.endGameMessage = this.setMessageOnEndGameMultiplayer(room.guestInfo.guestName, room.playerName);
                    this.finishGame(room, socket);
                } else {
                    const sortedTimes = this.getSortedTimes(
                        room.guestInfo.guestName,
                        room.timer,
                        (await this.adminService.getGameBestTimes(room))[0].bestMultiplayerTimes,
                    );
                    if (!(await this.isNewBestTime(room, sortedTimes, (await this.adminService.getGameBestTimes(room))[0].bestMultiplayerTimes))) {
                        room.endGameMessage = this.setMessageOnNewBestTimeMultiplayer(
                            room.guestInfo.guestName,
                            room.playerName,
                            this.findPosition(room.guestInfo.guestName, room.timer, sortedTimes) + 1,
                        );
                        this.setBestTime(room, socket, sortedTimes, room.guestInfo.guestName);
                    } else {
                        room.endGameMessage = this.setMessageOnEndGameMultiplayer(room.guestInfo.guestName, room.playerName);
                        this.finishGame(room, socket);
                    }
                }
            }
        } else {
            if (room.game.gameSheet.differenceCounter === room.differencesFound) {
                const bestTimes = (await this.adminService.getGameBestTimes(room))[0];
                if (bestTimes === undefined) {
                    room.endGameMessage = this.setMessageOnEndGameSolo(room.game.gameSheet.differenceCounter);
                    this.finishGame(room, socket);
                } else {
                    const sortedTimes = this.getSortedTimes(
                        room.playerName,
                        room.timer,
                        (await this.adminService.getGameBestTimes(room))[0].bestSoloTimes,
                    );
                    if (!(await this.isNewBestTime(room, sortedTimes, (await this.adminService.getGameBestTimes(room))[0].bestSoloTimes))) {
                        room.endGameMessage = this.setMessageOnNewBestTimeSolo(
                            room.playerName,
                            this.findPosition(room.playerName, room.timer, sortedTimes) + 1,
                            room.game.gameSheet.differenceCounter,
                        );
                        this.setBestTime(room, socket, sortedTimes, room.playerName);
                    } else {
                        room.endGameMessage = this.setMessageOnEndGameSolo(room.game.gameSheet.differenceCounter);
                        this.finishGame(room, socket);
                    }
                }
            }
        }
    }

    listAvailableRooms(): ClassicRoom[] {
        const availableMultRooms: ClassicRoom[] = [];
        for (const room of this.rooms.values()) {
            if (this.isAvailable(room)) {
                availableMultRooms.push(room);
            }
        }

        return availableMultRooms;
    }

    isAvailable(room: ClassicRoom): boolean {
        return room.guestInfo?.id === '' && room.gameMode === 'Classic 1v1';
    }

    addGuestPlayer(guest: GuestPlayer, room: ClassicRoom): ClassicRoom | void {
        const updatedRoom = this.rooms.get(room.roomId);

        if (updatedRoom && updatedRoom.guestInfo) {
            updatedRoom.roomTaken = true;
            updatedRoom.guestInfo.id = guest.id;
            updatedRoom.guestInfo.guestName = guest.guestName;
            this.rooms.set(room.roomId, updatedRoom);
        }

        return updatedRoom;
    }

    setGuestInfo(room: ClassicRoom): void {
        this.rooms.set(room.roomId, room);
    }

    refuseGuest(guest: GuestPlayer, room: ClassicRoom): void {
        let indexFound = -1;
        const guestList = this.guests.get(room.roomId);
        if (guestList)
            for (let index = 0; index < guestList.length; index++) {
                if (guestList[index].id === guest.id) {
                    indexFound = index;
                    break;
                }
            }

        if (indexFound >= 0) (this.guests.get(room.roomId) as GuestPlayer[]).splice(indexFound, 1);
    }

    addNameToGuestList(socket: io.Socket, guest: GuestPlayer, gameName: string): void {
        for (const room of this.rooms.values()) {
            if (room.gameMode === 'Classic 1v1' && room.game.gameSheet.name === gameName && !room.roomTaken) {
                const guestList = this.guests.get(room.roomId);
                if (guestList) {
                    guestList.push(guest);
                    this.guests.set(room.roomId, guestList);
                }

                socket.join(room.roomId);
                this.server.to(room.roomId).emit('updatedRoom', room);
                this.server.to(room.hostId).emit('createdGuest', guestList);
                break;
            }
        }
    }

    sendMessageToRoom(socket: io.Socket, room: ClassicRoom, message: string): void {
        socket.broadcast.to(room.roomId).emit('messageSent', message);
    }

    removeRoomOnDeleteGame(game: GameSheet): void {
        for (const index of this.rooms.values()) {
            if (game.name === index.game.gameSheet.name) {
                this.server.to(index.roomId).emit('deletedGame', true);
                break;
            }
        }
    }

    async refuseSockets(room: ClassicRoom): Promise<void> {
        const sockets = await this.server.in(room.roomId).fetchSockets();

        for (const clientSocket of sockets) {
            if (clientSocket.id !== room.hostId && clientSocket.id !== (room.guestInfo as GuestPlayer).id) {
                this.server.to(clientSocket.id).emit('removedRefusedSockets');
                clientSocket.disconnect();
            }
        }

        this.server.in(room.roomId).emit('gameStarted', room);
    }
}
