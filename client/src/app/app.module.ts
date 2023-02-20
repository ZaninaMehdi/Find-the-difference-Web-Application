import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GameSheetComponent } from '@app/components/game-sheet/game-sheet.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AdminConstantsFormComponent } from './components/admin-constants-form/admin-constants-form.component';
import { AlertMessageComponent } from './components/alert-message/alert-message.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { ChatInboxComponent } from './components/chat-inbox/chat-inbox.component';
import { HeaderComponent } from './components/header/header.component';
import { ImageCanvasComponent } from './components/image-canvas/image-canvas.component';
import { PlayerNamePopUpComponent } from './components/player-name-pop-up/player-name-pop-up.component';
import { ValidationPopUpComponent } from './components/validation-pop-up/validation-pop-up.component';
import { AdminViewComponent } from './pages/admin-view/admin-view.component';
import { CreateGamePageComponent } from './pages/create-game-page/create-game-page.component';
import { GuestWaitingRoomComponent } from './pages/guest-waiting-room/guest-waiting-room.component';
import { LimitedTimeComponent } from './pages/limited-time/limited-time.component';
import { SelectionViewComponent } from './pages/selection-view/selection-view.component';
import { WaitingRoomComponent } from './pages/waiting-room/waiting-room.component';

import { TooltipModule } from 'primeng/tooltip';

@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        PlayAreaComponent,
        SidebarComponent,
        SelectionViewComponent,
        GameSheetComponent,
        CreateGamePageComponent,
        AlertMessageComponent,
        ImageCanvasComponent,
        ValidationPopUpComponent,
        AdminViewComponent,
        AdminConstantsFormComponent,
        CarouselComponent,
        PlayerNamePopUpComponent,
        HeaderComponent,
        WaitingRoomComponent,
        GuestWaitingRoomComponent,
        ChatInboxComponent,
        LimitedTimeComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        CalendarModule,
        DialogModule,
        ConfirmPopupModule,
        ToastModule,
        TableModule,
        MenubarModule,
        TagModule,
        TooltipModule,
    ],
    providers: [HttpClientModule],
    bootstrap: [AppComponent],
})
export class AppModule {}
