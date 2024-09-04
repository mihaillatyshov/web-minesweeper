import { IRendererInstance } from "Game/IRendererInstance";

export class WebGpuInstance implements IRendererInstance {
    private adapter: GPUAdapter | null = null;
    private device: GPUDevice | null = null;

    private canvas: HTMLCanvasElement | null = null;
    private context: GPUCanvasContext | null = null;

    private currentFrameCommandEncoder: GPUCommandEncoder | null = null;
    private currentFramePassEncoder: GPURenderPassEncoder | null = null;

    constructor() {}

    async init(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        try {
            const instance = navigator.gpu;
            if (!instance) {
                throw new Error("WebGPU is not supported");
            }

            this.adapter = await instance.requestAdapter();
            if (!this.adapter) {
                throw new Error("WebGPU no adapter found");
            }

            this.device = await this.adapter.requestDevice();
            if (!this.device) {
                throw new Error("WebGPU no device found");
            }

            const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

            this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
            const canvasConfig: GPUCanvasConfiguration = {
                device: this.device,
                format: presentationFormat,
                alphaMode: "premultiplied",
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
            };
            this.context.configure(canvasConfig);

            gWebGpuInstance = this;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    private getColorTextureView(): GPUTextureView {
        if (!this.context) {
            throw new Error("WebGPU context not initialized");
        }
        return this.context.getCurrentTexture().createView();
    }

    getDevice(): GPUDevice {
        if (!this.device) {
            throw new Error("WebGPU device not initialized");
        }
        return this.device;
    }

    beginFrame() {
        if (!this.device) {
            throw new Error("WebGPU device not initialized");
        }

        let colorAttachment: GPURenderPassColorAttachment = {
            view: this.getColorTextureView(),
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store",
        };

        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
        };

        this.currentFrameCommandEncoder = this.device.createCommandEncoder();

        this.currentFramePassEncoder = this.currentFrameCommandEncoder.beginRenderPass(renderPassDesc);
    }

    endFrame() {
        if (!this.device) {
            throw new Error("WebGPU device not initialized");
        }
        if (!this.currentFramePassEncoder || !this.currentFrameCommandEncoder) {
            throw new Error("WebGPU beginFrame() was not called");
        }

        this.currentFramePassEncoder.end();

        this.device.queue.submit([this.currentFrameCommandEncoder.finish()]);
    }

    getPassEncoder(): GPURenderPassEncoder {
        if (!this.currentFramePassEncoder) {
            throw new Error("WebGPU beginFrame() was not called");
        }
        return this.currentFramePassEncoder;
    }
}

export let gWebGpuInstance: WebGpuInstance | null = null;
