import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminViewComponent } from '@app/pages/admin-view/admin-view.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { GuestWaitingRoomComponent } from '@app/pages/guest-waiting-room/guest-waiting-room.component';
import { LimitedTimeComponent } from '@app/pages/limited-time/limited-time.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { SelectionViewComponent } from '@app/pages/selection-view/selection-view.component';
import { WaitingRoomComponent } from '@app/pages/waiting-room/waiting-room.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'create', component: CreateGamePageComponent },
    { path: 'selection', component: SelectionViewComponent },
    { path: 'admin', component: AdminViewComponent },
    { path: 'waiting-room', component: WaitingRoomComponent },
    { path: 'guest-waiting-room', component: GuestWaitingRoomComponent },
    { path: 'limited-time', component: LimitedTimeComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
