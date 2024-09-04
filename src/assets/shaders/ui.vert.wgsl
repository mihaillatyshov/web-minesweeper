struct VSIn {
    @location(0) pos: vec2f,
    @location(1) uv: vec2f,
};

struct VSOut {
    @builtin(position) Position: vec4f,
    @location(0) uv: vec2f,
};

struct Matrices {
    projection: mat4x4f,
};

@group(1) @binding(0) var<uniform> matrices: Matrices;

@vertex
fn main(attributes: VSIn, @builtin(instance_index) instanceIndex : u32, @builtin(vertex_index) vertexIndex : u32) -> VSOut {
    var vsOut: VSOut;
    
    var inPos = attributes.pos;
    vsOut.Position = matrices.projection * vec4f(inPos.x , inPos.y, 0, 1);
    vsOut.uv = attributes.uv;

    return vsOut;
}