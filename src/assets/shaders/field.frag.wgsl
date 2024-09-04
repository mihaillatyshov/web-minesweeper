@group(0) @binding(0) var uSampler: sampler;
@group(0) @binding(1) var uFieldTextureAtlas: texture_2d<f32>;

@fragment
fn main(@location(0) inUV: vec2f) -> @location(0) vec4f {
    return textureSample(uFieldTextureAtlas, uSampler, inUV);
}