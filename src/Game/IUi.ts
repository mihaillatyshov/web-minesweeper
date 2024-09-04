import { GameWindow } from "GameWidnow";

import { GameLogic } from "Game/GameLogic";
import {
    BORDER_X,
    BORDER_Y,
    FACE_SIZE,
    INFO_Y,
    SCROLL_POINT_X,
    SCROLL_POINT_Y,
    TEXT_PAD,
    TEXT_SYM_OFF_X,
    TEXT_SYM_OFF_Y,
    TEXT_SYM_X,
    TEXT_X,
    TEXT_Y,
} from "Game/Constants";
import { TFieldCameraState } from "Game/IField";

import { Vec2 } from "Types";

const TEXT_0: Vec2 = [128, 192] as const;
const TEXT_1: Vec2 = [170, 192] as const;
const TEXT_2: Vec2 = [212, 192] as const;
const TEXT_3: Vec2 = [254, 192] as const;
const TEXT_4: Vec2 = [296, 192] as const;
const TEXT_5: Vec2 = [338, 192] as const;
const TEXT_6: Vec2 = [380, 192] as const;
const TEXT_7: Vec2 = [422, 192] as const;
const TEXT_8: Vec2 = [464, 192] as const;
const TEXT_9: Vec2 = [0, 272] as const;

export const TEXT_ARRAY: Vec2[] = [
    TEXT_0,
    TEXT_1,
    TEXT_2,
    TEXT_3,
    TEXT_4,
    TEXT_5,
    TEXT_6,
    TEXT_7,
    TEXT_8,
    TEXT_9,
] as const;

export class GameUi {
    protected windowWidth: number = 0;
    protected windowHeight: number = 0;

    protected mouseOnFaceDown = false;

    baseInit(width: number, height: number) {
        this.windowWidth = width;
        this.windowHeight = height;
    }

    isMouseInsideFace(gameWindow: GameWindow) {
        const mousePos = gameWindow.getMousePosition();
        const faceOffsetX = this.windowWidth / 2 - FACE_SIZE / 2;
        const faceOffsetY = this.windowHeight - BORDER_Y - INFO_Y / 2 - FACE_SIZE / 2;

        return (
            mousePos.x >= faceOffsetX &&
            mousePos.x <= faceOffsetX + FACE_SIZE &&
            mousePos.y >= faceOffsetY &&
            mousePos.y <= faceOffsetY + FACE_SIZE
        );
    }

    checkFaceClickDown(gameWindow: GameWindow) {
        this.mouseOnFaceDown = this.isMouseInsideFace(gameWindow);
    }

    checkFaceClickUp(gameLogic: GameLogic, gameWindow: GameWindow) {
        if (this.mouseOnFaceDown && this.isMouseInsideFace(gameWindow)) {
            gameLogic.generateField();
        }
        this.mouseOnFaceDown = false;
    }
}

export interface IUi extends GameUi {
    init(width: number, height: number): Promise<void>;
    update(gameLogic: GameLogic, fieldCameraState: TFieldCameraState, gameWindow: GameWindow): void;
    draw(): void;
}

export interface IUiConstructor {
    new (): IUi;
}

export interface TUiSpriteData {
    spritePos: Vec2;
    spriteSize: Vec2;
    atlasPos: Vec2;
    atlasSize: Vec2;
}

export const createUiSpriteData = (
    spritePos: Vec2,
    spriteSize: Vec2,
    atlasPos: Vec2,
    atlasSize: Vec2
): TUiSpriteData => ({
    spritePos,
    spriteSize,
    atlasPos,
    atlasSize,
});

const textBlockOffsetY = (height: number) => height - BORDER_Y - INFO_Y / 2 - TEXT_Y / 2;

/* prettier-ignore */ export const uiFrameBorderBotLeft     = (width: number, height: number) => createUiSpriteData([0                                   , 0                             ], [BORDER_X                , BORDER_Y             ], [162, 272], [BORDER_X, BORDER_Y]);
/* prettier-ignore */ export const uiFrameBorderBotRight    = (width: number, height: number) => createUiSpriteData([width - BORDER_X                    , 0                             ], [BORDER_X                , BORDER_Y             ], [138, 272], [BORDER_X, BORDER_Y]);
/* prettier-ignore */ export const uiFrameBorderTopLeft     = (width: number, height: number) => createUiSpriteData([0                                   , height - BORDER_Y             ], [BORDER_X                , BORDER_Y             ], [114, 272], [BORDER_X, BORDER_Y]);
/* prettier-ignore */ export const uiFrameBorderTopRight    = (width: number, height: number) => createUiSpriteData([width - BORDER_X                    , height - BORDER_Y             ], [BORDER_X                , BORDER_Y             ], [90 , 272], [BORDER_X, BORDER_Y]);
/* prettier-ignore */ export const uiFrameBorderBot         = (width: number, height: number) => createUiSpriteData([BORDER_X                            , 0                             ], [width - BORDER_X * 2    , BORDER_Y             ], [211, 272], [2       , BORDER_Y]);
/* prettier-ignore */ export const uiFrameBorderTop         = (width: number, height: number) => createUiSpriteData([BORDER_X                            , height - BORDER_Y             ], [width - BORDER_X * 2    , BORDER_Y             ], [211, 272], [2       , BORDER_Y]);
/* prettier-ignore */ export const uiFrameCenter            = (width: number, height: number) => createUiSpriteData([BORDER_X                            , height - BORDER_Y - INFO_Y    ], [width - BORDER_X * 2    , INFO_Y               ], [96 , 160], [1       , 1       ]);
/* prettier-ignore */ export const uiFrameBorderLeft        = (width: number, height: number) => createUiSpriteData([0                                   , BORDER_Y                      ], [BORDER_X                , height - BORDER_Y * 2], [186, 273], [BORDER_X, 2       ]);
/* prettier-ignore */ export const uiFrameBorderRight       = (width: number, height: number) => createUiSpriteData([width - BORDER_X                    , BORDER_Y                      ], [BORDER_X                , height - BORDER_Y * 2], [186, 273], [BORDER_X, 2       ]);
/* prettier-ignore */ export const uiFrameBorderCenterLeft  = (width: number, height: number) => createUiSpriteData([0                                   , height - BORDER_Y * 2 - INFO_Y], [BORDER_X                , BORDER_Y             ], [66 , 272], [BORDER_X, BORDER_Y]);
/* prettier-ignore */ export const uiFrameBorderCenterRight = (width: number, height: number) => createUiSpriteData([width - BORDER_X                    , height - BORDER_Y * 2 - INFO_Y], [BORDER_X                , BORDER_Y             ], [42 , 272], [BORDER_X, BORDER_Y]);
/* prettier-ignore */ export const uiFrameBorderCenter      = (width: number, height: number) => createUiSpriteData([BORDER_X                            , height - BORDER_Y * 2 - INFO_Y], [width - BORDER_X * 2    , BORDER_Y             ], [211, 272], [2       , BORDER_Y]);
/* prettier-ignore */ export const uiFrameInfoLeft          = (width: number, height: number) => createUiSpriteData([BORDER_X + TEXT_PAD                 , textBlockOffsetY(height)      ], [TEXT_X                  , TEXT_Y               ], [0  , 192], [128     , 80      ]);
/* prettier-ignore */ export const uiFrameInfoRight         = (width: number, height: number) => createUiSpriteData([width - BORDER_X - TEXT_X - TEXT_PAD, textBlockOffsetY(height)      ], [TEXT_X                  , TEXT_Y               ], [0  , 192], [128     , 80      ]);

const scrollPointWidthCenter = (width: number) => width / 2 - SCROLL_POINT_Y / 2;
const scrollPointHeightCenter = (height: number) => (height - BORDER_Y - INFO_Y) / 2 - SCROLL_POINT_Y / 2;
/* prettier-ignore */ export const uiScrollLeftUvPos : Vec2 = [422, 272];
/* prettier-ignore */ export const uiScrollRightUvPos: Vec2 = [454, 272];
/* prettier-ignore */ export const uiScrollTopUvPos  : Vec2 = [0  , 352];
/* prettier-ignore */ export const uiScrollBotUvPos  : Vec2 = [64 , 352];
/* prettier-ignore */ export const uiScrollXUvSize   : Vec2 = [32 , 64 ];
/* prettier-ignore */ export const uiScrollYUvSize   : Vec2 = [64 , 32 ];
/* prettier-ignore */ export const uiScrollPointLeft  = (width: number, height: number) => createUiSpriteData([BORDER_X                         , scrollPointHeightCenter(height)            ], [SCROLL_POINT_X, SCROLL_POINT_Y], uiScrollLeftUvPos , uiScrollXUvSize);
/* prettier-ignore */ export const uiScrollPointRight = (width: number, height: number) => createUiSpriteData([width - BORDER_X - SCROLL_POINT_X, scrollPointHeightCenter(height)            ], [SCROLL_POINT_X, SCROLL_POINT_Y], uiScrollRightUvPos, uiScrollXUvSize);
/* prettier-ignore */ export const uiScrollPointTop   = (width: number, height: number) => createUiSpriteData([scrollPointWidthCenter(width)    , height - BORDER_Y - INFO_Y - SCROLL_POINT_Y], [SCROLL_POINT_Y, SCROLL_POINT_X], uiScrollTopUvPos  , uiScrollYUvSize);
/* prettier-ignore */ export const uiScrollPointBot   = (width: number, height: number) => createUiSpriteData([scrollPointWidthCenter(width)    , BORDER_Y                                   ], [SCROLL_POINT_Y, SCROLL_POINT_X], uiScrollBotUvPos  , uiScrollYUvSize);

/* prettier-ignore */ export const uiFacePos = (width: number, height: number) => [width / 2 - FACE_SIZE / 2, height - BORDER_Y - INFO_Y / 2 - FACE_SIZE / 2] as Vec2;
/* prettier-ignore */ export const uiFaceDefaultUvPos: Vec2 = [214, 272];
/* prettier-ignore */ export const uiFaceWinUvPos    : Vec2 = [370, 272];
/* prettier-ignore */ export const uiFaceLoseUvPos   : Vec2 = [318, 272];
/* prettier-ignore */ export const uiFacePressUvPos  : Vec2 = [266, 272];

const textOffsetY = (height: number) => height - TEXT_Y - BORDER_Y - TEXT_PAD + TEXT_SYM_OFF_Y;
/* prettier-ignore */ export const uiTextMinesPos0 = (width: number, height: number) => [BORDER_X + TEXT_PAD + TEXT_SYM_OFF_X + (TEXT_SYM_X + TEXT_SYM_OFF_X) * 0                 , textOffsetY(height)] as Vec2;
/* prettier-ignore */ export const uiTextMinesPos1 = (width: number, height: number) => [BORDER_X + TEXT_PAD + TEXT_SYM_OFF_X + (TEXT_SYM_X + TEXT_SYM_OFF_X) * 1                 , textOffsetY(height)] as Vec2;
/* prettier-ignore */ export const uiTextMinesPos2 = (width: number, height: number) => [BORDER_X + TEXT_PAD + TEXT_SYM_OFF_X + (TEXT_SYM_X + TEXT_SYM_OFF_X) * 2                 , textOffsetY(height)] as Vec2;
/* prettier-ignore */ export const uiTextTimePos0  = (width: number, height: number) => [width - BORDER_X - TEXT_PAD - TEXT_X + TEXT_SYM_OFF_X + (TEXT_SYM_X + TEXT_SYM_OFF_X) * 0, textOffsetY(height)] as Vec2;
/* prettier-ignore */ export const uiTextTimePos1  = (width: number, height: number) => [width - BORDER_X - TEXT_PAD - TEXT_X + TEXT_SYM_OFF_X + (TEXT_SYM_X + TEXT_SYM_OFF_X) * 1, textOffsetY(height)] as Vec2;
/* prettier-ignore */ export const uiTextTimePos2  = (width: number, height: number) => [width - BORDER_X - TEXT_PAD - TEXT_X + TEXT_SYM_OFF_X + (TEXT_SYM_X + TEXT_SYM_OFF_X) * 2, textOffsetY(height)] as Vec2;

export const uiTextMinesPosArray = [uiTextMinesPos0, uiTextMinesPos1, uiTextMinesPos2] as const;
export const uiTextTimePosArray = [uiTextTimePos0, uiTextTimePos1, uiTextTimePos2] as const;
