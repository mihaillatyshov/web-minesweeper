export interface IRendererInstance {
    init: (canvas: HTMLCanvasElement) => Promise<void>;
    beginFrame: () => void;
    endFrame: () => void;
}

export interface IRendererInstanceConstructor {
    new (): IRendererInstance;
}
