import { Component, OnDestroy, OnInit } from '@angular/core';
import { Message } from '@app/interfaces/message';
import { ClassicRoom } from '@app/interfaces/rooms';
import { ChatService } from '@app/services/chat-service/chat.service';
import { ClassicGameManagerService } from '@app/services/classic-game-manager-service/classic-game-manager.service';
import { LimitedTimeService } from '@app/services/limited-time-service/limited-time.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-chat-inbox',
    templateUrl: './chat-inbox.component.html',
    styleUrls: ['./chat-inbox.component.scss'],
})
export class ChatInboxComponent implements OnInit, OnDestroy {
    message: string;
    messages: Message[];
    roomInformation: ClassicRoom;
    isLimitedGame: boolean;
    private subscription: Subscription;

    constructor(private classicManager: ClassicGameManagerService, private chatService: ChatService, private limitedManager: LimitedTimeService) {
        this.message = '';
        this.messages = chatService.messages;
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.chatService.messages = [];
    }

    ngOnInit(): void {
        this.limitedManager.isLimitedTimeGame.subscribe((isLimitedGame: boolean) => {
            this.isLimitedGame = isLimitedGame;
        });
        if (this.isLimitedGame) {
            this.limitedManager.connect();
            this.subscription = this.limitedManager.getRoomInfo().subscribe((roomInfo: ClassicRoom) => {
                this.roomInformation = roomInfo;
                this.chatService.room = roomInfo;
            });
        } else {
            this.classicManager.connect();
            this.subscription = this.classicManager.getRoomInfo().subscribe((roomInfo: ClassicRoom) => {
                this.roomInformation = roomInfo;
                this.chatService.room = roomInfo;
            });
        }
        this.chatService.handleChatSockets();
    }

    onKeyEvent(event: KeyboardEvent): void {
        event.stopPropagation();
        if (event.key !== 'Enter') return;
        this.sendMessage();
    }

    sendMessage(): void {
        if (!this.isEmpty()) {
            this.chatService.sendMessage(this.roomInformation, this.message);
            this.messages.unshift({ message: this.message, sender: 'me', time: Date.now() });
            this.message = '';
        }
    }

    isEmpty(): boolean {
        return this.message.trim().length <= 0;
    }
}
