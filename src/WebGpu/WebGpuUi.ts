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
    uiTextMinesPos0,
    uiTextMinesPos1,
    uiTextMinesPos2,
    uiTextTimePos0,
    uiTextTimePos1,
    uiTextTimePos2,
    uiFacePos,
    uiScrollPointBot,
    uiScrollPointTop,
    uiScrollPointLeft,
    uiScrollPointRight,
    uiScrollYUvSize,
    uiScrollXUvSize,
    uiScrollBotUvPos,
    uiScrollTopUvPos,
    uiScrollRightUvPos,
    uiScrollLeftUvPos,
    uiFaceDefaultUvPos,
    uiFaceWinUvPos,
    uiFaceLoseUvPos,
    uiFacePressUvPos,
} from "Game/IUi";
import {
    BORDER_Y,
    BORDER_X,
    FACE_SIZE,
    INFO_Y,
    TEXT_Y,
    TEXT_SIZE,
    TEXT_SYM_Y,
    TEXT_SYM_OFF_X,
    TEXT_SYM_OFF_Y,
    TEXT_SYM_X,
    TEXT_X,
    SCROLL_POINT_Y,
    SCROLL_POINT_X,
    TEXTURE_SIZE,
    TEXT_PAD,
    TEXT_SYM_SIZE,
} from "Game/Constants";

import { createWebGpuBufferDynamic, createWebGpuBufferWithData } from "WebGpu/WebGpuBuffer";
import { createWebGpuTexture } from "WebGpu/WebGpuTexture";
import { createOrthographicMatrix } from "WebGpu/Matrices";
import { gWebGpuInstance } from "WebGpu/WebGpuInstance";

import { Vec2 } from "Types";
import { getTheme } from "Theme";

import vertShaderCode from "assets/shaders/ui.vert.wgsl";
import fragShaderCode from "assets/shaders/ui.frag.wgsl";

interface TDrawData {
    pipeline: GPURenderPipeline;
    staticPositionBuffer: GPUBuffer;
    staticTextureCoordBuffer: GPUBuffer;
    staticIndicesBuffer: GPUBuffer;
    dynamicPositionBuffer: GPUBuffer;
    dynamicTextureCoordBuffer: GPUBuffer;
    dynamicIndicesBuffer: GPUBuffer;
    uiTextureUniformBindGroupDark: GPUBindGroup;
    uiTextureUniformBindGroupLight: GPUBindGroup;
    uiMatricesUniformBindGroup: GPUBindGroup;
}

const getPos = (position: Vec2, size: Vec2) => {
    const x = position[0];
    const y = position[1];
    const width = size[0];
    const height = size[1];

    return [
        [x, y],
        [x + width, y],
        [x, y + height],
        [x + width, y + height],
    ];
};

const getUV = (position: Vec2, size: Vec2) => {
    const x = position[0] / TEXTURE_SIZE;
    const y = position[1] / TEXTURE_SIZE;
    const width = size[0] / TEXTURE_SIZE;
    const height = size[1] / TEXTURE_SIZE;

    return [
        [x, y + height],
        [x + width, y + height],
        [x, y],
        [x + width, y],
    ];
};

const genVBOs = (sprites: TUiSpriteData[]) => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    let index = 0;
    for (const sprite of sprites) {
        const pos = getPos(sprite.spritePos, sprite.spriteSize);
        const uv = getUV(sprite.atlasPos, sprite.atlasSize);

        positions.push(...pos.flat());
        uvs.push(...uv.flat());

        indices.push(index, index + 1, index + 2, index + 1, index + 2, index + 3);
        index += 4;
    }

    return { positions, uvs, indices };
};

export class WebGpuUi extends GameUi implements IUi {
    private device: GPUDevice | null = null;

    private drawData: TDrawData | null = null;

    private staticIndicesCount = 0;
    private dynamicIndicesCount = 0;

    async init(width: number, height: number) {
        if (!gWebGpuInstance) {
            throw new Error("WebGpuInstance is not initialized");
        }

        this.baseInit(width, height);

        this.device = gWebGpuInstance.getDevice();

        // prettier-ignore
        const { positions: staticPositions, uvs: staticUVs, indices: staticIndices } = genVBOs([
            uiFrameBorderBotLeft(width, height),
            uiFrameBorderBotRight(width, height),
            uiFrameBorderTopLeft(width, height),
            uiFrameBorderTopRight(width, height),
            uiFrameBorderBot(width, height),
            uiFrameBorderTop(width, height),
            uiFrameCenter(width, height),
            uiFrameBorderLeft(width, height),
            uiFrameBorderRight(width, height),
            uiFrameBorderCenterLeft(width, height),
            uiFrameBorderCenterRight(width, height),
            uiFrameBorderCenter(width, height),
            uiFrameInfoLeft(width, height),
            uiFrameInfoRight(width, height),
        ]);

        const staticPositionBuffer = createWebGpuBufferWithData(
            this.device,
            staticPositions,
            Float32Array,
            GPUBufferUsage.VERTEX
        );

        const staticTextureCoordBuffer = createWebGpuBufferWithData(
            this.device,
            staticUVs,
            Float32Array,
            GPUBufferUsage.VERTEX
        );

        const staticIndicesBuffer = createWebGpuBufferWithData(
            this.device,
            staticIndices,
            Uint32Array,
            GPUBufferUsage.INDEX
        );

        this.staticIndicesCount = staticIndices.length;

        const faceOffsetY = height - BORDER_Y - INFO_Y / 2 - FACE_SIZE / 2;

        // prettier-ignore
        const { positions: dynamicPositions, uvs: dynamicUVs, indices: dynamicIndices, } = genVBOs([
            createUiSpriteData(uiTextMinesPos0(width, height), TEXT_SYM_SIZE         , [0, 0], [0,0]),
            createUiSpriteData(uiTextMinesPos1(width, height), TEXT_SYM_SIZE         , [0, 0], [0,0]),
            createUiSpriteData(uiTextMinesPos2(width, height), TEXT_SYM_SIZE         , [0, 0], [0,0]),
            createUiSpriteData(uiTextTimePos0 (width, height), TEXT_SYM_SIZE         , [0, 0], [0,0]),
            createUiSpriteData(uiTextTimePos1 (width, height), TEXT_SYM_SIZE         , [0, 0], [0,0]),
            createUiSpriteData(uiTextTimePos2 (width, height), TEXT_SYM_SIZE         , [0, 0], [0,0]),
            createUiSpriteData(uiFacePos      (width, height), [FACE_SIZE, FACE_SIZE], [0, 0], [0,0]),
            uiScrollPointBot(width, height),
            uiScrollPointTop(width, height),
            uiScrollPointLeft(width, height),
            uiScrollPointRight(width, height),
        ]);

        const dynamicPositionBuffer = createWebGpuBufferWithData(
            this.device,
            dynamicPositions,
            Float32Array,
            GPUBufferUsage.VERTEX
        );

        const dynamicTextureCoordBuffer = createWebGpuBufferDynamic(
            this.device,
            dynamicUVs.length * Float32Array.BYTES_PER_ELEMENT,
            Float32Array,
            GPUBufferUsage.VERTEX
        );

        const dynamicIndicesBuffer = createWebGpuBufferWithData(
            this.device,
            dynamicIndices,
            Uint32Array,
            GPUBufferUsage.INDEX
        );

        this.dynamicIndicesCount = dynamicIndices.length;

        const vsmDesc = { code: vertShaderCode };
        const vertModule = this.device.createShaderModule(vsmDesc);

        const fsmDesc = { code: fragShaderCode };
        const fragModule = this.device.createShaderModule(fsmDesc);

        const positionAttribDesc: GPUVertexAttribute = {
            shaderLocation: 0,
            offset: 0,
            format: "float32x2",
        };
        const positionBufferDesc: GPUVertexBufferLayout = {
            attributes: [positionAttribDesc],
            arrayStride: 4 * 2, // sizeof(float) * 2
            stepMode: "vertex",
        };

        const textureCoordAttribDesc: GPUVertexAttribute = {
            shaderLocation: 1,
            offset: 0,
            format: "float32x2",
        };
        const textureCoordBufferDesc: GPUVertexBufferLayout = {
            attributes: [textureCoordAttribDesc],
            arrayStride: 4 * 2, // sizeof(float) * 2
            stepMode: "vertex",
        };

        const uiTextureBindGroupLayout: GPUBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
            ],
        });

        const uiMatricesBindGroupLayout: GPUBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} }],
        });

        const pipelineLayoutDesc: GPUPipelineLayoutDescriptor = {
            bindGroupLayouts: [uiTextureBindGroupLayout, uiMatricesBindGroupLayout],
        };
        const pipelineLayout = this.device.createPipelineLayout(pipelineLayoutDesc);

        const vertex: GPUVertexState = {
            module: vertModule,
            entryPoint: "main",
            buffers: [positionBufferDesc, textureCoordBufferDesc],
        };

        const presentationFormat: GPUColorTargetState = {
            format: "bgra8unorm",
            blend: {
                color: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
                alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
            },
        };
        const fragment: GPUFragmentState = {
            module: fragModule,
            entryPoint: "main",
            targets: [presentationFormat],
        };

        const pipelineDesc: GPURenderPipelineDescriptor = {
            label: "ui-pipeline",
            layout: pipelineLayout,

            vertex,
            fragment,

            // primitive,
        };
        const pipeline = this.device.createRenderPipeline(pipelineDesc);

        const sampler = this.device.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
            mipmapFilter: "nearest",
        });

        const uiTextureDark = await createWebGpuTexture(this.device, "./assets/textures/field_atlas_dark.png");
        const uiTextureUniformBindGroupDark = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: uiTextureDark.createView() },
            ],
        });

        const uiTextureLight = await createWebGpuTexture(this.device, "./assets/textures/field_atlas_light.png");
        const uiTextureUniformBindGroupLight = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: uiTextureLight.createView() },
            ],
        });

        const uiMatricesBuffer = createWebGpuBufferDynamic(this.device, 4 * 4, Float32Array, GPUBufferUsage.UNIFORM);
        this.device.queue.writeBuffer(uiMatricesBuffer, 0, createOrthographicMatrix(0, width, 0, height, -1, 1));

        const uiMatricesUniformBindGroup = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(1),
            entries: [{ binding: 0, resource: { buffer: uiMatricesBuffer } }],
        });

        this.drawData = {
            pipeline,
            staticPositionBuffer,
            staticIndicesBuffer,
            staticTextureCoordBuffer,
            dynamicPositionBuffer,
            dynamicIndicesBuffer,
            dynamicTextureCoordBuffer,
            uiMatricesUniformBindGroup,
            uiTextureUniformBindGroupDark,
            uiTextureUniformBindGroupLight,
        };
    }

    update(gameLogic: GameLogic, fieldCameraState: TFieldCameraState, gameWindow: GameWindow) {
        if (!this.device) {
            throw new Error("WebGpuUi is not initialized");
        }
        if (!this.drawData) {
            throw new Error("WebGpuUi drawData in not created!");
        }

        const closedMines = Math.min(gameLogic.getClosedAndNotMarkedMinesCount(), 999);

        const dynamicTextureCoordBufferData = new Float32Array(11 * 4 * 2);

        const minesSlice = [Math.floor(closedMines / 100) % 10, Math.floor(closedMines / 10) % 10, closedMines % 10];
        for (let i = 0; i < 3; i++) {
            const text = TEXT_ARRAY[minesSlice[i]];
            dynamicTextureCoordBufferData.set(getUV(text, TEXT_SIZE).flat(), i * 4 * 2);
        }

        const seconds = Math.min(gameLogic.getSecondsFromStart(), 999);
        const secondsSlice = [Math.floor(seconds / 100) % 10, Math.floor(seconds / 10) % 10, seconds % 10];
        for (let i = 3; i < 6; i++) {
            const text = TEXT_ARRAY[secondsSlice[i - 3]];
            dynamicTextureCoordBufferData.set(getUV(text, TEXT_SIZE).flat(), i * 4 * 2);
        }

        if (this.isMouseInsideFace(gameWindow) && this.mouseOnFaceDown) {
            dynamicTextureCoordBufferData.set(getUV(uiFacePressUvPos, [FACE_SIZE, FACE_SIZE]).flat(), 6 * 4 * 2);
        } else if (gameLogic.isGameOver()) {
            dynamicTextureCoordBufferData.set(getUV(uiFaceLoseUvPos, [FACE_SIZE, FACE_SIZE]).flat(), 6 * 4 * 2);
        } else if (gameLogic.isGameWin()) {
            dynamicTextureCoordBufferData.set(getUV(uiFaceWinUvPos, [FACE_SIZE, FACE_SIZE]).flat(), 6 * 4 * 2);
        } else {
            dynamicTextureCoordBufferData.set(getUV(uiFaceDefaultUvPos, [FACE_SIZE, FACE_SIZE]).flat(), 6 * 4 * 2);
        }

        // console.log(fieldCameraState);
        dynamicTextureCoordBufferData.set(
            !fieldCameraState.isOnBottom
                ? getUV(uiScrollBotUvPos, uiScrollYUvSize).flat()
                : getUV([500, 500], [1, 1]).flat(),
            7 * 4 * 2
        );
        dynamicTextureCoordBufferData.set(
            !fieldCameraState.isOnTop
                ? getUV(uiScrollTopUvPos, uiScrollYUvSize).flat()
                : getUV([500, 500], [1, 1]).flat(),
            8 * 4 * 2
        );
        dynamicTextureCoordBufferData.set(
            !fieldCameraState.isOnLeft
                ? getUV(uiScrollLeftUvPos, uiScrollXUvSize).flat()
                : getUV([500, 500], [1, 1]).flat(),
            9 * 4 * 2
        );
        dynamicTextureCoordBufferData.set(
            !fieldCameraState.isOnRight
                ? getUV(uiScrollRightUvPos, uiScrollXUvSize).flat()
                : getUV([500, 500], [1, 1]).flat(),
            10 * 4 * 2
        );

        this.device.queue.writeBuffer(this.drawData.dynamicTextureCoordBuffer, 0, dynamicTextureCoordBufferData);
    }

    draw() {
        if (!gWebGpuInstance) {
            throw new Error("WebGpuInstance is not initialized");
        }
        if (!this.drawData) {
            throw new Error("WebGpuField drawData in not created!");
        }

        const passEncoder = gWebGpuInstance?.getPassEncoder();

        passEncoder.setPipeline(this.drawData.pipeline);
        passEncoder.setViewport(0, 0, this.windowWidth, this.windowHeight, 0, 1);
        passEncoder.setScissorRect(0, 0, this.windowWidth, this.windowHeight);

        if (getTheme() === "dark") {
            passEncoder.setBindGroup(0, this.drawData.uiTextureUniformBindGroupDark);
        } else {
            passEncoder.setBindGroup(0, this.drawData.uiTextureUniformBindGroupLight);
        }
        passEncoder.setBindGroup(1, this.drawData.uiMatricesUniformBindGroup);

        passEncoder.setVertexBuffer(0, this.drawData.staticPositionBuffer);
        passEncoder.setVertexBuffer(1, this.drawData.staticTextureCoordBuffer);
        passEncoder.setIndexBuffer(this.drawData.staticIndicesBuffer, "uint32");

        passEncoder.drawIndexed(this.staticIndicesCount, 1, 0, 0, 0);

        passEncoder.setVertexBuffer(0, this.drawData.dynamicPositionBuffer);
        passEncoder.setVertexBuffer(1, this.drawData.dynamicTextureCoordBuffer);
        passEncoder.setIndexBuffer(this.drawData.dynamicIndicesBuffer, "uint32");

        passEncoder.drawIndexed(this.dynamicIndicesCount, 1, 0, 0, 0);
    }
}
