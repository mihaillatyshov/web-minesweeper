import { GameLogic } from "Game/GameLogic";
import { GameWindow } from "GameWidnow";
import { calcCanvasSize } from "Game/Utils";
import { IRendererInstanceConstructor } from "Game/IRendererInstance";
import { IFieldConstructor } from "Game/IField";

import { GameDataBase, getStartupInputs, startNewGame } from "FieldSerializer";

import { WebGpuInstance } from "WebGpu/WebGpuInstance";
import { WebGpuField } from "WebGpu/WebGpuField";
import { WebGpuUi } from "WebGpu/WebGpuUi";

import { HtmlCanvasInstance } from "HtmlCanvas/HtmlCanvasInstance";
import { HtmlCanvasField } from "HtmlCanvas/HtmlCanvasField";
import { HtmlCanvasUi } from "HtmlCanvas/HtmlCanvasUi";

import { detectColorScheme, getTheme } from "Theme";

import "./styles.css";
import { IUiConstructor } from "Game/IUi";

const THEME_DARK_ICON = "assets/img/theme_dark.png";
const THEME_LIGHT_ICON = "assets/img/theme_light.png";

let InstanceType: IRendererInstanceConstructor = WebGpuInstance;
let FieldType: IFieldConstructor = WebGpuField;
let UiType: IUiConstructor = WebGpuUi;

if (true) {
    InstanceType = HtmlCanvasInstance;
    FieldType = HtmlCanvasField;
    UiType = HtmlCanvasUi;
}

detectColorScheme();

const themeToggleSwitch = document.querySelector('#theme-switch input[type="checkbox"]') as HTMLInputElement;
const themeIcon = document.querySelector("#theme-switch img") as HTMLImageElement;

function switchTheme(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.checked) {
        localStorage.setItem("theme", "dark");
        document.documentElement.setAttribute("data-theme", "dark");
        themeToggleSwitch.checked = true;
        themeIcon.src = THEME_DARK_ICON;
    } else {
        localStorage.setItem("theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
        themeToggleSwitch.checked = false;
        themeIcon.src = THEME_LIGHT_ICON;
    }
}

themeToggleSwitch.addEventListener("change", switchTheme, false);

document.getElementById("form-field")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(document.getElementById("form-field") as HTMLFormElement);
    const cols = parseInt((formData.get("cols") as string) || "0");
    const rows = parseInt((formData.get("rows") as string) || "0");
    const mines = parseInt((formData.get("mines") as string) || "0");
    if (!cols || !rows || !mines) {
        return;
    }

    if (mines >= cols * rows) {
        document.getElementById("error-message")!.innerHTML = "Mines count must be less than field size";
        return;
    }

    startNewGame(cols, rows, mines);
});
document.getElementById("new-game-beginner")?.addEventListener("click", () => {
    startNewGame("9", "9", "10");
});
document.getElementById("new-game-intermediate")?.addEventListener("click", () => {
    startNewGame("16", "16", "40");
});
document.getElementById("new-game-expert")?.addEventListener("click", () => {
    startNewGame("30", "16", "99");
});
document.getElementById("load-game")?.addEventListener("click", () => {
    window.location.href = "?load=true";
});

if (getTheme() == "dark") {
    themeToggleSwitch.checked = true;
    themeIcon.src = "assets/img/theme_dark.png";
} else {
    themeToggleSwitch.checked = false;
    themeIcon.src = "assets/img/theme_light.png";
}

const { cols, rows, mines, load } = getStartupInputs();

const gameLogic = new GameLogic([cols, rows], mines);

const start = async () => {
    const { width: canvasWidth, height: canvasHeight } = calcCanvasSize(
        gameLogic.getFieldColSize(),
        gameLogic.getFieldRowSize()
    );
    const canvas = document.getElementById("app") as HTMLCanvasElement;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const instance = new InstanceType();
    const gameWindow = new GameWindow(canvas);

    let frame = 0;
    await instance.init(canvas);

    const field = new FieldType();
    await field.init(canvas.width, canvas.height);

    const ui = new UiType();
    await ui.init(canvas.width, canvas.height);

    gameWindow.setOnMouseButtonUp((button) => {
        if (button === 0) {
            const hoveredCell = field.getHoveredCell(gameWindow);
            if (field.isMouseInside(gameWindow) && gameLogic.isCellExists(hoveredCell.col, hoveredCell.row)) {
                gameLogic.openCell(hoveredCell.col, hoveredCell.row);
            }
            ui.checkFaceClickUp(gameLogic, gameWindow);
        }
    });
    gameWindow.setOnMouseButtonDown((button) => {
        if (button === 0) {
            ui.checkFaceClickDown(gameWindow);
        }
        if (button === 2) {
            const hoveredCell = field.getHoveredCell(gameWindow);
            if (gameLogic.isCellExists(hoveredCell.col, hoveredCell.row)) {
                gameLogic.markCell(hoveredCell.col, hoveredCell.row);
            }
        }
    });
    gameWindow.setOnWheel((x, y) => {
        field.moveCamera(gameLogic, x, y);
    });

    const render = () => {
        frame++;

        gameLogic.update();
        field.update(gameLogic, gameWindow);
        ui.update(gameLogic, field.getFieldCameraState(gameLogic), gameWindow);

        instance.beginFrame();

        field.draw();
        ui.draw();

        instance.endFrame();

        requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
};

const gameDataBase = new GameDataBase(
    () => {
        document.getElementById("save-game")?.addEventListener("click", () => {
            gameDataBase.saveGame(gameLogic);
        });

        if (load) {
            gameDataBase.loadGame(
                gameLogic,
                () => {
                    document
                        .getElementById("field-cols")
                        ?.setAttribute("value", gameLogic.getFieldColSize().toString());
                    document
                        .getElementById("field-rows")
                        ?.setAttribute("value", gameLogic.getFieldRowSize().toString());
                    document
                        .getElementById("field-mines")
                        ?.setAttribute("value", gameLogic.getFieldMinesCount().toString());

                    const params = new URLSearchParams(window.location.search);
                    params.delete("load");
                    console.log(params.toString());
                    history.replaceState(null, "", "?" + params.toString());

                    start();
                },
                () => {
                    document.getElementById("error-message")!.innerHTML = "Error loading game";
                }
            );
        }
    },
    () => {
        if (load) {
            document.getElementById("error-message")!.innerHTML = "Error loading game";
        }
    }
);

if (!load) {
    document.getElementById("field-cols")?.setAttribute("value", cols.toString());
    document.getElementById("field-rows")?.setAttribute("value", rows.toString());
    document.getElementById("field-mines")?.setAttribute("value", mines.toString());

    gameLogic.generateField();

    start();
}
