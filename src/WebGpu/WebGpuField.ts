import { GameWindow } from "GameWidnow";

import { GameLogic } from "Game/GameLogic";
import { IField, GameField } from "Game/IField";
import { CAMERA_OFFSET_X, CAMERA_OFFSET_Y, FIELD_CELL_SIZE } from "Game/Constants";

import { createWebGpuBufferDynamic, createWebGpuBufferWithData } from "WebGpu/WebGpuBuffer";
import { createOrthographicMatrix, createTranslationMatrix, Float32ArrayConcat } from "WebGpu/Matrices";
import { createWebGpuTexture } from "WebGpu/WebGpuTexture";
import { gWebGpuInstance } from "WebGpu/WebGpuInstance";

import { getTheme } from "Theme";

import vertShaderCode from "assets/shaders/field.vert.wgsl";
import fragShaderCode from "assets/shaders/field.frag.wgsl";

interface TDrawData {
    pipeline: GPURenderPipeline;
    positionBuffer: GPUBuffer;
    indicesBuffer: GPUBuffer;
    textureIdBuffer: GPUBuffer;
    offsetBuffer: GPUBuffer;
    fieldMatricesBuffer: GPUBuffer;
    fieldTextureUniformBindGroupDark: GPUBindGroup;
    fieldTextureUniformBindGroupLight: GPUBindGroup;
    fieldMatricesUniformBindGroup: GPUBindGroup;
    drawValues: GPUBuffer;
}

export class WebGpuField extends GameField implements IField {
    private device: GPUDevice | null = null;

    private drawData: TDrawData | null = null;

    async init(width: number, height: number) {
        if (!gWebGpuInstance) {
            throw new Error("WebGpuInstance is not initialized");
        }

        this.baseInit(width, height);

        this.device = gWebGpuInstance.getDevice();

        // prettier-ignore
        const positionBuffer = createWebGpuBufferWithData(
            this.device,
            [
                [0              , 0              ],
                [FIELD_CELL_SIZE, 0              ],
                [0              , FIELD_CELL_SIZE],
                [FIELD_CELL_SIZE, FIELD_CELL_SIZE],
            ],
            Float32Array,
            GPUBufferUsage.VERTEX
        );

        const indicesBuffer = createWebGpuBufferWithData(
            this.device,
            [
                [0, 1, 2],
                [1, 2, 3],
            ],
            Uint32Array,
            GPUBufferUsage.INDEX
        );
        const { maxDrawColCount, maxDrawRowCount } = this.getMaxFieldRowAndColCount(
            this.windowWidth,
            this.windowHeight
        );

        const textureIdBuffer = createWebGpuBufferDynamic(
            this.device,
            maxDrawColCount * maxDrawRowCount * 4,
            Uint32Array,
            GPUBufferUsage.VERTEX
        );

        const offsetBuffer = createWebGpuBufferDynamic(
            this.device,
            maxDrawColCount * maxDrawRowCount * 2,
            Float32Array,
            GPUBufferUsage.VERTEX
        );

        const drawIndexedIndirectParameters = new Uint32Array(5);
        drawIndexedIndirectParameters[0] = 6;
        drawIndexedIndirectParameters[1] = maxDrawRowCount * maxDrawColCount;
        drawIndexedIndirectParameters[2] = 0;
        drawIndexedIndirectParameters[3] = 0;
        drawIndexedIndirectParameters[4] = 0;

        const drawValues = this.device.createBuffer({
            size: 20,
            usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(
            drawValues,
            0,
            drawIndexedIndirectParameters,
            0,
            drawIndexedIndirectParameters.length
        );

        const fieldAtlasTile = (x: number, y: number): string => {
            return `vec2f(${x * 0.125}, ${y * 0.125 + 0.125}), 
                vec2f(${x * 0.125 + 0.125}, ${y * 0.125 + 0.125}), 
                vec2f(${x * 0.125}, ${y * 0.125}), 
                vec2f(${x * 0.125 + 0.125}, ${y * 0.125})`;
        };

        const fieldAtlasTiles = [
            fieldAtlasTile(0, 0),
            fieldAtlasTile(1, 0),
            fieldAtlasTile(2, 0),
            fieldAtlasTile(3, 0),
            fieldAtlasTile(4, 0),
            fieldAtlasTile(5, 0),
            fieldAtlasTile(6, 0),
            fieldAtlasTile(7, 0),
            fieldAtlasTile(0, 1),
            fieldAtlasTile(1, 1),
            fieldAtlasTile(2, 1),
            fieldAtlasTile(3, 1),
            fieldAtlasTile(4, 1),
            fieldAtlasTile(5, 1),
            fieldAtlasTile(6, 1),
            fieldAtlasTile(7, 1),
            fieldAtlasTile(0, 2),
            fieldAtlasTile(1, 2),
            fieldAtlasTile(2, 2),
            fieldAtlasTile(3, 2),
            fieldAtlasTile(4, 2),
            fieldAtlasTile(5, 2),
            fieldAtlasTile(6, 2),
        ];

        const vertShaderCodeStr = vertShaderCode
            .replace("{{UV_COUNT}}", `${fieldAtlasTiles.length * 4}`)
            .replace("{{UV}}", fieldAtlasTiles.join(",\n"));

        const vsmDesc = { code: vertShaderCodeStr };
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

        const textureIdAttribDesc: GPUVertexAttribute = {
            shaderLocation: 1,
            offset: 0,
            format: "uint32",
        };
        const textureIdBufferDesc: GPUVertexBufferLayout = {
            attributes: [textureIdAttribDesc],
            arrayStride: 4 * 1, // sizeof(int) * 1
            stepMode: "instance",
        };

        const offsetAttribDesc: GPUVertexAttribute = {
            shaderLocation: 2,
            offset: 0,
            format: "float32x2",
        };
        const offsetBufferDesc: GPUVertexBufferLayout = {
            attributes: [offsetAttribDesc],
            arrayStride: 4 * 2, // sizeof(float) * 2
            stepMode: "instance",
        };

        const fieldTextureBindGroupLayout: GPUBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
            ],
        });

        const fieldMatricesBindGroupLayout: GPUBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} }],
        });

        const pipelineLayoutDesc: GPUPipelineLayoutDescriptor = {
            bindGroupLayouts: [fieldTextureBindGroupLayout, fieldMatricesBindGroupLayout],
        };
        const pipelineLayout = this.device.createPipelineLayout(pipelineLayoutDesc);

        const vertex: GPUVertexState = {
            module: vertModule,
            entryPoint: "main",
            buffers: [positionBufferDesc, textureIdBufferDesc, offsetBufferDesc],
        };

        const presentationFormat: GPUColorTargetState = { format: "bgra8unorm" };
        const fragment: GPUFragmentState = {
            module: fragModule,
            entryPoint: "main",
            targets: [presentationFormat],
        };

        const pipelineDesc: GPURenderPipelineDescriptor = {
            label: "field-pipeline",
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

        const fieldTextureDark = await createWebGpuTexture(this.device, "assets/textures/field_atlas_dark.png");
        const fieldTextureUniformBindGroupDark = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: fieldTextureDark.createView() },
            ],
        });

        const fieldTextureLight = await createWebGpuTexture(this.device, "assets/textures/field_atlas_light.png");
        const fieldTextureUniformBindGroupLight = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: fieldTextureLight.createView() },
            ],
        });

        const fieldMatricesBuffer = createWebGpuBufferDynamic(
            this.device,
            4 * 4 * 2,
            Float32Array,
            GPUBufferUsage.UNIFORM
        );

        const fieldMatricesUniformBindGroup = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(1),
            entries: [{ binding: 0, resource: { buffer: fieldMatricesBuffer } }],
        });

        this.drawData = {
            pipeline,
            positionBuffer,
            indicesBuffer,
            offsetBuffer,
            fieldMatricesBuffer,
            textureIdBuffer,
            fieldMatricesUniformBindGroup,
            fieldTextureUniformBindGroupDark,
            fieldTextureUniformBindGroupLight,
            drawValues,
        };
    }

    update(gameLogic: GameLogic, gameWindow: GameWindow) {
        if (!this.device) {
            throw new Error("WebGpuField is not initialized");
        }
        if (!this.drawData) {
            throw new Error("WebGpuField drawData in not created!");
        }

        const { maxDrawColCount, maxDrawRowCount } = this.getMaxFieldRowAndColCount(
            this.windowWidth,
            this.windowHeight
        );

        const offsetBufferData = new Float32Array(maxDrawColCount * maxDrawRowCount * 2);

        for (let i = 0; i < maxDrawRowCount * maxDrawColCount; i++) {
            const row = Math.floor(i / maxDrawColCount);
            const col = i % maxDrawColCount;
            offsetBufferData[i * 2 + 0] = col * FIELD_CELL_SIZE;
            offsetBufferData[i * 2 + 1] = row * FIELD_CELL_SIZE;
        }

        const { col: hoveredCellCol, row: hoveredCellRow } = this.getHoveredCell(gameWindow);

        const isMouseInside = this.isMouseInside(gameWindow);
        const isLeftMouseButtonPressed = gameWindow.isMouseButtonPressed(0);
        const isHoveredCellOpened =
            gameLogic.isCellExists(hoveredCellCol, hoveredCellRow) &&
            gameLogic.isCellOpened(hoveredCellCol, hoveredCellRow);

        const textureIdBufferData = new Uint32Array(maxDrawRowCount * maxDrawColCount);
        const textureIdBufferColOffset = Math.ceil(this.cameraPosition.x / FIELD_CELL_SIZE);
        const textureIdBufferRowOffset = Math.ceil(this.cameraPosition.y / FIELD_CELL_SIZE);
        for (let i = 0; i < maxDrawRowCount * maxDrawColCount; i++) {
            const row = Math.floor(i / maxDrawColCount) - textureIdBufferRowOffset;
            const col = (i % maxDrawColCount) - textureIdBufferColOffset;

            const isPressed =
                gameLogic.isGamePlaying() &&
                isMouseInside &&
                isLeftMouseButtonPressed &&
                ((hoveredCellCol === col && hoveredCellRow === row) ||
                    (isHoveredCellOpened &&
                        Math.abs(hoveredCellCol - col) <= 1 &&
                        Math.abs(hoveredCellRow - row) <= 1));
            textureIdBufferData[i] = this.getFieldTextureId(gameLogic, col, row, isPressed);
        }

        this.device.queue.writeBuffer(this.drawData.textureIdBuffer, 0, textureIdBufferData);
        this.device.queue.writeBuffer(this.drawData.offsetBuffer, 0, offsetBufferData);

        this.device.queue.writeBuffer(
            this.drawData.fieldMatricesBuffer,
            0,
            Float32ArrayConcat(
                createOrthographicMatrix(0, this.windowWidth, 0, this.windowHeight, -1, 1),
                createTranslationMatrix(
                    CAMERA_OFFSET_X + (this.cameraPosition.x % FIELD_CELL_SIZE),
                    CAMERA_OFFSET_Y + (this.cameraPosition.y % FIELD_CELL_SIZE),
                    0
                )
            )
        );
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
            passEncoder.setBindGroup(0, this.drawData.fieldTextureUniformBindGroupDark);
        } else {
            passEncoder.setBindGroup(0, this.drawData.fieldTextureUniformBindGroupLight);
        }
        passEncoder.setBindGroup(1, this.drawData.fieldMatricesUniformBindGroup);

        passEncoder.setVertexBuffer(0, this.drawData.positionBuffer);
        passEncoder.setVertexBuffer(1, this.drawData.textureIdBuffer);
        passEncoder.setVertexBuffer(2, this.drawData.offsetBuffer);
        passEncoder.setIndexBuffer(this.drawData.indicesBuffer, "uint32");

        passEncoder.drawIndexedIndirect(this.drawData.drawValues, 0);
    }
}
