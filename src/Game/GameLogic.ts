import { Vec2 } from "Types";

const CELLS_TO_OPEN_RECURSIVELY_PER_FRAME = 100;

const FIELD_SIZE_COL = 0;
const FIELD_SIZE_ROW = 1;

const FIELD_STATE_OPENED = 16;
const FIELD_STATE_MARKED = 32;

type TGameLogicState = "playing" | "win" | "gameover";

export class GameLogic {
    private fieldSize: Vec2;
    private mines: number;

    private field: boolean[];

    private fieldState: Uint8Array;
    private markedMinesCount: number;
    private closedCellsCount: number;
    private cellsToOpen: number;
    private startTime: Date | undefined;
    private endTime: Date | undefined;
    private gameState: TGameLogicState;
    private isFirstClick: boolean;
    private recursiveOpenNodeStack: number[];

    constructor(fieldSize: Vec2, mines: number) {
        this.fieldSize = fieldSize;
        this.mines = mines;
        this.field = [];
        this.fieldState = new Uint8Array();
        this.markedMinesCount = 0;
        this.closedCellsCount = this.getFieldSize();
        this.cellsToOpen = this.closedCellsCount - this.mines;
        this.isFirstClick = true;
        this.gameState = "playing";
        this.recursiveOpenNodeStack = [];
    }

    isCellExists(col: number, row: number) {
        return col >= 0 && col < this.fieldSize[FIELD_SIZE_COL] && row >= 0 && row < this.fieldSize[FIELD_SIZE_ROW];
    }

    checkCellExistsError(col: number, row: number) {
        if (col < 0 || col >= this.fieldSize[FIELD_SIZE_COL] || row < 0 || row >= this.fieldSize[FIELD_SIZE_ROW]) {
            throw new Error("Cell is out of field");
        }
    }

    getFieldRowSize() {
        return this.fieldSize[FIELD_SIZE_ROW];
    }

    getFieldColSize() {
        return this.fieldSize[FIELD_SIZE_COL];
    }

    getFieldMinesCount() {
        return this.mines;
    }

    getFieldCellId(col: number, row: number) {
        this.checkCellExistsError(col, row);
        return col + row * this.fieldSize[FIELD_SIZE_COL];
    }

    setFieldSizeAndMines(fieldSize: Vec2, mines: number) {
        this.fieldSize = fieldSize;
        this.mines = mines;
    }

    isCellHasMine(col: number, row: number): boolean {
        return this.field[this.getFieldCellId(col, row)];
    }

    getFieldSize() {
        return this.fieldSize[FIELD_SIZE_COL] * this.fieldSize[FIELD_SIZE_ROW];
    }

    getClosedAndNotMarkedMinesCount() {
        return Math.max(0, this.mines - this.markedMinesCount);
    }

    getSecondsFromStart() {
        const endTime = this.endTime || new Date();
        return Math.floor(this.startTime ? (endTime.getTime() - this.startTime.getTime()) / 1000 : 0);
    }

    isCellOpened(col: number, row: number) {
        return (this.fieldState[this.getFieldCellId(col, row)] & FIELD_STATE_OPENED) > 0;
    }

    isCellMarked(col: number, row: number) {
        return (this.fieldState[this.getFieldCellId(col, row)] & FIELD_STATE_MARKED) > 0;
    }

    isCellClosed(col: number, row: number) {
        return !this.isCellOpened(col, row);
    }

    getCellMinesCount(col: number, row: number) {
        return this.fieldState[this.getFieldCellId(col, row)] & 15;
    }

    getCellMinesCountById(index: number) {
        return this.fieldState[index] & 15;
    }

    getColAndRowFromCellId(cellId: number) {
        return {
            col: cellId % this.fieldSize[FIELD_SIZE_COL],
            row: Math.floor(cellId / this.fieldSize[FIELD_SIZE_COL]),
        };
    }

    generateField() {
        this.field = new Array<boolean>(this.getFieldSize()).fill(false);
        this.fieldState = new Uint8Array(this.getFieldSize()).fill(0);
        this.markedMinesCount = 0;
        this.closedCellsCount = this.getFieldSize();
        this.cellsToOpen = this.closedCellsCount - this.mines;
        this.startTime = undefined;
        this.endTime = undefined;
        this.gameState = "playing";
        this.isFirstClick = true;
        this.recursiveOpenNodeStack = [];

        if (this.mines >= this.field.length) {
            this.field = new Array<boolean>(this.field.length).fill(true);
            this.fieldState = new Uint8Array(this.getFieldSize()).fill(9);
            this.mines = this.field.length;
            this.cellsToOpen = 0;
            return;
        }

        let mines = this.mines;
        while (mines > 0) {
            const index = Math.floor(Math.random() * this.field.length);
            if (!this.field[index]) {
                this.field[index] = true;
                mines--;
                const { col, row } = this.getColAndRowFromCellId(index);
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const colIndex = col + i;
                        const rowIndex = row + j;
                        if (this.isCellExists(colIndex, rowIndex)) {
                            const cellIndex = this.getFieldCellId(colIndex, rowIndex);
                            this.fieldState[cellIndex] += 1;
                        }
                    }
                }
            }
        }
    }

    isGamePlaying() {
        return this.gameState === "playing";
    }

    isGameEnded() {
        return this.gameState !== "playing";
    }

    isGameOver() {
        return this.gameState === "gameover";
    }

    isGameWin() {
        return this.gameState === "win";
    }

    private onGameOver() {
        this.gameState = "gameover";
        this.endTime = new Date();
    }

    private openCellsRecursively() {
        for (let k = 0; k < CELLS_TO_OPEN_RECURSIVELY_PER_FRAME; k++) {
            const node = this.recursiveOpenNodeStack.shift();
            if (node === undefined) {
                this.recursiveOpenNodeStack = [];
                break;
            }

            const { col, row } = this.getColAndRowFromCellId(node);
            if (this.isCellOpened(col, row) || this.isCellMarked(col, row)) {
                continue;
            }

            this.fieldState[node] |= FIELD_STATE_OPENED;
            this.closedCellsCount--;

            if (this.getCellMinesCountById(node) === 0) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const colIndex = col + i;
                        const rowIndex = row + j;
                        if (this.isCellExists(colIndex, rowIndex)) {
                            const cellIndex = this.getFieldCellId(colIndex, rowIndex);
                            if (this.isCellClosed(colIndex, rowIndex)) {
                                this.recursiveOpenNodeStack.push(cellIndex);
                            }
                        }
                    }
                }
            }
            if (this.recursiveOpenNodeStack.length === 0) {
                this.recursiveOpenNodeStack = [];
                break;
            }
        }
    }

    openCell(col: number, row: number) {
        if (this.gameState !== "playing" || this.recursiveOpenNodeStack.length > 0) {
            return;
        }

        const isFirstClick = this.isFirstClick;
        this.isFirstClick = false;

        if (this.startTime === undefined) {
            this.startTime = new Date();
        }

        if (this.isCellMarked(col, row)) {
            return;
        }

        if (this.isCellHasMine(col, row)) {
            // TODO: implement on first click handle better way
            if (isFirstClick) {
                const index = this.getFieldCellId(col, row);
                let cellForMineIndex = -1;
                let iterations = 1000;
                while (cellForMineIndex === -1 && iterations-- > 0) {
                    const newIndex = Math.floor(Math.random() * this.field.length);
                    if (!this.field[newIndex]) {
                        cellForMineIndex = newIndex;
                    }
                }
                if (cellForMineIndex === -1) {
                    for (let i = 0; i < this.field.length; i++) {
                        if (!this.field[i] && index !== i) {
                            cellForMineIndex = i;
                            break;
                        }
                    }
                }

                this.field[index] = false;
                this.field[cellForMineIndex] = true;
                const { col: cellForMineCol, row: cellForMineRow } = this.getColAndRowFromCellId(cellForMineIndex);
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const colIndex = col + i;
                        const rowIndex = row + j;
                        if (this.isCellExists(colIndex, rowIndex)) {
                            const cellIndex = this.getFieldCellId(colIndex, rowIndex);
                            this.fieldState[cellIndex] -= 1;
                        }
                        const cellForMineColIndex = cellForMineCol + i;
                        const cellForMineRowIndex = cellForMineRow + j;
                        if (this.isCellExists(cellForMineColIndex, cellForMineRowIndex)) {
                            const cellForMineCellIndex = this.getFieldCellId(cellForMineColIndex, cellForMineRowIndex);
                            this.fieldState[cellForMineCellIndex] += 1;
                        }
                    }
                }
            } else {
                this.fieldState[this.getFieldCellId(col, row)] |= FIELD_STATE_OPENED;
                this.onGameOver();
                return;
            }
        }

        if (this.isCellOpened(col, row)) {
            const minesAround = this.getCellMinesCount(col, row);
            let hasWrongMark = false;
            let markedMinesAround = 0;
            let closedCellsAround = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const colIndex = col + i;
                    const rowIndex = row + j;
                    if (this.isCellExists(colIndex, rowIndex) && this.isCellMarked(colIndex, rowIndex)) {
                        markedMinesAround++;
                        if (!this.isCellHasMine(colIndex, rowIndex)) {
                            hasWrongMark = true;
                        }
                    }
                    if (this.isCellExists(colIndex, rowIndex) && this.isCellClosed(colIndex, rowIndex)) {
                        closedCellsAround++;
                    }
                }
            }
            if (minesAround === markedMinesAround) {
                if (hasWrongMark) {
                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            const colIndex = col + i;
                            const rowIndex = row + j;
                            if (this.isCellExists(colIndex, rowIndex) && !this.isCellMarked(colIndex, rowIndex)) {
                                this.fieldState[this.getFieldCellId(colIndex, rowIndex)] |= FIELD_STATE_OPENED;
                            }
                        }
                    }
                    this.onGameOver();
                    return;
                }
                this.recursiveOpenNodeStack = [];
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const colIndex = col + i;
                        const rowIndex = row + j;
                        if (this.isCellExists(colIndex, rowIndex) && !this.isCellMarked(colIndex, rowIndex)) {
                            const index = this.getFieldCellId(colIndex, rowIndex);
                            this.recursiveOpenNodeStack.push(index);
                        }
                    }
                }
            } else if (minesAround === closedCellsAround) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        const colIndex = col + i;
                        const rowIndex = row + j;
                        if (
                            this.isCellExists(colIndex, rowIndex) &&
                            !this.isCellMarked(colIndex, rowIndex) &&
                            this.isCellClosed(colIndex, rowIndex)
                        ) {
                            this.markCell(colIndex, rowIndex);
                        }
                    }
                }
            }
        } else {
            const index = this.getFieldCellId(col, row);
            this.recursiveOpenNodeStack = [index];
        }
    }

    markCell(col: number, row: number) {
        if (this.gameState !== "playing" || this.recursiveOpenNodeStack.length > 0) {
            return;
        }

        this.isFirstClick = false;

        const index = this.getFieldCellId(col, row);

        if (this.startTime === undefined) {
            this.startTime = new Date();
        }

        if (this.isCellOpened(col, row)) {
            return;
        }

        if (this.isCellMarked(col, row)) {
            this.fieldState[index] &= ~FIELD_STATE_MARKED;
            this.markedMinesCount--;
        } else {
            this.fieldState[index] |= FIELD_STATE_MARKED;
            this.markedMinesCount++;
        }
    }

    update() {
        this.openCellsRecursively();
        if (this.getFieldSize() - this.closedCellsCount === this.cellsToOpen && this.gameState === "playing") {
            this.gameState = "win";
            this.endTime = new Date();
        }
    }

    save() {
        return {
            fieldSize: this.fieldSize,
            mines: this.mines,
            field: this.field,
            fieldState: Array.from(this.fieldState),
            markedMinesCount: this.markedMinesCount,
            closedCellsCount: this.closedCellsCount,
            cellsToOpen: this.cellsToOpen,
            startTime: this.startTime,
            endTime: this.endTime,
            gameState: this.gameState,
            isFirstClick: this.isFirstClick,
            recursiveOpenNodeStack: this.recursiveOpenNodeStack,
        };
    }

    load(data: any) {
        this.fieldSize = data.fieldSize;
        this.mines = data.mines;
        this.field = data.field;
        this.fieldState = new Uint8Array(data.fieldState);
        this.markedMinesCount = data.markedMinesCount;
        this.closedCellsCount = data.closedCellsCount;
        this.cellsToOpen = data.cellsToOpen;
        this.startTime = data.startTime;
        this.endTime = data.endTime;
        this.gameState = data.gameState;
        this.isFirstClick = data.isFirstClick;
        this.recursiveOpenNodeStack = data.recursiveOpenNodeStack;
    }

    consolePrint() {
        const resultStrArr: string[] = [];
        for (let row = 0; row < this.fieldSize[FIELD_SIZE_ROW]; row++) {
            let resultStr = "";
            for (let col = 0; col < this.fieldSize[FIELD_SIZE_COL]; col++) {
                resultStr += this.isCellHasMine(col, row) ? "@" : "#";
            }
            resultStrArr.push(resultStr);
        }
        console.log(resultStrArr.reverse().join("\n"));
    }
}