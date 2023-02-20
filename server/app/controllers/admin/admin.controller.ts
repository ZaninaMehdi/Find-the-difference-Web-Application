import { AdminConstants } from '@app/interfaces/admin-constants';
import { AdminService } from '@app/services/admin/admin.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class AdminController {
    router: Router;

    constructor(private adminService: AdminService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/games', async (req: Request, res: Response) => {
            const games = await this.adminService.getGames();
            res.json(games).status(StatusCodes.OK);
        });

        this.router.get('/gameData', async (req: Request, res: Response) => {
            const games = await this.adminService.getAllGameData();
            res.json(games).status(StatusCodes.OK);
        });

        this.router.get('/gameNames', (req: Request, res: Response) => {
            res.json(this.adminService.getNames()).status(StatusCodes.OK);
        });

        this.router.get('/game/:name', async (req: Request, res: Response) => {
            this.adminService.getGame(req.params.name).then((game) => {
                res.json(game).status(StatusCodes.OK);
            });
        });

        this.router.post('/createGame', (req: Request, res: Response) => {
            this.adminService.addGame(req.body).then(() => {
                res.sendStatus(StatusCodes.CREATED);
            });
        });

        this.router.put('/', (req: Request, res: Response) => {
            this.adminService.modifyConstants(req.body);
            res.sendStatus(StatusCodes.CREATED);
        });

        this.router.get('/constants', (req: Request, res: Response) => {
            this.adminService.getConstants().then((constants: AdminConstants) => {
                res.send(constants).status(StatusCodes.OK);
            });
        });

        this.router.delete('/deleteGame/:gameName', (req: Request, res: Response) => {
            this.adminService.deleteGame(req.params.gameName).then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
            });
        });
        this.router.delete('/deleteGames', (req: Request, res: Response) => {
            this.adminService.deleteGames().then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
            });
        });
        this.router.delete('/deleteBestTimes/:gameName', (req: Request, res: Response) => {
            this.adminService.resetBestTimesForOneGame(req.params.gameName).then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
            });
        });
        this.router.delete('/deleteAllBestTimes', (req: Request, res: Response) => {
            this.adminService.resetBestTimesForAllGames().then(() => {
                res.sendStatus(StatusCodes.NO_CONTENT);
            });
        });
        this.router.put('/updateConstants/', (req: Request, res: Response) => {
            this.adminService.resetConstants().then(() => {
                res.sendStatus(StatusCodes.OK);
            });
        });
    }
}
