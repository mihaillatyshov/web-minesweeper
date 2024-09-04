struct VSIn {
    @location(0) pos: vec2f,
    @location(1) tid: u32,
    @location(2) offset: vec2f,
};

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

const tid = array<vec2f, {{UV_COUNT}}>(
    {{UV}}
);

struct Matrices {
    projection: mat4x4f,
    model: mat4x4f,
};

@group(1) @binding(0) var<uniform> matrices: Matrices;

@vertex
fn main(attributes: VSIn, @builtin(instance_index) instanceIndex : u32, @builtin(vertex_index) vertexIndex : u32) -> VSOut {
    var vsOut: VSOut;

    var inPos = attributes.pos + attributes.offset;
    vsOut.position = matrices.projection * matrices.model * vec4f(inPos.x , inPos.y, 0, 1);
    vsOut.uv = tid[attributes.tid * 4 + vertexIndex];
    
    return vsOut;
}