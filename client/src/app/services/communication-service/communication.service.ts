import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AdminConstants } from '@app/interfaces/admin-constants';
import { AdminConstantsToNumber } from '@app/interfaces/admin-constants-number';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GameData, GameSheet, ServerGameSheet } from 'src/app/interfaces/game-sheet';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.serverURL;

    constructor(private readonly http: HttpClient) {}

    getGameNames(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/admin/gameNames`).pipe(catchError(this.handleError<string[]>('getGameNames')));
    }

    getGames(): Observable<GameSheet[]> {
        return this.http.get<GameSheet[]>(`${this.baseUrl}/admin/games`).pipe(catchError(this.handleError<GameSheet[]>('getGames')));
    }

    getAllGames(): Observable<GameData[]> {
        return this.http.get<GameData[]>(`${this.baseUrl}/admin/gameData`).pipe(catchError(this.handleError<GameData[]>('getGames')));
    }

    getGame(gameName: string): Observable<GameData> {
        return this.http.get<GameData>(`${this.baseUrl}/admin/game/${gameName}`).pipe(catchError(this.handleError<GameData>('getGame')));
    }

    postGame(gameData: ServerGameSheet): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/admin/createGame`, gameData).pipe(catchError(this.handleError<void>('postGame')));
    }

    putAdminConstants(constants: AdminConstantsToNumber): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/admin/`, constants).pipe(catchError(this.handleError<void>('putConstants')));
    }

    getAdminConstants(): Observable<AdminConstants> {
        return this.http.get<AdminConstants>(`${this.baseUrl}/admin/constants`).pipe(catchError(this.handleError<AdminConstants>('basicPut')));
    }

    deleteGame(gameName: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/deleteGame/${gameName}`).pipe(catchError(this.handleError<void>('basicDelete')));
    }

    deleteGames(): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/deleteGames/`).pipe(catchError(this.handleError<void>('basicDelete')));
    }

    deleteBestTimes(gameName: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/deleteBestTimes/${gameName}`).pipe(catchError(this.handleError<void>('basicDelete')));
    }

    deleteAllBestTimes(): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/deleteAllBestTimes/`).pipe(catchError(this.handleError<void>('basicDelete')));
    }

    resetConstants(): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/admin/updateConstants/`, '').pipe(catchError(this.handleError<void>('basicPut')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
