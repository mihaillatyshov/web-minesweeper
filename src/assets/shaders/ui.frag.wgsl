@group(0) @binding(0) var uSampler: sampler;
@group(0) @binding(1) var uFieldTextureAtlas: texture_2d<f32>;

@fragment
fn main(@location(0) inUV: vec2f) -> @location(0) vec4f {
    var color = textureSample(uFieldTextureAtlas, uSampler, inUV);
    if (color.a < 0.001) {
        discard;
    }
    return color;
}