import { BEGIN_SUBSTRING_NUMBER, KEY_SIZE, MAX_TIME, NUMBER_LENGTH_FOR_KEY } from '@app/constants';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { GameData } from '@app/interfaces/game-data';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom, GuestPlayer, LimitedModeRoom } from '@app/interfaces/rooms';
import { AdminService } from '@app/services/admin/admin.service';
import * as io from 'socket.io';
import { Service } from 'typedi';

@Service()
export class LimitedTimeService {
    rooms: Map<string, { room: ClassicRoom; gameList: GameData[] }>;
    server: io.Server;

    constructor(private adminService: AdminService) {
        this.rooms = new Map<string, { room: ClassicRoom; gameList: GameData[] }>();
    }

    generateRoomId(): string {
        return Math.random().toString(NUMBER_LENGTH_FOR_KEY).substring(BEGIN_SUBSTRING_NUMBER, KEY_SIZE);
    }

    async createRoom(playerName: string, gameMode: string, games: GameData[]): Promise<ClassicRoom | void> {
        const shuffledGames = this.shuffleGames(games);
        const adminConstants: AdminConstants = await this.adminService.getConstants();
        if (shuffledGames) {
            const room: ClassicRoom = {
                hostId: '',
                roomId: this.generateRoomId(),
                playerName,
                hintPenalty: adminConstants[0].penaltyTime,
                game: shuffledGames.pop() as GameData,
                gameMode,
                timer: adminConstants[0].initialTime,
                differencesFound: 0,
                endGameMessage: '',
                currentDifference: [],
            };

            this.rooms.set(room.roomId, { room, gameList: shuffledGames });
            return room;
        }
    }

    playerQuitMultiGame(socket: io.Socket, room: ClassicRoom): void {
        const multiRoomElement: LimitedModeRoom = this.rooms.get(room.roomId) as LimitedModeRoom;

        if (socket.id === multiRoomElement.room.hostId) {
            this.server.to(multiRoomElement.room.roomId).emit('playerLeft', multiRoomElement.room.playerName);
            multiRoomElement.room.hostId = (multiRoomElement.room.guestInfo as GuestPlayer).id;
            multiRoomElement.room.playerName = (multiRoomElement.room.guestInfo as GuestPlayer).guestName;
        } else {
            this.server.to(multiRoomElement.room.roomId).emit('playerLeft', (multiRoomElement.room.guestInfo as GuestPlayer).guestName);
        }

        multiRoomElement.room.guestInfo = undefined;
        this.rooms.set(multiRoomElement.room.roomId, multiRoomElement);

        socket.leave(multiRoomElement.room.roomId);
        socket.disconnect();
        this.server.to(multiRoomElement.room.roomId).emit('newGame', multiRoomElement.room);
    }

    updateTimer(room: ClassicRoom, games: GameData[]): void {
        room.timer--;
        this.rooms.set(room.roomId, { room, gameList: games });
        this.server.to(room.roomId).emit('countDownStarted', room.timer);
        if (room.timer === 0) this.rooms.delete(room.roomId);
    }

    deleteRoomAndDisconnectSockets(socket: io.Socket, room: ClassicRoom): void {
        socket.to(room.roomId).disconnectSockets();
        this.rooms.delete(room.roomId);
    }

    addPenalty(room: ClassicRoom): void {
        const games: GameData[] = (this.rooms.get(room.roomId) as LimitedModeRoom).gameList;
        room.timer -= room.hintPenalty;
        this.rooms.set(room.roomId, { room, gameList: games });
        this.server.to(room.roomId).emit('askHint', (this.rooms.get(room.roomId) as LimitedModeRoom).room.playerName);
    }

    // eslint-disable-next-line max-params
    async iterateDifferenceLocations(socket: io.Socket, room: ClassicRoom, coords: Point2d, isMainCanvas: boolean): Promise<void> {
        const games: GameData[] = (this.rooms.get(room.roomId) as LimitedModeRoom).gameList;
        const adminConstants: AdminConstants = await this.adminService.getConstants();
        let isFound = false;
        for (const difference of room.game.gameSheet.differenceLocations) {
            for (const coord of difference) {
                if (coord.x === coords.x && coord.y === coords.y) {
                    isFound = true;
                    room.differencesFound++;
                    room.timer += adminConstants[0].bonusTime;
                    if (room.timer > MAX_TIME) room.timer = 120;
                    const game = games.pop();
                    if (game) room.game = game;
                    else {
                        this.server.to(room.roomId).emit('noMoreGames');
                        this.deleteRoomAndDisconnectSockets(socket, room);
                    }
                    this.rooms.set(room.roomId, { room, gameList: games });
                    this.server.to(room.roomId).emit('foundDifference', { difference, isMainCanvas });
                    this.sendDifferenceMessage(room, socket.id, 'differenceFound');
                    this.server.to(room.roomId).emit('newGame', room);
                    break;
                }
            }
        }

        if (!isFound) {
            this.sendDifferenceMessage(room, socket.id, 'differenceError');
            this.server.to(socket.id).emit('foundDifference', { difference: [], isMainCanvas });
        }
    }

    sendDifferenceMessage(room: ClassicRoom, socketId: string, key: string): void {
        if (room.guestInfo && socketId === room.guestInfo.id) {
            this.server.to(room.roomId).emit(key, room.guestInfo.guestName);
        } else {
            this.server.to(room.roomId).emit(key, room.playerName);
        }
    }

    listAvailableRoom(): ClassicRoom | void {
        for (const roomElement of this.rooms.values()) {
            if (this.isAvailable(roomElement.room)) {
                return roomElement.room;
            }
        }
    }

    isAvailable(room: ClassicRoom): boolean {
        return room.guestInfo?.id === '' && room.gameMode === 'Temps Limite 1v1';
    }

    startMultiGame(socket: io.Socket, playerName: string): void {
        const multiplayerRoom: ClassicRoom = this.listAvailableRoom() as ClassicRoom;
        (multiplayerRoom.guestInfo as GuestPlayer) = {
            id: socket.id,
            guestName: playerName,
        };
        socket.join(multiplayerRoom.roomId);

        this.rooms.set(multiplayerRoom.roomId, {
            room: multiplayerRoom,
            gameList: (this.rooms.get(multiplayerRoom.roomId) as LimitedModeRoom).gameList,
        });
        this.server.to(multiplayerRoom.roomId).emit('startedLimitedMulti', multiplayerRoom);
    }

    getRoomById(socketId: string): ClassicRoom | void {
        for (const roomElement of this.rooms.values()) {
            if (roomElement.room.hostId === socketId || roomElement.room.guestInfo?.id === socketId) {
                return roomElement.room;
            }
        }
    }

    shuffleGames(games: GameData[]): GameData[] {
        let currentIndex = games.length;
        let randomIndex: number;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [games[currentIndex], games[randomIndex]] = [games[randomIndex], games[currentIndex]];
        }
        return games;
    }

    getClientConnection(): boolean {
        return this.adminService.getClientConnection();
    }
}
