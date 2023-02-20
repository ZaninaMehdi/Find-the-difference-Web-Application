/* eslint-disable max-lines */
/* eslint-disable max-lines */
import { DEFAULT_BONUS_TIME, DEFAULT_COUNTDOWN_VALUE, DEFAULT_HINT_PENALTY } from '@app/constants';
import { BestTimes } from '@app/interfaces/best-times';
import { GameData } from '@app/interfaces/game-data';
import { GameSheet } from '@app/interfaces/game-sheet';
import { GameTimes } from '@app/interfaces/game-times';
import { ClassicRoom, GuestPlayer, LimitedModeRoom } from '@app/interfaces/rooms';
import { ServerGameSheet } from '@app/interfaces/server-game-sheet';
import { AdminService } from '@app/services/admin/admin.service';
import { assert, expect } from 'chai';
import * as sinon from 'sinon';

import * as io from 'socket.io';
import { LimitedTimeService } from './limited-mode.service';

describe('Limited Mode service', () => {
    let limitedMode: LimitedTimeService;
    let socket: io.Socket;
    let mockRoom: ClassicRoom;
    let mockGuest: GuestPlayer;
    let serverGameSheet: ServerGameSheet;
    let baseGameSheet: GameSheet;
    let gameTime: GameTimes;
    let finalGame: GameData;

    const defaultBestTimes: BestTimes[] = [
        { name: 'John Doe', time: 100 },
        { name: 'Jane Doe', time: 200 },
        { name: 'the scream', time: 250 },
    ];

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
    };

    const constants = {
        initialTime: DEFAULT_COUNTDOWN_VALUE,
        penaltyTime: DEFAULT_HINT_PENALTY,
        bonusTime: DEFAULT_BONUS_TIME,
    };

    const adminServiceMock = {
        getConstants: async () => {
            return Promise.resolve([constants]);
        },
        getAllGameData: () => {
            return [finalGame];
        },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        getClientConnection: () => {},
    };

    beforeEach(async () => {
        socket = mockServerSocket as unknown as io.Socket;
        limitedMode.server = mockServer as unknown as io.Server;
        limitedMode.rooms = new Map<string, LimitedModeRoom>();
    });

    beforeEach(() => {
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
            id: 'guestId',
            guestName: 'guest',
            differencesFound: 0,
            differenceLocations: [[{ x: 0, y: 0 }]],
        };

        mockRoom = {
            roomId: 'roomId',
            hostId: 'hostId',
            playerName: 'playerName',
            hintPenalty: 5,
            game: finalGame,
            gameMode: 'Temps Limite',
            timer: 120,
            differencesFound: 0,
            endGameMessage: '',
            currentDifference: [],
        };

        limitedMode.rooms = new Map<string, LimitedModeRoom>();
    });

    before(() => {
        const adminService = adminServiceMock as unknown as AdminService;
        limitedMode = new LimitedTimeService(adminService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should call client connexion method using admin service', () => {
        const stub = sinon.spy(adminServiceMock, 'getClientConnection');
        limitedMode.getClientConnection();
        expect(stub.called).equals(true);
    });

    it('should generate a roomId for the game', () => {
        expect(limitedMode.generateRoomId()).to.be.a('string');
    });

    it('should create a room', (done) => {
        mockRoom.hostId = 'socketId';
        const getGamesSpy = sinon.spy(adminServiceMock, 'getAllGameData');
        const idStub = sinon.stub(limitedMode, 'generateRoomId').returns('roomId');
        const joinSpy = sinon.spy(socket, 'join');

        limitedMode.createRoom('playerName', 'Temps Limite', [finalGame]).then((room: ClassicRoom) => {
            expect(room).equals(mockRoom);
            expect(getGamesSpy.called).equal(true);
            expect(idStub.called).equal(true);
            expect(joinSpy.called).equal(true);
        });
        done();
    });

    it('should turn to a solo game if the host player quits ', () => {
        const leaveSpy = sinon.spy(socket, 'leave');
        const disconnectSpy = sinon.spy(socket, 'disconnect');
        mockRoom.guestInfo = mockGuest;
        mockRoom.hostId = 'socketId';
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });

        limitedMode.playerQuitMultiGame(socket, mockRoom);
        expect(leaveSpy.called).equal(true);
        expect(disconnectSpy.called).equal(true);
        expect(limitedMode.rooms.get(mockRoom.roomId)?.room.hostId).equal('guestId');
        expect(limitedMode.rooms.get(mockRoom.roomId)?.room.playerName).equal('guest');
    });

    it('should not create a room', () => {
        const shuffleStub = sinon.stub(limitedMode, 'shuffleGames');
        const constantsStub = sinon.spy(adminServiceMock, 'getConstants');
        limitedMode.createRoom('gamer', 'Temps Limite', [finalGame]).then(() => {
            expect(shuffleStub.called).equals(true);
            expect(constantsStub.called).equals(true);
            expect(limitedMode.rooms.size).equals(0);
        });
    });

    it('should turn to a solo game if the guest player quits ', () => {
        const leaveSpy = sinon.spy(socket, 'leave');
        const disconnectSpy = sinon.spy(socket, 'disconnect');
        mockRoom.guestInfo = mockGuest;
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });

        limitedMode.playerQuitMultiGame(socket, mockRoom);
        expect(leaveSpy.called).equal(true);
        expect(disconnectSpy.called).equal(true);
        expect(limitedMode.rooms.get(mockRoom.roomId)?.room.guestInfo).equal(undefined);
    });

    it('should update timer in the room', () => {
        limitedMode.updateTimer(mockRoom, [finalGame]);

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(limitedMode.rooms.get(mockRoom.roomId)?.room.timer).equal(119);
    });

    it('should add penalty to room', () => {
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        // const emitSpy = sinon.spy(socket, 'emit');
        limitedMode.addPenalty(mockRoom);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(limitedMode.rooms.get(mockRoom.roomId)?.room.timer).equal(115);
    });

    it('should update timer and delete the room if time is up', () => {
        mockRoom.timer = 1;
        limitedMode.updateTimer(mockRoom, [finalGame]);

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(limitedMode.rooms.get(mockRoom.roomId)).equal(undefined);
    });

    it('should disconnect sockets and delete the room', () => {
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });

        limitedMode.deleteRoomAndDisconnectSockets(socket, mockRoom);
        expect(limitedMode.rooms.get(mockRoom.roomId)).equals(undefined);
    });

    it('should verify coords and add bonus time when a difference is found', async () => {
        mockRoom.timer = 121;
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        const constantsStub = sinon.spy(adminServiceMock, 'getConstants');
        const messageStub = sinon.stub(limitedMode, 'sendDifferenceMessage');
        await limitedMode.iterateDifferenceLocations(socket, mockRoom, { x: 0, y: 0 }, true).then(() => {
            expect(constantsStub.called).equals(true);
            expect(messageStub.called).equals(true);
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(limitedMode.rooms.get(mockRoom.roomId)?.room.timer).equals(120);
        });
    });

    it('should verify coords and add bonus time when a difference is found version 2', async () => {
        mockRoom.timer = 5;
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        const constantsStub = sinon.spy(adminServiceMock, 'getConstants');
        const messageStub = sinon.stub(limitedMode, 'sendDifferenceMessage');
        await limitedMode.iterateDifferenceLocations(socket, mockRoom, { x: 0, y: 0 }, true).then(() => {
            expect(constantsStub.called).equals(true);
            expect(messageStub.called).equals(true);
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(limitedMode.rooms.get(mockRoom.roomId)?.room.timer).equals(10);
        });
    });

    it('should verify coords and end a game', async () => {
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [] });
        const constantsStub = sinon.spy(adminServiceMock, 'getConstants');
        const deleteStub = sinon.stub(limitedMode, 'deleteRoomAndDisconnectSockets');
        limitedMode.iterateDifferenceLocations(socket, mockRoom, { x: 0, y: 0 }, false).then(() => {
            expect(constantsStub.called).equals(true);
            expect(deleteStub.called).equals(true);
        });
    });

    it('should emit foundDifference  when length  of games >0', (done) => {
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame, finalGame] });
        const deleteRoomSpy = sinon.spy(limitedMode, 'deleteRoomAndDisconnectSockets');
        const broadcastStub = sinon.spy(socket.broadcast, 'to');

        limitedMode.iterateDifferenceLocations(socket, mockRoom, { x: 0, y: 0 }, false).then(() => {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(deleteRoomSpy.called).equals(false);
            expect(broadcastStub.called).equals(true);
        });
        done();
    });

    it('should delete room  when length  of games =0', (done) => {
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        const deleteRoomSpy = sinon.spy(limitedMode, 'deleteRoomAndDisconnectSockets');
        const broadcastStub = sinon.spy(socket.broadcast, 'to');

        limitedMode.iterateDifferenceLocations(socket, mockRoom, { x: 0, y: 0 }, false).then(() => {
            expect(deleteRoomSpy.called).equals(true);
            expect(limitedMode.rooms.get(mockRoom.roomId)).equals(undefined);
            expect(broadcastStub.called).equals(true);
        });
        done();
    });

    it('should send differenceError message ', (done) => {
        mockRoom.game.gameSheet.differenceLocations = [[{ x: 1, y: 0 }]];
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        const differenceSpy = sinon.spy(limitedMode, 'sendDifferenceMessage');
        const broadcastStub = sinon.spy(socket.broadcast, 'to');
        limitedMode.iterateDifferenceLocations(socket, mockRoom, { x: 0, y: 0 }, false).then(() => {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(differenceSpy.called).equals(true);
            assert(differenceSpy.calledWith(mockRoom, socket.id, 'differenceError'));
            expect(broadcastStub.called).equals(true);
        });
        done();
    });

    it('should return an available multiplayer room', () => {
        const isAvailableStub = sinon.stub(limitedMode, 'isAvailable').returns(true);
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [] });

        expect(limitedMode.listAvailableRoom()).to.deep.equal(mockRoom);
        expect(isAvailableStub.called).equals(true);
    });

    it('should emit a message on difference', () => {
        const broadcastStub = sinon.spy(mockServer, 'to');
        limitedMode.sendDifferenceMessage(mockRoom, mockRoom.hostId, 'alpha');
        expect(broadcastStub.called).to.equal(true);
    });

    it('should emit a message version2.0', () => {
        const broadcastStub = sinon.spy(mockServer, 'to');
        mockRoom.guestInfo = mockGuest;
        limitedMode.sendDifferenceMessage(mockRoom, 'guestId', 'alpha');
        expect(broadcastStub.called).to.equal(true);
    });

    it('should not return an available multiplayer room', () => {
        const isAvailableStub = sinon.stub(limitedMode, 'isAvailable').returns(false);
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [] });

        expect(limitedMode.listAvailableRoom()).equal(undefined);
        expect(isAvailableStub.called).equals(true);
    });

    it('should be an available multiplayer room', () => {
        mockGuest.id = '';
        mockRoom.gameMode = 'Temps Limite 1v1';
        mockRoom.guestInfo = mockGuest;
        expect(limitedMode.isAvailable(mockRoom)).equal(true);
    });

    it('should not join Room', (done) => {
        const joinSpy = sinon.spy(socket, 'join');
        limitedMode.createRoom('playerName', 'Temps Limite', undefined as unknown as GameData[]).then((room: ClassicRoom) => {
            expect(room).equals(undefined);
            expect(joinSpy.called).equal(false);
        });
        done();
    });

    it('should not be an available multiplayer room', () => {
        expect(limitedMode.isAvailable(mockRoom)).equal(false);
    });

    it('should start a multiplayer game', () => {
        mockRoom.guestInfo = mockGuest;
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        const availableRoomsStub = sinon.stub(limitedMode, 'listAvailableRoom').returns(mockRoom);

        limitedMode.startMultiGame(socket, 'guestName');
        expect(availableRoomsStub.called).equals(true);
        expect(limitedMode.rooms.get(mockRoom.roomId)?.room.guestInfo?.id).equals('socketId');
        expect(limitedMode.rooms.get(mockRoom.roomId)?.room.guestInfo?.guestName).equals('guestName');
    });

    it('should return a room if the socket corresponds to the host', () => {
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        expect(limitedMode.getRoomById('hostId')).to.deep.equal(mockRoom);
    });

    it('should return a room if the socket corresponds to the guest', () => {
        mockRoom.guestInfo = mockGuest;
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        expect(limitedMode.getRoomById('guestId')).to.deep.equal(mockRoom);
    });

    it('should not return room', () => {
        expect(limitedMode.getRoomById('guestId')).to.deep.equal(undefined);
    });

    it('should not return room', () => {
        mockRoom.guestInfo = undefined;
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        expect(limitedMode.getRoomById('blah')).to.deep.equal(undefined);
    });

    it('should not return room', () => {
        mockRoom.guestInfo = undefined;
        limitedMode.rooms.set(mockRoom.roomId, { room: mockRoom, gameList: [finalGame] });
        expect(limitedMode.getRoomById('blah')).to.deep.equal(undefined);
    });

    it('should suffle games', () => {
        const games = [];
        games.push(finalGame);
        finalGame.name = 'lol';
        games.push(finalGame);
        expect(limitedMode.shuffleGames(games).length).to.equal(2);
    });

    it('should suffle one game', () => {
        const games = [];
        games.push(finalGame);
        expect(limitedMode.shuffleGames(games)).to.deep.equal([finalGame]);
    });
});
