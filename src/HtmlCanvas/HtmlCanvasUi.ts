import { GameWindow } from "GameWidnow";

import { GameLogic } from "Game/GameLogic";
import { TFieldCameraState } from "Game/IField";
import {
    createUiSpriteData,
    GameUi,
    IUi,
    TEXT_ARRAY,
    TUiSpriteData,
    uiFrameBorderBot,
    uiFrameBorderBotLeft,
    uiFrameBorderBotRight,
    uiFrameBorderTop,
    uiFrameBorderTopLeft,
    uiFrameBorderTopRight,
    uiFrameCenter,
    uiFrameBorderLeft,
    uiFrameBorderRight,
    uiFrameBorderCenterLeft,
    uiFrameBorderCenterRight,
    uiFrameBorderCenter,
    uiFrameInfoLeft,
    uiFrameInfoRight,
    uiTextMinesPosArray,
    uiTextTimePosArray,
    uiFaceDefaultUvPos,
    uiFacePressUvPos,
    uiFaceWinUvPos,
    uiFaceLoseUvPos,
    uiFacePos,
    uiScrollPointTop,
    uiScrollPointLeft,
    uiScrollPointRight,
    uiScrollPointBot,
} from "Game/IUi";

import { gHtmlCanvasInstance } from "HtmlCanvas/HtmlCanvasInstance";
import { Vec2 } from "Types";
import { createHtmlCanvasTexture } from "./HtmlCanvasTexture";

import { getTheme } from "Theme";
import { FACE_SIZE, TEXT_SIZE, TEXT_SYM_SIZE } from "Game/Constants";

type TFaceState = "default" | "press" | "win" | "lose";

interface TDrawData {
    uiTextureDark: HTMLImageElement;
    uiTextureLight: HTMLImageElement;
}

export class HtmlCanvasUi extends GameUi implements IUi {
    private context: CanvasRenderingContext2D | null = null;

    private drawData: TDrawData | null = null;

    private closedMines: number = 0;
    private seconds: number = 0;

    private faceState: TFaceState = "default";

    private fieldCameraState: TFieldCameraState = {
        isOnBottom: false,
        isOnLeft: false,
        isOnRight: false,
        isOnTop: false,
    };

    async init(width: number, height: number) {
        if (!gHtmlCanvasInstance) {
            throw new Error("HtmlCanvasInstance is not initialized");
        }

        this.baseInit(width, height);

        this.context = gHtmlCanvasInstance.getContext();

        const uiTextureDark = await createHtmlCanvasTexture("./assets/textures/field_atlas_dark.png");
        const uiTextureLight = await createHtmlCanvasTexture("./assets/textures/field_atlas_light.png");

        this.drawData = {
            uiTextureDark,
            uiTextureLight,
        };
    }

    update(gameLogic: GameLogic, fieldCameraState: TFieldCameraState, gameWindow: GameWindow) {
        this.closedMines = Math.min(gameLogic.getClosedAndNotMarkedMinesCount(), 999);
        this.seconds = Math.min(gameLogic.getSecondsFromStart(), 999);
        this.fieldCameraState = fieldCameraState;

        this.faceState = "default";
        if (this.isMouseInsideFace(gameWindow) && this.mouseOnFaceDown) {
            this.faceState = "press";
        } else if (gameLogic.isGameOver()) {
            this.faceState = "lose";
        } else if (gameLogic.isGameWin()) {
            this.faceState = "win";
        }
    }

    private drawRect(sprite: TUiSpriteData) {
        if (!this.context) {
            throw new Error("HtmlCanvasUi is not initialized");
        }

        if (!this.drawData) {
            throw new Error("WebGpuUi drawData in not created!");
        }

        const texture = getTheme() === "dark" ? this.drawData.uiTextureDark : this.drawData.uiTextureLight;

        this.context.drawImage(
            texture,
            sprite.atlasPos[0],
            sprite.atlasPos[1],
            sprite.atlasSize[0],
            sprite.atlasSize[1],
            sprite.spritePos[0],
            this.windowHeight - sprite.spritePos[1] - sprite.spriteSize[1],
            sprite.spriteSize[0],
            sprite.spriteSize[1]
        );
    }

    draw() {
        if (!this.context) {
            throw new Error("HTMLCanvasUi is not initialized");
        }

        this.drawRect(uiFrameBorderBotLeft(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderBotRight(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderTopLeft(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderTopRight(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderBot(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderTop(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameCenter(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderLeft(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderRight(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderCenterLeft(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderCenterRight(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameBorderCenter(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameInfoLeft(this.windowWidth, this.windowHeight));
        this.drawRect(uiFrameInfoRight(this.windowWidth, this.windowHeight));

        const minesSlice = [
            Math.floor(this.closedMines / 100) % 10,
            Math.floor(this.closedMines / 10) % 10,
            this.closedMines % 10,
        ];
        for (let i = 0; i < 3; i++) {
            const text = TEXT_ARRAY[minesSlice[i]];
            this.drawRect(
                createUiSpriteData(
                    uiTextMinesPosArray[i](this.windowWidth, this.windowHeight),
                    TEXT_SYM_SIZE,
                    text,
                    TEXT_SIZE
                )
            );
        }

        const secondsSlice = [
            Math.floor(this.seconds / 100) % 10,
            Math.floor(this.seconds / 10) % 10,
            this.seconds % 10,
        ];
        for (let i = 0; i < 3; i++) {
            const text = TEXT_ARRAY[secondsSlice[i]];
            this.drawRect(
                createUiSpriteData(
                    uiTextTimePosArray[i](this.windowWidth, this.windowHeight),
                    TEXT_SYM_SIZE,
                    text,
                    TEXT_SIZE
                )
            );
        }

        let faceUvPos = uiFaceDefaultUvPos;
        if (this.faceState === "press") {
            faceUvPos = uiFacePressUvPos;
        } else if (this.faceState === "win") {
            faceUvPos = uiFaceWinUvPos;
        } else if (this.faceState === "lose") {
            faceUvPos = uiFaceLoseUvPos;
        }

        this.drawRect(
            createUiSpriteData(uiFacePos(this.windowWidth, this.windowHeight), [FACE_SIZE, FACE_SIZE], faceUvPos, [
                FACE_SIZE,
                FACE_SIZE,
            ])
        );

        if (!this.fieldCameraState.isOnTop) {
            this.drawRect(uiScrollPointTop(this.windowWidth, this.windowHeight));
        }
        if (!this.fieldCameraState.isOnLeft) {
            this.drawRect(uiScrollPointLeft(this.windowWidth, this.windowHeight));
        }
        if (!this.fieldCameraState.isOnRight) {
            this.drawRect(uiScrollPointRight(this.windowWidth, this.windowHeight));
        }
        if (!this.fieldCameraState.isOnBottom) {
            this.drawRect(uiScrollPointBot(this.windowWidth, this.windowHeight));
        }
    }
}
