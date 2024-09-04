export const createWebGpuBufferWithData = <TData extends Float32ArrayConstructor | Uint32ArrayConstructor>(
    device: GPUDevice,
    inData: number[][] | number[],
    dataType: TData,
    usage: GPUBufferUsageFlags
): GPUBuffer => {
    const data = new dataType(inData.flat());
    const bufferDescriptor: GPUBufferDescriptor = {
        size: data.byteLength,
        usage,
        mappedAtCreation: true,
    };
    const buffer = device.createBuffer(bufferDescriptor);
    new dataType(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
};

export const createWebGpuBufferDynamic = <TData extends Float32ArrayConstructor | Uint32ArrayConstructor>(
    device: GPUDevice,
    size: number,
    dataType: TData,
    usage: GPUBufferUsageFlags
): GPUBuffer => {
    const bufferDescriptor: GPUBufferDescriptor = {
        size: size * dataType.BYTES_PER_ELEMENT,
        usage: usage | GPUBufferUsage.COPY_DST,
    };
    const buffer = device.createBuffer(bufferDescriptor);
    return buffer;
};
