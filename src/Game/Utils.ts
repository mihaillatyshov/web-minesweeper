import { BORDER_X, BORDER_Y, FIELD_CELL_SIZE, INFO_Y } from "./Constants";

export const calcCanvasSize = (cols: number, rows: number) => {
    return {
        width: Math.min(1280, cols * FIELD_CELL_SIZE + BORDER_X * 2),
        height: Math.min(720, rows * FIELD_CELL_SIZE + BORDER_Y * 3 + INFO_Y),
    };
};
