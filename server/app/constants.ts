export const DEFAULT_COUNTDOWN_VALUE = 30;
export const DEFAULT_HINT_PENALTY = 5;
export const DEFAULT_BONUS_TIME = 5;
export const MAX_COUNTDOWNTIMER_VALUE = 120;
export const SERVER_TIMEOUT = 1000;

export const NUMBER_LENGTH_FOR_KEY = 36;
export const BEGIN_SUBSTRING_NUMBER = 2;
export const KEY_SIZE = 9;

export const INDEX_NOT_FOUND = -1;

export const FIRST_INDEX = 0;
export const LAST_INDEX = 3;

export const MAX_TIME = 120;

export const DB_USERNAME = '';
export const DB_PASSWORD = '';
export const DB_URL = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.ujabntz.mongodb.net/?retryWrites=true&w=majority`;
export const DB_NAME = 'games';
export const COLLECTION_GAME_CONSTANTS = 'game_constants';
export const COLLECTION_GAME_TIMES = 'game_times';

export const DEFAULT_BEST_TIMES = [
    { name: 'John Doe', time: 100 },
    { name: 'Jane Doe', time: 200 },
    { name: 'the scream', time: 250 },
];

export const DEFAULT_CONSTANTS = {
    initialTime: DEFAULT_COUNTDOWN_VALUE,
    penaltyTime: DEFAULT_HINT_PENALTY,
    bonusTime: DEFAULT_BONUS_TIME,
};
