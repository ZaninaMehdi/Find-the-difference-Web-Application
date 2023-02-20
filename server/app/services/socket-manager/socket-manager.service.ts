import { SERVER_TIMEOUT } from '@app/constants';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { Point2d } from '@app/interfaces/point2d';
import { ClassicRoom, GuestPlayer, LimitedModeRoom } from '@app/interfaces/rooms';
import { ClassicModeService } from '@app/services/classicMode/classic-mode.service';
import { LimitedTimeService } from '@app/services/limitedMode/limited-mode.service';
import * as http from 'http';
import * as io from 'socket.io';
import { Service } from 'typedi';

@Service()
export class SocketManager {
    private server: io.Server;
    private limitedModeGames: GameData[];

    constructor(server: http.Server, private classicModeManager: ClassicModeService, private limitedModeManager: LimitedTimeService) {
        this.server = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        this.classicModeManager.server = this.server;
        this.limitedModeManager.server = this.server;
        this.limitedModeGames = [];
    }

    handleSockets(): void {
        this.server.on('connection', (socket) => {
            socket.on('createSoloRoom', async (object: { playerName: string; gameMode: string; gameInfo: GameData }) => {
                const room = await this.classicModeManager.createRoom(object.playerName, object.gameMode, object.gameInfo);
                room.hostId = socket.id;
                socket.join(room.roomId);
                this.classicModeManager.rooms.set(room.roomId, room);
                this.server.in(room.roomId).emit('createdSoloRoom', room);
            });

            socket.on('penalty', (room: ClassicRoom) => {
                if (room.gameMode === 'Classic - solo') this.classicModeManager.addPenalty(room);
                else if (room.gameMode === 'Temps Limite - solo') this.limitedModeManager.addPenalty(room);
            });

            socket.on('verifyCoords', (object: { room: ClassicRoom; coords: Point2d }) => {
                this.classicModeManager.verifyClickedCoordinates(socket, object.room, object.coords);
            });

            socket.on('checkStatus', (room: ClassicRoom) => {
                this.classicModeManager.endGame(socket, room);
            });

            socket.on('createMultRoom', async (object: { hostName: string; gameMode: string; gameInfo: GameData }) => {
                const room = await this.classicModeManager.createRoom(object.hostName, object.gameMode, object.gameInfo);
                room.hostId = socket.id;
                socket.join(room.roomId);

                room.guestInfo = {
                    id: '',
                    guestName: '',
                    differencesFound: 0,
                };

                this.classicModeManager.setGuestInfo(room);
                this.classicModeManager.guests.set(room.roomId, []);
                this.server.to(room.roomId).emit('createdMultRoom', room);
                this.updateAvailableRooms();
            });

            socket.on('getMultRooms', () => {
                this.updateAvailableRooms();
            });

            socket.on('deleteRoom', (room: ClassicRoom) => {
                this.classicModeManager.deleteRoomAndDisconnectSockets(socket, room);
            });

            socket.on('createGuest', (object: { guest: GuestPlayer; gameName: string }) => {
                this.classicModeManager.addNameToGuestList(socket, object.guest, object.gameName);
            });

            socket.on('joinRoom', (object: { guest: GuestPlayer; createdRoom: ClassicRoom }) => {
                const updatedRoom = this.classicModeManager.addGuestPlayer(object.guest, object.createdRoom);

                if (updatedRoom) {
                    this.server.in(updatedRoom.roomId).emit('updatedRoom', updatedRoom);
                    this.server.in(updatedRoom.roomId).emit('acceptedGuest', object.guest);
                    this.server.to(updatedRoom.hostId).emit('gameStarted', updatedRoom);
                }

                this.updateAvailableRooms();
            });

            socket.on('connectGuestToRoom', async (multiplayerRoom: ClassicRoom) => {
                this.server.to(multiplayerRoom.hostId).emit('createdGuest', this.classicModeManager.guests.get(multiplayerRoom.roomId));
                this.classicModeManager.refuseSockets(multiplayerRoom);
                this.classicModeManager.guests.delete(multiplayerRoom.roomId);
            });

            socket.on('needsUpdate', () => {
                this.server.emit('updateGameSheet');
            });

            socket.on('disconnect', () => {
                for (const [roomId, guestList] of this.classicModeManager.guests.entries()) {
                    this.removeDisconnectedGuest(guestList, socket.id, roomId);
                }

                const room = this.classicModeManager.getRoomById(socket.id);
                const limitedRoom = this.limitedModeManager.getRoomById(socket.id);
                if (limitedRoom && !limitedRoom.guestInfo) this.limitedModeManager.deleteRoomAndDisconnectSockets(socket, limitedRoom);
                else if (limitedRoom) this.limitedModeManager.playerQuitMultiGame(socket, limitedRoom);
                else {
                    if (room) this.classicModeManager.playerAbandoned(socket, room);
                    if (room && room.guestInfo) this.onRefresh(socket, room);
                    else if (room) this.classicModeManager.deleteRoomAndDisconnectSockets(socket, room);
                }
            });

            socket.on('refuseGuest', (object: { guest: GuestPlayer; room: ClassicRoom }) => {
                if (object.room) {
                    this.classicModeManager.refuseGuest(object.guest, object.room);
                    this.server.to(object.room.roomId).emit('createdGuest', this.classicModeManager.guests.get(object.room.roomId));
                    this.server.to(object.room.roomId).emit('refusedGuest', object.guest);
                }
            });

            socket.on('removeAllGuests', (room: ClassicRoom) => {
                if (room) {
                    this.classicModeManager.guests.delete(room.roomId);
                    this.server.to(room.roomId).emit('removedAllGuests', true);
                }
            });

            socket.on('chatMessage', (object: { room: ClassicRoom; message: string }) => {
                this.classicModeManager.sendMessageToRoom(socket, object.room, object.message);
            });

            socket.on('removedGame', (game: GameSheet) => {
                this.classicModeManager.removeRoomOnDeleteGame(game);
                this.server.emit('isRefreshed');
            });

            socket.on('AllGamesDeleted', () => {
                this.server.emit('deletedGame', true);
            });

            socket.on('createLimitedSolo', async (playerName: string) => {
                const room = await this.limitedModeManager.createRoom(playerName, 'Temps Limite - solo', this.limitedModeGames);
                this.limitedModeGames = [];
                if (room) {
                    room.hostId = socket.id;
                    socket.join(room.roomId);
                    this.server.to(room.roomId).emit('createdLimitedSolo', room);
                } else this.server.to(socket.id).emit('noGames');
            });

            socket.on('createLimitedMulti', async (playerName: string) => {
                const room = await this.limitedModeManager.createRoom(playerName, 'Temps Limite 1v1', this.limitedModeGames);
                this.limitedModeGames = [];
                if (room) {
                    room.hostId = socket.id;
                    const roomElement: LimitedModeRoom = this.limitedModeManager.rooms.get(room.roomId) as LimitedModeRoom;
                    room.guestInfo = {
                        id: '',
                        guestName: '',
                    };

                    this.limitedModeManager.rooms.set(room.roomId, { room, gameList: roomElement.gameList });
                    socket.join(room.roomId);
                    this.server.to(room.roomId).emit('createdLimitedMulti', room);
                    this.server.emit('roomIsCreated');
                }
            });

            socket.on('verifyCoordsLimitedMode', (object: { room: ClassicRoom; coords: Point2d; isMainCanvas: boolean }) => {
                this.limitedModeManager.iterateDifferenceLocations(socket, object.room, object.coords, object.isMainCanvas);
            });

            socket.on('getLimitedRooms', () => {
                this.updateAvailablLimitedRooms();
            });

            socket.on('addLimitedGame', (game: GameData) => {
                this.limitedModeGames.push(game);
            });

            socket.on('connectGuestLimitedMode', (playerName: string) => {
                this.limitedModeManager.startMultiGame(socket, playerName);
                this.server.emit('guestDidJoin');
            });

            socket.on('deleteLimitedRoom', (room: ClassicRoom) => {
                this.limitedModeManager.deleteRoomAndDisconnectSockets(socket, room);
                this.updateAvailablLimitedRooms();
                this.server.emit('goBackLimited');
            });

            socket.on('checkBDDConnection', () => {
                this.server.emit('connectionStatus', this.limitedModeManager.getClientConnection());
            });
        });

        setInterval(() => {
            for (const room of this.classicModeManager.rooms.values()) {
                if (room.guestInfo?.guestName !== '') this.classicModeManager.updateTimer(room);
            }
            for (const element of this.limitedModeManager.rooms.values()) {
                if (element.room.guestInfo?.guestName !== '') this.limitedModeManager.updateTimer(element.room, element.gameList);
            }
        }, SERVER_TIMEOUT);
    }

    updateAvailableRooms(): void {
        this.server.emit('listOfAvailableRooms', this.classicModeManager.listAvailableRooms());
    }

    updateAvailablLimitedRooms(): void {
        this.server.emit('listOfAvailableLimitedRooms', this.limitedModeManager.listAvailableRoom());
    }

    onRefresh(socket: io.Socket, room: ClassicRoom): void {
        if (this.classicModeManager.isHost(socket, room)) room.endGameMessage = this.classicModeManager.setMessageOnRefresh(room.playerName);
        else room.endGameMessage = this.classicModeManager.setMessageOnRefresh((room.guestInfo as GuestPlayer).guestName);

        this.server.to(room.roomId).emit('removedAllGuests', true);
        this.classicModeManager.onMultiRoomAbandon(socket, room);
    }

    removeDisconnectedGuest(guestList: GuestPlayer[], socketId: string, roomId: string): void {
        for (const guest of guestList) {
            if (guest.id === socketId) {
                const index = (this.classicModeManager.guests.get(roomId) as GuestPlayer[]).indexOf(guest);
                if (index >= 0) (this.classicModeManager.guests.get(roomId) as GuestPlayer[]).splice(index, 1);
                this.server.to(roomId).emit('createdGuest', this.classicModeManager.guests.get(roomId));
                break;
            }
        }
    }
}
