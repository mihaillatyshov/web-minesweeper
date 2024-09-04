import { GameWindow } from "GameWidnow";

import { GameLogic } from "Game/GameLogic";
import { BORDER_X, BORDER_Y, CAMERA_OFFSET_X, CAMERA_OFFSET_Y, FIELD_CELL_SIZE, INFO_Y } from "Game/Constants";

const DRAW_NOT_ALLIGNED_BIAS = 3;

const TEXTURE_FIELD_OPENED_ZERO = 0;
const TEXTURE_FIELD_CLOSED = 17;
const TEXTURE_FIELD_PRESSED = 18;
const TEXTURE_FIELD_MINE_MARKED = 19;
const TEXTURE_FIELD_MINE_MARKED_WRONG = 20;
const TEXTURE_FIELD_MINE = 21;
const TEXTURE_FIELD_MINE_WRONG = 22;
const TEXTURE_FIELD_EMPTY = 23;

export interface TFieldCameraState {
    isOnRight: boolean;
    isOnBottom: boolean;
    isOnLeft: boolean;
    isOnTop: boolean;
}

export class GameField {
    protected windowWidth: number = 0;
    protected windowHeight: number = 0;

    protected cameraPosition = { x: 0, y: 0 };

    baseInit(width: number, height: number) {
        this.windowWidth = width;
        this.windowHeight = height;
    }

    private isScrollAllowed() {
        return true;
    }

    calcCameraMaxLimits(gameLogic: GameLogic) {
        return {
            x: -(gameLogic.getFieldColSize() * FIELD_CELL_SIZE - (this.windowWidth - BORDER_X * 2)),
            y: -(gameLogic.getFieldRowSize() * FIELD_CELL_SIZE - (this.windowHeight - BORDER_Y * 3 - INFO_Y)),
        };
    }

    moveCamera(gameLogic: GameLogic, x: number, y: number) {
        if (this.isScrollAllowed()) {
            this.cameraPosition.x += x;
            this.cameraPosition.y += y;
        }

        const { x: maxX, y: maxY } = this.calcCameraMaxLimits(gameLogic);

        this.cameraPosition.x = Math.min(0, Math.max(maxX, this.cameraPosition.x));
        this.cameraPosition.y = Math.min(0, Math.max(maxY, this.cameraPosition.y));
    }

    getHoveredCell(gameWindow: GameWindow) {
        return {
            col: Math.floor(
                (gameWindow.getMousePosition().x - this.cameraPosition.x - CAMERA_OFFSET_X) / FIELD_CELL_SIZE
            ),
            row: Math.floor(
                (gameWindow.getMousePosition().y - this.cameraPosition.y - CAMERA_OFFSET_Y) / FIELD_CELL_SIZE
            ),
        };
    }

    isMouseInside(gameWindow: GameWindow) {
        const { x, y } = gameWindow.getMousePosition();
        return (
            gameWindow.isMouseInside() &&
            x > BORDER_X &&
            y > BORDER_Y &&
            x < this.windowWidth - BORDER_X &&
            y < this.windowHeight - BORDER_Y * 2 - INFO_Y
        );
    }

    getFieldCameraState(gameLogic: GameLogic): TFieldCameraState {
        const epsilon = 0.01;
        const { x: maxX, y: maxY } = this.calcCameraMaxLimits(gameLogic);
        return {
            isOnBottom: Math.abs(this.cameraPosition.y) < epsilon,
            isOnTop: Math.abs(this.cameraPosition.y - maxY) < epsilon,
            isOnLeft: Math.abs(this.cameraPosition.x) < epsilon,
            isOnRight: Math.abs(this.cameraPosition.x - maxX) < epsilon,
        };
    }

    getMaxFieldRowAndColCount(width: number, height: number) {
        return {
            maxDrawColCount: Math.floor(width / FIELD_CELL_SIZE) + DRAW_NOT_ALLIGNED_BIAS,
            maxDrawRowCount: Math.floor(height / FIELD_CELL_SIZE) + DRAW_NOT_ALLIGNED_BIAS,
        };
    }

    getFieldTextureId = (gameLogic: GameLogic, col: number, row: number, isPressed: boolean): number => {
        if (!gameLogic.isCellExists(col, row)) {
            return TEXTURE_FIELD_EMPTY;
        }

        if (gameLogic.isGameOver()) {
            if (gameLogic.isCellMarked(col, row) && !gameLogic.isCellHasMine(col, row)) {
                return TEXTURE_FIELD_MINE_MARKED_WRONG;
            }
            if (gameLogic.isCellHasMine(col, row) && gameLogic.isCellOpened(col, row)) {
                return TEXTURE_FIELD_MINE_WRONG;
            }
            if (gameLogic.isCellMarked(col, row)) {
                return TEXTURE_FIELD_MINE_MARKED;
            }
            if (gameLogic.isCellHasMine(col, row)) {
                return TEXTURE_FIELD_MINE;
            }
        } else if (gameLogic.isGameWin()) {
            if (gameLogic.isCellHasMine(col, row)) {
                return TEXTURE_FIELD_MINE_MARKED;
            }
        }

        if (gameLogic.isCellMarked(col, row)) {
            return TEXTURE_FIELD_MINE_MARKED;
        }

        if (isPressed && gameLogic.isCellClosed(col, row)) {
            return TEXTURE_FIELD_PRESSED;
        }

        if (gameLogic.isCellOpened(col, row)) {
            return TEXTURE_FIELD_OPENED_ZERO + gameLogic.getCellMinesCount(col, row);
        }

        return TEXTURE_FIELD_CLOSED;
    };
}

export interface IField extends GameField {
    init(width: number, height: number): Promise<void>;
    update(gameLogic: GameLogic, gameWindow: GameWindow): void;
    draw(): void;
}

export interface IFieldConstructor {
    new (): IField;
}
