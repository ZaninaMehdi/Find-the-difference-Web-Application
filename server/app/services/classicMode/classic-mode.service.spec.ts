/* eslint-disable max-lines */
/* eslint-disable max-lines */
import { DEFAULT_BONUS_TIME, DEFAULT_COUNTDOWN_VALUE, DEFAULT_HINT_PENALTY } from '@app/constants';
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { GameTimes } from '@app/interfaces/game-times';
import { ClassicRoom, GuestPlayer } from '@app/interfaces/rooms';
import { ServerGameSheet } from '@app/interfaces/server-game-sheet';
import { AdminService } from '@app/services/admin/admin.service';
import { ClassicModeService } from '@app/services/classicMode/classic-mode.service';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as io from 'socket.io';

describe('ClassicMode service', () => {
    let classicMode: ClassicModeService;
    let socket: io.Socket;
    let mockRoom: ClassicRoom;
    let mockGuest: GuestPlayer;
    let serverGameSheet: ServerGameSheet;
    let baseGameSheet: GameSheet;
    let gameTime: GameTimes;
    let finalGame: GameData;
    let defaultBestTimes: BestTimes[];

    const mockBroadcast = {
        // eslint-disable-next-line no-unused-vars
        to: (room: string) => {
            return {
                emit: <T>(event: string, data?: T) => {
                    return { event, data };
                },
            };
        },
    };

    const mockServerSocket = {
        id: 'socketId',
        broadcast: mockBroadcast,
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
                emit: <T>(event: string, data?: T) => {
                    return { event, data };
                },
            };
        },
        leave: (room: string) => {
            return room;
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        disconnect: () => {},
    };

    const mockServer = {
        // eslint-disable-next-line no-unused-vars
        to: (room: string) => {
            return {
                emit: <T>(event: string, data?: T) => {
                    return { event, data };
                },
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                disconnectSockets: () => {},
            };
        },
        // eslint-disable-next-line no-unused-vars
        in: (room: string) => {
            return {
                fetchSockets: () => {
                    return [socket];
                },
                emit: <T>(event: string, data?: T) => {
                    return { event, data };
                },
            };
        },
        emit: <T>(event: string, data?: T) => {
            return { event, data };
        },
    };

    const constants = {
        initialTime: DEFAULT_COUNTDOWN_VALUE,
        penaltyTime: DEFAULT_HINT_PENALTY,
        bonusTime: DEFAULT_BONUS_TIME,
    };

    const adminServiceMock = {
        getConstants: () => {
            return [constants];
        },
        getGameBestTimes: () => {
            return [{ name: 'random', bestSoloTimes: defaultBestTimes, bestMultiplayerTimes: defaultBestTimes }];
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        updateGameBestTimes: () => {},
    };

    beforeEach(async () => {
        socket = mockServerSocket as unknown as io.Socket;
        classicMode.server = mockServer as unknown as io.Server;
        classicMode.rooms = new Map<string, ClassicRoom>();
    });

    beforeEach(() => {
        defaultBestTimes = [
            { name: 'John Doe', time: 100 },
            { name: 'Jane Doe', time: 200 },
            { name: 'the scream', time: 250 },
        ];

        serverGameSheet = {
            originalLink: '../../../assets/bmp_640',
            modifiedLink: '../../../assets/bmp_640',
            differenceCounter: 6,
            differenceLocations: [[{ x: 0, y: 0 }]],
            name: 'game',
        };

        baseGameSheet = {
            name: 'game',
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

        mockGuest = {
            id: '',
            guestName: 'guest',
            differencesFound: 0,
            differenceLocations: [[{ x: 0, y: 0 }]],
        };

        mockRoom = {
            roomId: 'socketId',
            hostId: 'hostId',
            playerName: 'name',
            hintPenalty: 5,
            game: finalGame,
            gameMode: 'Classic - solo',
            timer: 0,
            differencesFound: 0,
            endGameMessage: '',
            currentDifference: [],
        };

        classicMode.rooms = new Map<string, ClassicRoom>();
        classicMode.guests = new Map<string, GuestPlayer[]>();
    });

    before(() => {
        const adminService = adminServiceMock as unknown as AdminService;
        classicMode = new ClassicModeService(adminService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should generate a roomId for the game', () => {
        expect(classicMode.generateRoomId()).to.be.a('string');
    });

    it('should create a new solo room and join', async () => {
        sinon.spy(adminServiceMock, 'getConstants');
        mockRoom.hostId = '';
        const idSpy = sinon.stub(classicMode, 'generateRoomId').returns('socketId');
        const recievedRoom = await classicMode.createRoom('name', 'Classic - solo', finalGame);

        sinon.assert.called(idSpy);
        expect(recievedRoom).to.deep.equal(mockRoom);
    });

    it('should update timer in the room', () => {
        classicMode.updateTimer(mockRoom);

        const updatedRoom = classicMode.rooms.get('socketId');
        mockRoom.timer++;
        expect(updatedRoom).to.deep.equal(mockRoom);
    });

    it('should add penalty time to the timer in the room', () => {
        classicMode.addPenalty(mockRoom);

        const updatedRoom = classicMode.rooms.get('socketId');
        mockRoom.timer++;
        expect(updatedRoom).to.deep.equal(mockRoom);
    });

    it('should iterate through the coordinates and return an index > -1', () => {
        expect(classicMode.iterateDifferenceLocations(socket, mockRoom, { x: 0, y: 0 })).to.equal(0);
        const updatedRoom = classicMode.rooms.get('socketId');
        expect(updatedRoom?.currentDifference).to.deep.equal([{ x: 0, y: 0 }]);
    });

    it('should return index = -1 ', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(classicMode.iterateDifferenceLocations(socket, mockRoom, { x: 5, y: 5 })).to.equal(-1);
    });

    it('should return an index > -1 in a multiplayer game', () => {
        mockGuest.id = 'socketId';
        mockRoom.guestInfo = mockGuest;
        expect(classicMode.iterateDifferenceLocations(socket, mockRoom, { x: 0, y: 0 })).to.equal(0);
        const updatedRoom = classicMode.rooms.get('socketId');
        expect(updatedRoom?.guestInfo?.differencesFound).to.deep.equal(1);
    });

    it('should return index = -1 in a multiplayer game', () => {
        mockGuest.id = 'socketId';
        mockRoom.guestInfo = mockGuest;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(classicMode.iterateDifferenceLocations(socket, mockRoom, { x: 5, y: 5 })).to.equal(-1);
    });

    it('should verifyCoords and return an empty difference during solo game', () => {
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        const serverStub = sinon.spy(classicMode.server, 'to');
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const iterateSpy = sinon.spy(classicMode, 'iterateDifferenceLocations');
        classicMode.verifyClickedCoordinates(socket, mockRoom, { x: 5, y: 5 });

        expect(iterateSpy.called).equal(true);
        expect(serverStub.called).equal(true);
        const updatedRoom = classicMode.rooms.get('socketId');
        expect(updatedRoom?.currentDifference).to.deep.equal([]);
    });

    it('should verifyCoords and return an empty difference during mult game', () => {
        mockRoom.guestInfo = mockGuest;
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const iterateStub = sinon.stub(classicMode, 'iterateDifferenceLocations').returns(-1);
        mockGuest.id = 'socketId';
        mockRoom.guestInfo = mockGuest;
        classicMode.verifyClickedCoordinates(socket, mockRoom, { x: 5, y: 5 });

        expect(iterateStub.called).equal(true);
        const updatedRoom = classicMode.rooms.get('socketId');
        expect(updatedRoom?.currentDifference).to.deep.equal([]);
    });

    it('should verifyCoords of a difference in a solo Room', () => {
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        const iterateStub = sinon.stub(classicMode, 'iterateDifferenceLocations').returns(0);
        classicMode.verifyClickedCoordinates(socket, mockRoom, { x: 0, y: 0 });

        expect(iterateStub.called).equal(true);
        const updatedRoom = classicMode.rooms.get('socketId');
        expect(updatedRoom?.game.gameSheet.differenceLocations).to.deep.equal([]);
    });

    it('should verifyCoords of a valid guest in a multiplayer room', () => {
        mockGuest.id = 'socketId';
        mockRoom.guestInfo = mockGuest;
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        const iterateStub = sinon.stub(classicMode, 'iterateDifferenceLocations').returns(0);
        classicMode.verifyClickedCoordinates(socket, mockRoom, { x: 0, y: 0 });

        expect(iterateStub.called).equal(true);
        const updatedRoom = classicMode.rooms.get('socketId');
        expect(updatedRoom?.game.gameSheet.differenceLocations).to.deep.equal([]);
    });

    it('should find the minimum differences to find in multiplayer game', () => {
        expect(classicMode.minimumDifferences(mockRoom)).to.equal(3);
    });

    it('should find the minimum differences to find in multiplayer game version 2.0', () => {
        mockRoom.game.gameSheet.differenceCounter = 7;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(classicMode.minimumDifferences(mockRoom)).to.equal(4);
    });

    it('should return a room when given a socketId', () => {
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        expect(classicMode.getRoomById('hostId')).to.deep.equal(mockRoom);
    });

    it('should not return a room when given a socketId', () => {
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        expect(classicMode.getRoomById('unknownId')).to.deep.equal(undefined);
    });

    it('should return true if socket corresponds to host', () => {
        mockRoom.hostId = 'socketId';
        expect(classicMode.isHost(socket, mockRoom)).to.equal(true);
    });

    it('should return a message', () => {
        expect(classicMode.setMessageOnRefresh('playerName')).to.be.a('string');
    });

    it('should disconnect sockets and delete a room', () => {
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        classicMode.deleteRoomAndDisconnectSockets(socket, mockRoom);
        expect(classicMode.rooms.size).to.equal(0);
    });

    it('should send the guest name to the host if the guest abandon', () => {
        const broadcastStub = sinon.spy(socket.broadcast, 'to');
        mockGuest.id = 'socketId';
        mockRoom.guestInfo = mockGuest;
        classicMode.playerAbandoned(socket, mockRoom);
        expect(socket.id).equal(mockRoom.guestInfo.id);
        expect(broadcastStub.called).equal(true);
    });

    it('should send the host name to the guest if the host abandon', () => {
        const broadcastStub = sinon.spy(socket.broadcast, 'to');
        mockRoom.guestInfo = mockGuest;
        mockRoom.hostId = 'socketId';
        classicMode.playerAbandoned(socket, mockRoom);
        expect(socket.id).equal(mockRoom.hostId);
        expect(broadcastStub.called).equal(true);
    });

    it('should not emit anything if neither player has the same socket id', () => {
        const broadcastStub = sinon.spy(socket.broadcast, 'to');
        mockRoom.hostId = 'bleep';
        classicMode.playerAbandoned(socket, mockRoom);
        expect(socket.id).not.equal(mockRoom.hostId);
        expect(broadcastStub.called).equal(false);
    });

    it('should delete room on abandon game', () => {
        const deleteRoomAndDisconnectStub = sinon.stub(classicMode, 'deleteRoomAndDisconnectSockets');
        classicMode.onMultiRoomAbandon(socket, mockRoom);
        expect(deleteRoomAndDisconnectStub.calledWith(socket, mockRoom)).equal(true);
    });

    it('should disconnect sockets at the end of a game', () => {
        const deleteRoomAndDisconnectStub = sinon.stub(classicMode, 'deleteRoomAndDisconnectSockets');
        classicMode.finishGame(mockRoom, socket);
        expect(deleteRoomAndDisconnectStub.calledWith(socket, mockRoom)).equal(true);
    });

    it('should return a message on end game', () => {
        expect(classicMode.setMessageOnEndGameMultiplayer('winner', 'loser')).to.be.a('string');
    });

    it('should end a multiplayer game with the guest as a winner', async () => {
        const stub = sinon.stub(classicMode, 'setBestTime');

        const minimumDifferenceStub = sinon.stub(classicMode, 'minimumDifferences').returns(3);
        const mockMultiRoom: ClassicRoom = mockRoom;
        mockGuest.differencesFound = 3;
        mockMultiRoom.guestInfo = mockGuest;
        await classicMode.endGame(socket, mockMultiRoom);

        expect(minimumDifferenceStub.called).equal(true);
        expect(stub.called).equals(true);
        stub.resetHistory();
    });

    it('should end a multiplayer game with the host as a winner', async () => {
        const stub = sinon.stub(classicMode, 'setBestTime');
        const minimumDifferenceStub = sinon.stub(classicMode, 'minimumDifferences').returns(3);
        const mockMultiRoom: ClassicRoom = mockRoom;
        mockMultiRoom.guestInfo = mockGuest;
        mockMultiRoom.differencesFound = 3;
        await classicMode.endGame(socket, mockMultiRoom);

        expect(minimumDifferenceStub.called).equal(true);
        expect(stub.called).equals(true);
        stub.resetHistory();
    });

    it('should end a solo game', async () => {
        const stub = sinon.stub(classicMode, 'setBestTime');
        mockRoom.differencesFound = mockRoom.game.gameSheet.differenceCounter;
        await classicMode.endGame(socket, mockRoom);
        expect(stub.called).equals(true);
        stub.resetHistory();
    });

    it('should not end a solo game', () => {
        const finishGameStub = sinon.stub(classicMode, 'finishGame');
        mockRoom.differencesFound = 9;
        classicMode.endGame(socket, mockRoom);
        expect(finishGameStub.calledWith(mockRoom, socket)).equal(false);
    });

    it('should not list available multiplayer rooms', () => {
        const isAvailableSpy = sinon.spy(classicMode, 'isAvailable');
        classicMode.rooms.set(mockRoom.roomId, mockRoom);

        expect(classicMode.listAvailableRooms()).to.deep.equal([]);
        expect(isAvailableSpy.calledWith(mockRoom)).to.equal(true);
    });

    it('should list available multiplayer rooms', () => {
        const isAvailableSpy = sinon.spy(classicMode, 'isAvailable');
        mockRoom.gameMode = 'Classic 1v1';
        mockRoom.guestInfo = mockGuest;
        classicMode.rooms.set(mockRoom.roomId, mockRoom);

        expect(classicMode.listAvailableRooms()).to.deep.equal([mockRoom]);
        expect(isAvailableSpy.calledWith(mockRoom)).to.equal(true);
    });

    it('should check if a multiplayer room is available', () => {
        mockRoom.guestInfo = mockGuest;
        mockRoom.gameMode = 'Classic 1v1';
        expect(classicMode.isAvailable(mockRoom)).to.equal(true);
    });

    it('should add guest information to a multiplayer room', () => {
        const mockMultiRoom: ClassicRoom = mockRoom;
        mockMultiRoom.guestInfo = mockGuest;
        classicMode.rooms.set(mockMultiRoom.roomId, mockMultiRoom);
        const updatedroom = mockMultiRoom;
        (updatedroom.guestInfo as GuestPlayer).guestName = 'guest';
        (updatedroom.guestInfo as GuestPlayer).id = 'id';
        expect(classicMode.addGuestPlayer({ guestName: 'guest', id: 'id' }, mockMultiRoom)).to.deep.equal(updatedroom);
        expect(classicMode.rooms.get(mockMultiRoom.roomId)).to.deep.equal(updatedroom);
    });

    it('should not add guestPlayer if room is undefined', () => {
        expect(classicMode.addGuestPlayer(mockGuest, mockRoom)).to.deep.equal(undefined);
    });

    it('should save room information after we add a guest player', () => {
        classicMode.setGuestInfo(mockRoom);
        expect(classicMode.rooms.get(mockRoom.roomId)).to.deep.equal(mockRoom);
    });

    it('should refuse a guest player and delete it from the list', () => {
        mockRoom.guestInfo = mockGuest;
        classicMode.guests.set(mockRoom.roomId, [mockGuest]);

        classicMode.refuseGuest(mockGuest, mockRoom);
        expect(classicMode.guests.get(mockRoom.roomId)?.length).to.equal(0);
    });

    it('should not refuse a guest player thats not in the list', () => {
        const mockGuest2 = { id: 'newId', guestName: 'name' };
        mockRoom.guestInfo = mockGuest2;
        classicMode.guests.set(mockRoom.roomId, [mockGuest2]);
        classicMode.refuseGuest(mockGuest, mockRoom);

        expect(classicMode.guests.get(mockRoom.roomId)).to.deep.equal([mockGuest2]);
    });

    it('should not refuse a guest player if the guestList is undefined', () => {
        mockRoom.guestInfo = mockGuest;
        classicMode.refuseGuest(mockGuest, mockRoom);

        expect(classicMode.guests.get(mockRoom.roomId)).to.deep.equal(undefined);
    });

    it('should add guest name to the list of guests', () => {
        classicMode.guests.set(mockRoom.roomId, []);
        mockRoom.gameMode = 'Classic 1v1';
        mockRoom.roomTaken = false;
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        classicMode.addNameToGuestList(socket, mockGuest, 'game');
        expect(classicMode.guests.get(mockRoom.roomId)).to.deep.equal([mockGuest]);
    });

    it('should not add guest name to the list of guests', () => {
        mockRoom.gameMode = 'Classic 1v1';
        mockRoom.roomTaken = false;
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        classicMode.addNameToGuestList(socket, mockGuest, 'game');
        expect(classicMode.guests.get(mockRoom.roomId)).to.equal(undefined);
    });

    it('should not add guest name to the list of guests if the room is already taken', () => {
        mockRoom.gameMode = 'Classic 1v1';
        mockRoom.roomTaken = true;
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        classicMode.addNameToGuestList(socket, mockGuest, 'game');
        expect(classicMode.guests.get(mockRoom.roomId)).to.equal(undefined);
    });

    it('should emit a message to the client through the chat box', () => {
        const broadcastStub = sinon.spy(socket.broadcast, 'to');
        classicMode.sendMessageToRoom(socket, mockRoom, 'message');
        expect(broadcastStub.called).to.equal(true);
    });

    it('should remove the room when we delete a game', () => {
        const toSpy = sinon.spy(classicMode.server, 'to');
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        classicMode.removeRoomOnDeleteGame(baseGameSheet);
        expect(toSpy.called).equals(true);

        toSpy.resetHistory();
        baseGameSheet.name = 'fakeName';
        classicMode.removeRoomOnDeleteGame(baseGameSheet);
        expect(toSpy.called).equals(false);
    });

    it('should return true when comparing the same best time', () => {
        expect(classicMode.compareTwoBestTimes(defaultBestTimes, defaultBestTimes)).equals(true);
    });

    it('should return false when comparing different best times', () => {
        const bestTime: BestTimes[] = [
            { name: 'Ben', time: 4 },
            { name: 'Jane Doe', time: 200 },
            { name: 'the scream', time: 250 },
        ];
        expect(classicMode.compareTwoBestTimes(bestTime, defaultBestTimes)).equals(false);
    });

    it('should return true when the best time remains the same', async () => {
        expect(await classicMode.isNewBestTime(mockRoom, defaultBestTimes, defaultBestTimes)).equals(true);
    });

    it('should return false when the best time changes', async () => {
        const bestTime: BestTimes[] = [
            { name: 'Ben', time: 4 },
            { name: 'Jane Doe', time: 200 },
            { name: 'the scream', time: 250 },
        ];
        classicMode.isNewBestTime(mockRoom, bestTime, bestTime).then((value: boolean) => {
            expect(value).equals(false);
        });
    });

    it('should keep the same table if the new time is longer than the best times we have', () => {
        const newBestTimes = classicMode.sortTimes(defaultBestTimes, { name: 'random', time: 700 });
        defaultBestTimes.pop();
        expect(newBestTimes).deep.equal(defaultBestTimes);
    });

    it('should add the new best time in the correct position and remove the last time', () => {
        const newBestTimes = classicMode.sortTimes(defaultBestTimes, { name: 'random', time: 30 });
        const correctBestTimes = [
            { name: 'random', time: 30 },
            { name: 'John Doe', time: 100 },
            { name: 'Jane Doe', time: 200 },
        ];
        expect(newBestTimes).deep.equal(correctBestTimes);
    });

    it('should disconnect refused sockets', async () => {
        mockRoom.guestInfo = mockGuest;
        const toSpy = sinon.spy(classicMode.server, 'to');
        await classicMode.refuseSockets(mockRoom);
        expect(toSpy.called).equals(true);
    });

    it('should not disconnect the socket if they correspond to the guest or the host', async () => {
        mockGuest.id = 'socketId';
        mockRoom.hostId = 'socketId';
        mockRoom.guestInfo = mockGuest;
        const toSpy = sinon.spy(classicMode.server, 'to');
        await classicMode.refuseSockets(mockRoom);
        expect(toSpy.called).equals(false);

        toSpy.resetHistory();
        mockRoom.hostId = 'nouveauId';
        await classicMode.refuseSockets(mockRoom);
        expect(toSpy.called).equals(false);

        toSpy.resetHistory();
        mockGuest.id = 'guestId';
        mockRoom.hostId = 'socketId';
        await classicMode.refuseSockets(mockRoom);
        expect(toSpy.called).equals(false);
    });

    it('should end a multiplayer game without updating game times', async () => {
        // eslint-disable-next-line no-unused-vars
        sinon.stub(classicMode, 'isNewBestTime').callsFake(async (room: ClassicRoom, sortedTimes: BestTimes[], times: BestTimes[]) => {
            return Promise.resolve(true);
        });

        const finishGameStub = sinon.stub(classicMode, 'finishGame');
        const messageStub = sinon.stub(classicMode, 'setMessageOnEndGameMultiplayer');
        sinon.stub(classicMode, 'minimumDifferences').returns(3);
        const mockMultiRoom: ClassicRoom = mockRoom;
        mockGuest.differencesFound = 3;
        mockMultiRoom.guestInfo = mockGuest;
        await classicMode.endGame(socket, mockMultiRoom);

        expect(finishGameStub.called).equal(true);
        expect(messageStub.calledWith(mockMultiRoom.guestInfo.guestName, mockMultiRoom.playerName)).equal(true);
    });

    it('should end a multiplayer game without updating game times version 2', async () => {
        // eslint-disable-next-line no-unused-vars
        sinon.stub(classicMode, 'isNewBestTime').callsFake(async (room: ClassicRoom, sortedTimes: BestTimes[], times: BestTimes[]) => {
            return Promise.resolve(true);
        });

        const finishGameStub = sinon.stub(classicMode, 'finishGame');
        const messageStub = sinon.stub(classicMode, 'setMessageOnEndGameMultiplayer');
        sinon.stub(classicMode, 'minimumDifferences').returns(3);
        const mockMultiRoom: ClassicRoom = mockRoom;
        mockMultiRoom.guestInfo = mockGuest;
        mockMultiRoom.differencesFound = 3;
        await classicMode.endGame(socket, mockMultiRoom);

        expect(finishGameStub.called).equal(true);
        expect(messageStub.calledWith(mockMultiRoom.playerName, mockMultiRoom.guestInfo.guestName)).equal(true);
    });

    it('should end a solo game without updating best times', async () => {
        // eslint-disable-next-line no-unused-vars
        sinon.stub(classicMode, 'isNewBestTime').callsFake(async (room: ClassicRoom, sortedTimes: BestTimes[], times: BestTimes[]) => {
            return Promise.resolve(true);
        });

        const finishGameStub = sinon.stub(classicMode, 'finishGame');
        mockRoom.differencesFound = mockRoom.game.gameSheet.differenceCounter;
        await classicMode.endGame(socket, mockRoom);
        expect(finishGameStub.calledWith(mockRoom, socket)).equal(true);
    });

    it('should not return room', () => {
        mockRoom.guestInfo = undefined;
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        expect(classicMode.getRoomById('blah')).to.deep.equal(undefined);
    });

    it('should not return room', () => {
        expect(classicMode.getRoomById('guestId')).to.deep.equal(undefined);
    });

    it('should return a room if the socket corresponds to the host', () => {
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        expect(classicMode.getRoomById('hostId')).to.deep.equal(mockRoom);
    });

    it('should return a room if the socket corresponds to the guest', () => {
        mockRoom.guestInfo = mockGuest;
        classicMode.rooms.set(mockRoom.roomId, mockRoom);
        expect(classicMode.getRoomById('')).to.deep.equal(mockRoom);
    });

    it('should set a new best time', () => {
        const firstStub = sinon.stub(classicMode, 'finishGame');
        const secondStub = sinon.stub(classicMode, 'sendBestTime');
        const thirdStub = sinon.spy(adminServiceMock, 'updateGameBestTimes');
        classicMode.setBestTime(mockRoom, socket, defaultBestTimes, 'player');
        expect(firstStub.called).equals(true);
        expect(secondStub.called).equals(true);
        expect(thirdStub.called).equals(true);
    });

    it('should emit a new best time to the client', () => {
        const spy = sinon.spy(mockServer, 'emit');
        classicMode.sendBestTime('winner', mockRoom, defaultBestTimes);
        expect(spy.called).equals(true);
    });

    it('should handle case when get best times from db return undefined for 1v1 with guest as winner', async () => {
        sinon.stub(adminServiceMock, 'getGameBestTimes').returns([undefined as unknown as GameTimes]);
        const finishGameStub = sinon.stub(classicMode, 'finishGame');
        const messageStub = sinon.stub(classicMode, 'setMessageOnEndGameMultiplayer');
        sinon.stub(classicMode, 'minimumDifferences').returns(3);
        const mockMultiRoom: ClassicRoom = mockRoom;
        mockGuest.differencesFound = 3;
        mockMultiRoom.guestInfo = mockGuest;
        await classicMode.endGame(socket, mockMultiRoom);

        expect(finishGameStub.called).equal(true);
        expect(messageStub.calledWith(mockMultiRoom.guestInfo.guestName, mockMultiRoom.playerName)).equal(true);
    });

    it('should handle case when get best times from db return undefined for 1v1 with host as winner', async () => {
        sinon.stub(adminServiceMock, 'getGameBestTimes').returns([undefined as unknown as GameTimes]);
        const finishGameStub = sinon.stub(classicMode, 'finishGame');
        const messageStub = sinon.stub(classicMode, 'setMessageOnEndGameMultiplayer');
        sinon.stub(classicMode, 'minimumDifferences').returns(3);
        const mockMultiRoom: ClassicRoom = mockRoom;
        mockRoom.differencesFound = 3;
        mockMultiRoom.guestInfo = mockGuest;
        await classicMode.endGame(socket, mockMultiRoom);

        expect(finishGameStub.called).equal(true);
        expect(messageStub.calledWith(mockMultiRoom.playerName, mockMultiRoom.guestInfo.guestName)).equal(true);
    });

    it('should handle case when get best times from db return undefined for solo', async () => {
        sinon.stub(adminServiceMock, 'getGameBestTimes').returns([undefined as unknown as GameTimes]);
        const finishGameStub = sinon.stub(classicMode, 'finishGame');
        const messageStub = sinon.stub(classicMode, 'setMessageOnEndGameSolo');
        const mockMultiRoom: ClassicRoom = mockRoom;
        mockRoom.game.gameSheet.differenceCounter = 3;
        mockRoom.differencesFound = 3;
        await classicMode.endGame(socket, mockMultiRoom);

        expect(finishGameStub.called).equal(true);
        expect(messageStub.calledWith(mockRoom.differencesFound)).equal(true);
    });
});
