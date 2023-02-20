/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-lines */
/* eslint-disable import/no-named-as-default */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { GameTimes } from '@app/interfaces/game-times';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { ServerGameSheet } from '@app/interfaces/server-game-sheet';
import { Server } from '@app/server';
import { SocketManager } from '@app/services/socket-manager/socket-manager.service';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as inOut from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import Container from 'typedi';

describe('SocketManager Service Tests', () => {
    let socketManager: SocketManager;
    let server: Server;
    let clientSocket: Socket;
    const urlString = 'http://localhost:3000';
    let defaultBestTimes: BestTimes[];
    let baseGameSheet: GameSheet;
    let serverGameSheet: ServerGameSheet;
    let gameTime: GameTimes;
    let finalGame: GameData;
    let mockRoom: ClassicRoom;
    let mockGuest: GuestPlayer;
    let socket: inOut.Socket;

    const mockServerSocket = {
        id: 'socketId',
        emit: <T>(event: string, data?: T) => {
            return { event, data };
        },
        join: (room: string) => {
            return room;
        },
        // eslint-disable-next-line no-unused-vars
        to: (room: string) => {
            return {
                disconnectSockets: () => {
                    return;
                },
            };
        },
        leave: (room: string) => {
            return room;
        },
    };

    beforeEach((done) => {
        const timeout = setTimeout(() => {
            done();
        }, 5 * 1000);
        if (clientSocket) clientSocket.disconnect();
        sinon.restore();
        if (socketManager)
            socketManager['server'].close(() => {
                clearTimeout(timeout);
                done();
            });
        else {
            clearTimeout(timeout);
            done();
        }
    });

    beforeEach(() => {
        server = Container.get(Server);
        server['socketManager'];
        server.init();
        socketManager = server['socketManager'];
        socket = mockServerSocket as unknown as inOut.Socket;

        defaultBestTimes = [
            { name: 'John Doe', time: 100 },
            { name: 'Jane Doe', time: 200 },
            { name: 'the scream', time: 250 },
        ];
        serverGameSheet = {
            originalLink: '../../../assets/bmp_640',
            modifiedLink: '../../../assets/bmp_640',
            differenceCounter: 0,
            differenceLocations: [[]],
            name: 'image',
        };
        baseGameSheet = {
            name: 'image',
            soloBestTimes: defaultBestTimes,
            multiplayerBestTimes: [],
            link: 'link',
        };
        gameTime = {
            name: baseGameSheet.name,
            bestSoloTimes: defaultBestTimes,
            bestMultiplayerTimes: defaultBestTimes,
        };
        finalGame = {
            gameSheet: serverGameSheet,
            gameTimes: gameTime,
        };
        mockRoom = {
            roomId: 'roomId',
            hostId: 'hostId',
            playerName: '',
            hintPenalty: 1,
            game: finalGame,
            gameMode: 'Classic - solo',
            timer: 0,
            differencesFound: 0,
            endGameMessage: '',
            currentDifference: [],
        };
        mockGuest = {
            id: 'id',
            guestName: 'name',
        };
    });

    beforeEach((done) => {
        const timeout = setTimeout(() => {
            done();
        }, 1000);

        let isDone = false;
        socketManager['server'].on('connection', (socket: unknown) => {
            if (!isDone) {
                isDone = true;
                clearTimeout(timeout);
                done();
            }
        });
        clientSocket = ioClient(urlString);
    });

    it('should call createSoloRoom method', (done) => {
        const returnedRoom: ClassicRoom = mockRoom;
        const createSoloRoomStub = sinon.stub(socketManager['classicModeManager'], 'createRoom').resolves(returnedRoom);
        clientSocket.emit('createSoloRoom', { playerName: 'name', gameMode: 'Classic - solo', gameInfo: finalGame });

        setTimeout(() => {
            expect(createSoloRoomStub.called).to.be.true;
            done();
        }, 1000);
    });

    it('should check the database connexion', (done) => {
        const emitStub = sinon.stub(socketManager['server'], 'emit');
        clientSocket.emit('checkBDDConnection');

        setTimeout(() => {
            expect(emitStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should call penalty method', (done) => {
        const addPenaltyStub = sinon.stub(socketManager['classicModeManager'], 'addPenalty');
        clientSocket.emit('penalty', mockRoom);

        setTimeout(() => {
            expect(addPenaltyStub.called).to.be.true;
            done();
        }, 1000);
    });

    it('should call penalty method for limitedMode', (done) => {
        mockRoom.gameMode = 'Temps Limite - solo';
        const addPenaltyStub = sinon.stub(socketManager['limitedModeManager'], 'addPenalty');
        clientSocket.emit('penalty', mockRoom);

        setTimeout(() => {
            expect(addPenaltyStub.called).to.be.true;
            done();
        }, 1000);
    });

    it('should not call penalty method', (done) => {
        mockRoom.gameMode = 'Temps Limite - 1v1';
        const addPenaltyStub = sinon.stub(socketManager['classicModeManager'], 'addPenalty');
        const addPenaltyStub2 = sinon.stub(socketManager['limitedModeManager'], 'addPenalty');
        clientSocket.emit('penalty', mockRoom);

        setTimeout(() => {
            expect(addPenaltyStub.called).to.be.false;
            expect(addPenaltyStub2.called).to.be.false;
            done();
        }, 500);
    });

    it('should call verifyCoords method', (done) => {
        const verifyCoordsStub = sinon.stub(socketManager['classicModeManager'], 'verifyClickedCoordinates');
        clientSocket.emit('verifyCoords', { room: mockRoom, coords: { x: 6, y: 9 } });

        setTimeout(() => {
            expect(verifyCoordsStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should call checkStatus method', (done) => {
        const endGameStub = sinon.stub(socketManager['classicModeManager'], 'endGame');
        clientSocket.emit('checkStatus', mockRoom);

        setTimeout(() => {
            expect(endGameStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should call updatetimer', (done) => {
        const updateTimerStub = sinon.stub(socketManager['classicModeManager'], 'updateTimer');
        const updateTimerStub2 = sinon.stub(socketManager['limitedModeManager'], 'updateTimer');
        socketManager['classicModeManager'].rooms.set(mockRoom.roomId, mockRoom);
        socketManager['limitedModeManager'].rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });

        setTimeout(() => {
            expect(updateTimerStub.called).to.be.true;
            expect(updateTimerStub.calledOnce).to.be.true;
            expect(updateTimerStub2.calledOnce).to.be.true;
            done();
        }, 1000);
    });

    it('should not update timer during multiplayer game if guestName is not set', (done) => {
        mockGuest.guestName = '';
        mockRoom.guestInfo = mockGuest;
        socketManager['classicModeManager'].rooms.set(mockRoom.roomId, mockRoom);
        socketManager['limitedModeManager'].rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        const updateTimerStub = sinon.stub(socketManager['classicModeManager'], 'updateTimer');
        const updateTimerStub2 = sinon.stub(socketManager['limitedModeManager'], 'updateTimer');

        setTimeout(() => {
            expect(updateTimerStub.called).to.be.false;
            expect(updateTimerStub2.called).to.be.false;
            done();
        }, 1000);
    });

    it('should call create a multiplayer room', (done) => {
        const returnedRoom: ClassicRoom = mockRoom;
        const createRoomStub = sinon.stub(socketManager['classicModeManager'], 'createRoom').resolves(returnedRoom);
        const setGuestInfoStub = sinon.stub(socketManager['classicModeManager'], 'setGuestInfo');
        const updateAvailableRoomsStub = sinon.stub(socketManager, 'updateAvailableRooms');
        clientSocket.emit('createMultRoom', { hostName: 'name', gameMode: 'Classic 1v1', gameInfo: finalGame });

        setTimeout(() => {
            expect(createRoomStub.called).to.be.true;
            expect(setGuestInfoStub.called).to.be.true;
            expect(updateAvailableRoomsStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should get all available multiplayer rooms', (done) => {
        const updateAvailableRoomsStub = sinon.stub(socketManager, 'updateAvailableRooms');
        clientSocket.emit('getMultRooms');

        setTimeout(() => {
            expect(updateAvailableRoomsStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should delete a multiplayer room', (done) => {
        const deleteRoomStub = sinon.stub(socketManager['classicModeManager'], 'deleteRoomAndDisconnectSockets');
        clientSocket.emit('deleteRoom', mockRoom);

        setTimeout(() => {
            expect(deleteRoomStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should add a guest to the guest list', (done) => {
        const addGuestNameStub = sinon.stub(socketManager['classicModeManager'], 'addNameToGuestList');
        clientSocket.emit('createGuest', mockGuest);

        setTimeout(() => {
            expect(addGuestNameStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should add the accepted guest to the multiplayer room', (done) => {
        const mockMultRoom: ClassicRoom = mockRoom;
        const updateAvailableRoomsStub = sinon.stub(socketManager, 'updateAvailableRooms');
        const addGuestPlayerStub = sinon.stub(socketManager['classicModeManager'], 'addGuestPlayer').returns(mockMultRoom);
        clientSocket.emit('joinRoom', { guest: mockGuest, createdRoom: mockRoom });

        setTimeout(() => {
            expect(addGuestPlayerStub.called).to.be.true;
            expect(updateAvailableRoomsStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should not emit anything to the client when addGuestPlayer is called', (done) => {
        const updateAvailableRoomsStub = sinon.stub(socketManager, 'updateAvailableRooms');
        const addGuestPlayerStub = sinon.stub(socketManager['classicModeManager'], 'addGuestPlayer').returns(undefined);
        clientSocket.emit('joinRoom', { guest: mockGuest, createdRoom: mockRoom });

        setTimeout(() => {
            expect(addGuestPlayerStub.called).to.be.true;
            expect(updateAvailableRoomsStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should connect the accepted guest to the multiplayer room', (done) => {
        const refuseSocketsStub = sinon.stub(socketManager['classicModeManager'], 'refuseSockets');
        clientSocket.emit('connectGuestToRoom', mockRoom);

        setTimeout(() => {
            expect(refuseSocketsStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should disconnect sockets on refresh', (done) => {
        const mockMultRoom: ClassicRoom = mockRoom;
        mockMultRoom.guestInfo = mockGuest;
        const getRoomByIdStub = sinon.stub(socketManager['classicModeManager'], 'getRoomById').returns(mockMultRoom);
        const onRefreshStub = sinon.stub(socketManager, 'onRefresh');
        clientSocket.disconnect();

        setTimeout(() => {
            expect(getRoomByIdStub.called).to.be.true;
            expect(onRefreshStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should disconnect sockets on refresh for a solo Room', (done) => {
        const getRoomByIdStub = sinon.stub(socketManager['classicModeManager'], 'getRoomById').returns(mockRoom);
        const deleteRoomStub = sinon.stub(socketManager['classicModeManager'], 'deleteRoomAndDisconnectSockets');
        clientSocket.disconnect();

        setTimeout(() => {
            expect(getRoomByIdStub.called).to.be.true;
            expect(deleteRoomStub.called).to.be.true;
            done();
        }, 150);
    });

    it('should not disconnect sockets on refresh', (done) => {
        const getRoomByIdStub = sinon.stub(socketManager['classicModeManager'], 'getRoomById').returns(mockRoom);
        clientSocket.disconnect();

        setTimeout(() => {
            expect(getRoomByIdStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should disconnect a socket and delete the room in limited mode, on disconnect', (done) => {
        const getLimitedRoomStub = sinon.stub(socketManager['limitedModeManager'], 'getRoomById').returns(mockRoom);
        const deleteStub = sinon.stub(socketManager['limitedModeManager'], 'deleteRoomAndDisconnectSockets');
        clientSocket.disconnect();

        setTimeout(() => {
            expect(getLimitedRoomStub.called).to.be.true;
            expect(deleteStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should remove the abandoned player in limited mode, on disconnect', (done) => {
        mockRoom.guestInfo = mockGuest;
        const getLimitedRoomStub = sinon.stub(socketManager['limitedModeManager'], 'getRoomById').returns(mockRoom);
        const quitStub = sinon.stub(socketManager['limitedModeManager'], 'playerQuitMultiGame');
        clientSocket.disconnect();

        setTimeout(() => {
            expect(getLimitedRoomStub.called).to.be.true;
            expect(quitStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should disconnect a guest player if they refresh the page', (done) => {
        mockRoom.guestInfo = mockGuest;
        socketManager['classicModeManager'].guests.set(mockRoom.roomId, [mockGuest]);
        const removeDisconnectedGuestStub = sinon.stub(socketManager, 'removeDisconnectedGuest');
        clientSocket.disconnect();

        setTimeout(() => {
            expect(removeDisconnectedGuestStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should refuse the guest', (done) => {
        const mockMultRoom: ClassicRoom = mockRoom;
        mockMultRoom.guestInfo = mockGuest;
        const refuseGuestStub = sinon.stub(socketManager['classicModeManager'], 'refuseGuest');
        clientSocket.emit('refuseGuest', { guest: mockGuest, room: mockMultRoom });

        setTimeout(() => {
            expect(refuseGuestStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should not refuse the guest on invalid roomInfo', (done) => {
        const refuseGuestStub = sinon.stub(socketManager['classicModeManager'], 'refuseGuest');
        clientSocket.emit('refuseGuest', { guest: mockGuest, room: undefined as unknown as ClassicRoom });

        setTimeout(() => {
            expect(refuseGuestStub.called).to.be.false;
            done();
        }, 50);
    });

    it('should remove all guests', (done) => {
        const mockMultRoom: ClassicRoom = mockRoom;
        mockMultRoom.guestInfo = mockGuest;
        socketManager['classicModeManager'].guests.set(mockMultRoom.roomId, [mockGuest]);
        clientSocket.emit('removeAllGuests', mockMultRoom);

        setTimeout(() => {
            expect(socketManager['classicModeManager'].guests).to.be.empty;
            done();
        }, 50);
    });

    it('should not remove all guests', (done) => {
        const deleteStub = sinon.stub(socketManager['classicModeManager'].guests, 'delete');
        clientSocket.emit('removeAllGuests', undefined as unknown as ClassicRoom);

        setTimeout(() => {
            expect(deleteStub.called).equal(false);
            done();
        }, 50);
    });

    it('should send chat message', (done) => {
        const sendMessageToRoomStub = sinon.stub(socketManager['classicModeManager'], 'sendMessageToRoom');
        clientSocket.emit('chatMessage', { room: mockRoom, message: 'hello' });

        setTimeout(() => {
            expect(sendMessageToRoomStub.called).to.be.true;
            done();
        }, 50);
    });

    it('should call removeRoom on removedGame', (done) => {
        const removeRoomStub = sinon.stub(socketManager['classicModeManager'], 'removeRoomOnDeleteGame');
        clientSocket.emit('removedGame', baseGameSheet);

        setTimeout(() => {
            expect(removeRoomStub.called).to.be.true;
            done();
        }, 100);
    });

    it('should emit list of available multiplayer rooms', () => {
        const emitStub = sinon.stub(socketManager['server'], 'emit');
        socketManager.updateAvailableRooms();
        expect(emitStub.calledWith('listOfAvailableRooms', socketManager['classicModeManager'].listAvailableRooms())).to.be.true;
    });

    it('should emit list of available limited multiplayer rooms', () => {
        const emitStub = sinon.stub(socketManager['server'], 'emit');
        socketManager.updateAvailablLimitedRooms();
        expect(emitStub.calledWith('listOfAvailableLimitedRooms', socketManager['limitedModeManager'].listAvailableRoom())).to.be.true;
    });

    it('should refresh page for host', () => {
        const mockMultRoom: ClassicRoom = mockRoom;
        mockMultRoom.guestInfo = mockGuest;

        const isHostStub = sinon.stub(socketManager['classicModeManager'], 'isHost').returns(true);
        const setMessageStub = sinon.stub(socketManager['classicModeManager'], 'setMessageOnRefresh');
        const onMultiRoomAbandonStub = sinon.stub(socketManager['classicModeManager'], 'onMultiRoomAbandon');

        socketManager.onRefresh(socket, mockMultRoom);

        expect(isHostStub.called).to.be.true;
        expect(setMessageStub.called).to.be.true;
        expect(onMultiRoomAbandonStub.called).to.be.true;
    });

    it('should refresh page for guest', () => {
        const mockMultRoom: ClassicRoom = mockRoom;
        mockMultRoom.guestInfo = mockGuest;
        const isHostStub = sinon.stub(socketManager['classicModeManager'], 'isHost').returns(false);
        const setMessageStub = sinon.stub(socketManager['classicModeManager'], 'setMessageOnRefresh');
        const onMultiRoomAbandonStub = sinon.stub(socketManager['classicModeManager'], 'onMultiRoomAbandon');

        socketManager.onRefresh(socket, mockMultRoom);

        expect(isHostStub.called).to.be.true;
        expect(setMessageStub.called).to.be.true;
        expect(onMultiRoomAbandonStub.called).to.be.true;
    });

    it('should disconnect a guest', () => {
        socketManager['classicModeManager'].guests.set(mockRoom.roomId, [mockGuest]);
        mockGuest.id = 'socketId';
        socketManager.removeDisconnectedGuest([mockGuest], 'socketId', 'roomId');
        expect(socketManager['classicModeManager'].guests.get(mockRoom.roomId)).to.deep.equal([]);
    });

    it('should not disconnect a guest thats not in the list', () => {
        socketManager['classicModeManager'].guests.set(mockRoom.roomId, [mockGuest]);
        socketManager.removeDisconnectedGuest([mockGuest], 'socketId', 'roomId');
        expect(socketManager['classicModeManager'].guests.get(mockRoom.roomId)).to.deep.equal([mockGuest]);
    });

    it('should not disconnect a guest that doent exist in the guestList', () => {
        socketManager['classicModeManager'].guests.set(mockRoom.roomId, []);
        mockGuest.id = 'socketId';
        socketManager.removeDisconnectedGuest([mockGuest], 'socketId', 'roomId');
        expect(socketManager['classicModeManager'].guests.get(mockRoom.roomId)).to.deep.equal([]);
    });

    it('should create a limited solo game', (done) => {
        const createRoomStub = sinon.stub(socketManager['limitedModeManager'], 'createRoom').resolves(mockRoom);
        clientSocket.emit('createLimitedSolo', 'playerName');

        setTimeout(() => {
            expect(createRoomStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should not create a limited solo game', (done) => {
        const createRoomStub = sinon.stub(socketManager['limitedModeManager'], 'createRoom').resolves(undefined);
        clientSocket.emit('createLimitedSolo', 'playerName');

        setTimeout(() => {
            expect(createRoomStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should create a limited multiplayer room', (done) => {
        const createRoomStub = sinon.stub(socketManager['limitedModeManager'], 'createRoom').resolves(mockRoom);
        const getRoomStub = sinon.stub(socketManager['limitedModeManager'].rooms, 'get').returns({ room: mockRoom, gameList: [finalGame] });
        const setRoomStub = sinon.stub(socketManager['limitedModeManager'].rooms, 'set');
        clientSocket.emit('createLimitedMulti', 'playerName');

        setTimeout(() => {
            expect(createRoomStub.called).to.be.true;
            expect(getRoomStub.called).to.be.true;
            expect(setRoomStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should not create a limited multiplayer room', (done) => {
        const createRoomStub = sinon.stub(socketManager['limitedModeManager'], 'createRoom').resolves(undefined);
        const getRoomStub = sinon.stub(socketManager['limitedModeManager'].rooms, 'get');
        const setRoomStub = sinon.stub(socketManager['limitedModeManager'].rooms, 'set');
        clientSocket.emit('createLimitedMulti', 'playerName');

        setTimeout(() => {
            expect(createRoomStub.called).to.be.true;
            expect(getRoomStub.called).to.be.false;
            expect(setRoomStub.called).to.be.false;
            done();
        }, 75);
    });

    it('should call limitedModeService and verify the coordinates for limited mode', (done) => {
        const iterateThroughDifferencesStub = sinon.stub(socketManager['limitedModeManager'], 'iterateDifferenceLocations');
        clientSocket.emit('verifyCoordsLimitedMode', { room: mockRoom, coords: { x: 0, y: 0 }, isMainCanvas: true });

        setTimeout(() => {
            expect(iterateThroughDifferencesStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should get the available limited room', (done) => {
        const updateAvailableRoomsStub = sinon.stub(socketManager, 'updateAvailablLimitedRooms');
        clientSocket.emit('getLimitedRooms');

        setTimeout(() => {
            expect(updateAvailableRoomsStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should connect a guest to a multiplayer game', (done) => {
        const multiGameStub = sinon.stub(socketManager['limitedModeManager'], 'startMultiGame');
        clientSocket.emit('connectGuestLimitedMode');

        setTimeout(() => {
            expect(multiGameStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should delete a limited multiplayer room', (done) => {
        const deleteStub = sinon.stub(socketManager['limitedModeManager'], 'deleteRoomAndDisconnectSockets');
        const availableRoomsStub = sinon.stub(socketManager, 'updateAvailablLimitedRooms');
        clientSocket.emit('deleteLimitedRoom');

        setTimeout(() => {
            expect(deleteStub.called).to.be.true;
            expect(availableRoomsStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should emit a message on AllGamesDeleted', (done) => {
        const emitStub = sinon.stub(socketManager['server'], 'emit');
        clientSocket.emit('AllGamesDeleted');

        setTimeout(() => {
            expect(emitStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should emit updateGameSheet message', (done) => {
        const emitStub = sinon.stub(socketManager['server'], 'emit');
        clientSocket.emit('needsUpdate');

        setTimeout(() => {
            expect(emitStub.called).to.be.true;
            done();
        }, 75);
    });

    it('should push a new game to the game list', (done) => {
        clientSocket.emit('addLimitedGame', finalGame);
        setTimeout(() => {
            expect(socketManager['limitedModeGames']).to.deep.equal([finalGame]);
            done();
        }, 75);
    });
});
