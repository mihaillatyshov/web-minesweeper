import { Vec2 } from "Types";

export const FIELD_CELL_SIZE = 32;

export const TEXT_SIZE: Vec2 = [42, 80];

export const BORDER_X = 24;
export const BORDER_Y = 22;
export const INFO_Y = 64;
export const TEXT_X = 82;
export const TEXT_Y = 50;
export const FACE_SIZE = 52;

export const TEXT_SYM_X = 22;
export const TEXT_SYM_Y = 42;
export const TEXT_SYM_SIZE: Vec2 = [TEXT_SYM_X, TEXT_SYM_Y];
export const TEXT_SYM_OFF_X = (TEXT_X - TEXT_SYM_X * 3) / 4;
export const TEXT_SYM_OFF_Y = (TEXT_Y - TEXT_SYM_Y) / 2;

export const TEXT_PAD = (INFO_Y - TEXT_Y) / 2;

export const SCROLL_POINT_X = 12;
export const SCROLL_POINT_Y = 32;

export const CAMERA_OFFSET_X = BORDER_X;
export const CAMERA_OFFSET_Y = BORDER_Y;

export const TEXTURE_SIZE = 512;
