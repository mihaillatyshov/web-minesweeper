type TMouseButtonEventFunc = (button: number) => void;
type TWheelEventFunc = (x: number, y: number) => void;

export class GameWindow {
    private canvas: HTMLCanvasElement;
    private mouseButtonsPressed: Set<number> = new Set();
    private mousePosition: [number, number] = [0, 0];
    private onMouseButtonDown: TMouseButtonEventFunc | undefined;
    private onMouseButtonUp: TMouseButtonEventFunc | undefined;
    private onWheel: TWheelEventFunc | undefined;

    constructor(
        canvas: HTMLCanvasElement,
        onMouseButtonDown?: TMouseButtonEventFunc,
        onMouseButtonUp?: TMouseButtonEventFunc,
        onWheel?: TWheelEventFunc
    ) {
        this.canvas = canvas;

        this.onMouseButtonDown = onMouseButtonDown;
        this.onMouseButtonUp = onMouseButtonUp;
        this.onWheel = onWheel;

        window.addEventListener("mousedown", (e) => {
            this.mouseButtonsPressed.add(e.button);
            this.onMouseButtonDown && this.onMouseButtonDown(e.button);
        });

        window.addEventListener("mouseup", (e) => {
            this.mouseButtonsPressed.delete(e.button);
            this.onMouseButtonUp && this.onMouseButtonUp(e.button);
        });

        window.addEventListener("mousemove", (e) => {
            this.mousePosition = [e.clientX, e.clientY];
        });

        window.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });
        canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const x = e.shiftKey ? -e.deltaY : -e.deltaX;
            const y = e.shiftKey ? e.deltaX : e.deltaY;
            this.onWheel && this.onWheel(x, y);
        });
    }

    setOnMouseButtonDown(func: TMouseButtonEventFunc) {
        this.onMouseButtonDown = func;
    }

    setOnMouseButtonUp(func: TMouseButtonEventFunc) {
        this.onMouseButtonUp = func;
    }

    setOnWheel(func: TWheelEventFunc) {
        this.onWheel = func;
    }

    isMouseButtonPressed(button: number): boolean {
        return this.mouseButtonsPressed.has(button);
    }

    getMousePosition() {
        return {
            x: this.mousePosition[0] - this.canvas.getBoundingClientRect().left,
            y: this.canvas.getBoundingClientRect().bottom - this.mousePosition[1],
        };
    }

    isMouseInside() {
        const mousePos = this.getMousePosition();
        return mousePos.x >= 0 && mousePos.y >= 0 && mousePos.x < this.canvas.width && mousePos.y < this.canvas.height;
    }
}
