import { GameWindow } from "GameWidnow";

import { GameLogic } from "Game/GameLogic";
import { GameField, IField } from "Game/IField";
import { CAMERA_OFFSET_X, CAMERA_OFFSET_Y, FIELD_CELL_SIZE } from "Game/Constants";

import { gHtmlCanvasInstance } from "HtmlCanvas/HtmlCanvasInstance";
import { createHtmlCanvasTexture } from "HtmlCanvas/HtmlCanvasTexture";

import { getTheme } from "Theme";
import { Vec2 } from "Types";

interface TDrawData {
    uiTextureDark: HTMLImageElement;
    uiTextureLight: HTMLImageElement;
}

export class HtmlCanvasField extends GameField implements IField {
    private context: CanvasRenderingContext2D | null = null;

    private drawData: TDrawData | null = null;

    private textureIdArray: Uint8Array = new Uint8Array(0);

    async init(width: number, height: number) {
        if (!gHtmlCanvasInstance) {
            throw new Error("HtmlCanvasInstance is not initialized");
        }

        this.baseInit(width, height);

        this.context = gHtmlCanvasInstance.getContext();

        const { maxDrawColCount, maxDrawRowCount } = this.getMaxFieldRowAndColCount(
            this.windowWidth,
            this.windowHeight
        );
        this.textureIdArray = new Uint8Array(maxDrawColCount * maxDrawRowCount);

        const uiTextureDark = await createHtmlCanvasTexture("assets/textures/field_atlas_dark.png");
        const uiTextureLight = await createHtmlCanvasTexture("assets/textures/field_atlas_light.png");

        this.drawData = {
            uiTextureDark,
            uiTextureLight,
        };
    }

    update(gameLogic: GameLogic, gameWindow: GameWindow) {
        const { maxDrawColCount, maxDrawRowCount } = this.getMaxFieldRowAndColCount(
            this.windowWidth,
            this.windowHeight
        );
        const { col: hoveredCellCol, row: hoveredCellRow } = this.getHoveredCell(gameWindow);

        const isMouseInside = this.isMouseInside(gameWindow);
        const isLeftMouseButtonPressed = gameWindow.isMouseButtonPressed(0);
        const isHoveredCellOpened =
            gameLogic.isCellExists(hoveredCellCol, hoveredCellRow) &&
            gameLogic.isCellOpened(hoveredCellCol, hoveredCellRow);

        const textureIdBufferColOffset = Math.ceil(this.cameraPosition.x / FIELD_CELL_SIZE);
        const textureIdBufferRowOffset = Math.ceil(this.cameraPosition.y / FIELD_CELL_SIZE);
        for (let i = 0; i < maxDrawRowCount * maxDrawColCount; i++) {
            const row = Math.floor(i / maxDrawColCount) - textureIdBufferRowOffset;
            const col = (i % maxDrawColCount) - textureIdBufferColOffset;

            const isPressed =
                gameLogic.isGamePlaying() &&
                isMouseInside &&
                isLeftMouseButtonPressed &&
                ((hoveredCellCol === col && hoveredCellRow === row) ||
                    (isHoveredCellOpened &&
                        Math.abs(hoveredCellCol - col) <= 1 &&
                        Math.abs(hoveredCellRow - row) <= 1));
            this.textureIdArray[i] = this.getFieldTextureId(gameLogic, col, row, isPressed);
        }
    }

    private drawRect(pos: Vec2, textureId: number) {
        if (!this.context) {
            throw new Error("HtmlCanvasUi is not initialized");
        }

        if (!this.drawData) {
            throw new Error("WebGpuUi drawData in not created!");
        }

        const texture = getTheme() === "dark" ? this.drawData.uiTextureDark : this.drawData.uiTextureLight;

        const atlasPos = [(textureId % 8) * FIELD_CELL_SIZE * 2, Math.floor(textureId / 8) * FIELD_CELL_SIZE * 2];

        this.context.drawImage(
            texture,
            atlasPos[0],
            atlasPos[1],
            FIELD_CELL_SIZE * 2,
            FIELD_CELL_SIZE * 2,
            pos[0],
            this.windowHeight - pos[1] - FIELD_CELL_SIZE,
            FIELD_CELL_SIZE,
            FIELD_CELL_SIZE
        );
    }

    draw() {
        const offsetX = CAMERA_OFFSET_X + (this.cameraPosition.x % FIELD_CELL_SIZE);
        const offsetY = CAMERA_OFFSET_Y + (this.cameraPosition.y % FIELD_CELL_SIZE);

        const { maxDrawColCount, maxDrawRowCount } = this.getMaxFieldRowAndColCount(
            this.windowWidth,
            this.windowHeight
        );

        for (let i = 0; i < maxDrawRowCount * maxDrawColCount; i++) {
            const row = Math.floor(i / maxDrawColCount);
            const col = i % maxDrawColCount;
            this.drawRect([col * FIELD_CELL_SIZE + offsetX, row * FIELD_CELL_SIZE + offsetY], this.textureIdArray[i]);
        }
    }
}
