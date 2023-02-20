import { Injectable } from '@angular/core';
import { Message } from '@app/interfaces/message';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ClientSocketService } from '@app/services/client-socket-service/client-socket.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    messages: Message[];
    room: ClassicRoom;

    constructor(private clientSocket: ClientSocketService) {
        this.messages = [];
    }

    sendMessage(room: ClassicRoom, message: string): void {
        this.clientSocket.send('chatMessage', { room, message });
    }

    handleChatSockets(): void {
        this.clientSocket.on('messageSent', (message: string) => {
            this.addMessageToList(message, message, 'guest');
        });

        this.clientSocket.on('differenceFound', (user: string) => {
            if (this.room.guestInfo) this.addMessageToList(user, `Différence trouvée par ${user}`, 'server');
            else this.addMessageToList(user, 'Différence trouvée', 'server');
        });

        this.clientSocket.on('playerLeft', (user: string) => {
            this.addMessageToList(user, `${user} a abandonné la partie `, 'server');
        });

        this.clientSocket.on('differenceError', (user: string) => {
            if (this.room.guestInfo) this.addMessageToList(user, `Erreur par ${user}`, 'server');
            else this.addMessageToList(user, 'Erreur', 'server');
        });

        this.clientSocket.on('askHint', (user: string) => {
            if (!this.room.guestInfo) this.addMessageToList(user, 'Indice utilisé', 'server');
        });

        this.clientSocket.on('newBestTime', (object: { winnerName: string; index: number; gameMode: string; gameName: string; roomId: string }) => {
            if (this.room.roomId !== object.roomId && !this.messageIsSentTwice(object.winnerName, object.index, object.gameMode, object.gameName)) {
                const message = `${object.winnerName} obtient la position ${object.index} dans les meilleurs temps du jeu ${object.gameName}
                en ${object.gameMode}`;
                this.addMessageToList(object.winnerName, message, 'server');
            }
        });
    }

    // eslint-disable-next-line max-params
    private messageIsSentTwice(winnerName: string, position: number, gameMode: string, gameName: string): boolean {
        return this.messages.some((message) => {
            return message.message === `${winnerName} obtient la position ${position} dans les meilleurs temps du jeu ${gameName} en ${gameMode}`;
        });
    }

    private addMessageToList(dataReceived: string, messageContent: string, sender: string): void {
        if (dataReceived) this.messages.unshift({ message: messageContent, sender, time: Date.now() });
    }
}
