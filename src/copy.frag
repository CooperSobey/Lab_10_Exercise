#version 120 

uniform sampler2D toCopy;
uniform vec2 windowSizePixels;

void main() {
    // TODO (reprojection)
    vec2 fragCoordPos = vec2(gl_FragCoord.x, gl_FragCoord.y);
    gl_FragColor = texture2D(toCopy, fragCoordPos / windowSizePixels);
}
