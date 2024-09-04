export const createWebGpuTexture = async (device: GPUDevice, filename: string): Promise<GPUTexture> => {
    const response = await fetch(filename);
    const imageBitmap = await createImageBitmap(await response.blob());

    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, [
        imageBitmap.width,
        imageBitmap.height,
    ]);

    return texture;
};
