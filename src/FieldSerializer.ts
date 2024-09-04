import { GameLogic } from "Game/GameLogic";

let loadData: any = null;

export const getStartupInputs = () => {
    const params = new URLSearchParams(window.location.search);

    const cols = parseInt(params.get("cols") || "9");
    const rows = parseInt(params.get("rows") || "9");
    const mines = parseInt(params.get("mines") || "10");
    const load = params.get("load");

    return { cols, rows, mines, load };
};

export const startNewGame = (cols: number | string, rows: number | string, mines: number | string) => {
    window.location.href = `?cols=${cols}&rows=${rows}&mines=${mines}`;
};

export class GameDataBase {
    private db: IDBDatabase | null = null;

    constructor(onDBReady: () => void, onDBError: () => void) {
        const openRequest = window.indexedDB.open("minesweeper", 1);

        openRequest.onsuccess = () => {
            this.db = openRequest.result;
            onDBReady();
        };

        openRequest.onerror = () => {
            onDBError();
        };

        openRequest.onupgradeneeded = () => {
            this.db = openRequest.result;
            this.db.createObjectStore("games", { keyPath: "id" });
        };
    }

    saveGame(gameLogic: GameLogic) {
        const data = gameLogic.save();
        const tx = this.db?.transaction("games", "readwrite");
        const store = tx?.objectStore("games");
        store?.put({ id: 1, data });
    }

    loadGame(gameLogic: GameLogic, onLoadSuccess: () => void, onLoadError: () => void) {
        const tx = this.db?.transaction("games", "readonly");
        const store = tx?.objectStore("games");
        const request = store?.get(1);
        if (!request) {
            console.error("Error loading game");
            return undefined;
        }
        request.onsuccess = () => {
            console.log(request);
            if (!request.result) {
                onLoadError();
                return;
            }
            gameLogic.load(request.result.data);
            onLoadSuccess();
        };
        request.onerror = () => {
            // TODO: handle error
        };
    }
}
