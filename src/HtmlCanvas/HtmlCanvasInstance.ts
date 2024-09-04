import { IRendererInstance } from "Game/IRendererInstance";

export class HtmlCanvasInstance implements IRendererInstance {
    private canvas: HTMLCanvasElement | null = null;
    private context: CanvasRenderingContext2D | null = null;

    constructor() {}

    async init(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");

        gHtmlCanvasInstance = this;
    }

    getContext(): CanvasRenderingContext2D {
        if (!this.context) {
            throw new Error("HtmlCanvasInstance is not initialized");
        }

        return this.context;
    }

    beginFrame() {
        if (!this.canvas || !this.context) {
            throw new Error("HtmlCanvasInstance is not initialized");
        }

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    endFrame() {}
}

export let gHtmlCanvasInstance: HtmlCanvasInstance | null = null;
