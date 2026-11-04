#version 120 

// (way more precision than a float can actually store...)
#define LOG_2 0.6931471805599453094172321214581765680755001

// start using these antialiasing values once you start (c)
#define AA 2
#define TRUE_MAX_ITERS 16384
const int TOTAL_SAMPLES = AA * AA;
#define ESCAPE_RADIUS 4

uniform vec2 c;
uniform int MAX_ITERS;
uniform vec2 windowSizePixels;
uniform vec2 camCenterWorld;
uniform float camWorldUnitsPerPixel;
uniform vec2 prevCamCenterWorld;
uniform float prevCamWorldUnitsPerPixel;
uniform sampler2D prevFrame;
uniform bool cChanged;


// reprojection (1d) may require extra uniforms here...

// Use this to get a color from your smoothed Julia set escape times.
vec4 colorTime(float t) {
    return vec4(0.5 + 0.5 * cos(  0.1 * (t) + vec3(0.f, 0.35, 0.7)), 1.f);
}

struct EscapeTime {
    float iters;
    bool isInf;
};

// Escape time of iterating z^2 + c
EscapeTime escapeTimeSmooth(vec2 z) {
    // TODO
    for (int i = 0; i < MAX_ITERS; i++) {
        bool escape = length(z) > ESCAPE_RADIUS;
        z = vec2((z.x * z.x) - (z.y * z.y), 2 * z.x * z.y) + c;

        if(escape){
            //Smoothing formula
            return EscapeTime(float(i + 2) - (log(log(length(z)))) / LOG_2, false);
        }
    }

    return EscapeTime(0, true);
}


vec2 windowToWorld(vec2 windowCoords) {
    // TODO
    return camCenterWorld + (windowCoords - 0.5 * windowSizePixels) * camWorldUnitsPerPixel;
}

// For reprojection
vec2 worldToOldWindow(vec2 worldCoords) {
    // TODO
    return ((worldCoords - prevCamCenterWorld) / prevCamWorldUnitsPerPixel + 0.5 * windowSizePixels);
}

// For SSAA
// Given (dx, dy) in [0, AA)^2, suppose the unit square [0, 1)^2 was cut up into AA equal
// partitions along each dimension. delta((dx, dy)) returns the center of the sub-square
// which is in the dy'th row and dx'th column (both 0-indexed).
vec2 delta(vec2 dxy) {
    // TODO
    return ((dxy + 0.5) / AA);
}


void main() {
    // TODO
    // gl_FragColor = ... some vec4 rgba colour
    vec2 fragCoords = vec2(gl_FragCoord.x, gl_FragCoord.y);
    vec2 topLeft = floor(fragCoords);
    vec4 fragColour = vec4(0,0,0,0);

    for (int i = 0; i < AA; i++){
        for (int j = 0; j < AA; j++){
            vec2 fragSamplePosition = topLeft + delta(vec2(i, j));
            EscapeTime smoothedTime = escapeTimeSmooth(windowToWorld(fragSamplePosition));
            vec4 newColour;

            if(smoothedTime.isInf) {
                newColour = vec4(0,0,0,1);
            } else {
                newColour = colorTime(smoothedTime.iters);
            }

            vec2 prevPos = worldToOldWindow(windowToWorld(fragSamplePosition));
            if (cChanged && prevPos.x >= 0 && prevPos.x < windowSizePixels.x && prevPos.y >= 0 && prevPos.y < windowSizePixels.y){
                float count;
                if (smoothedTime.isInf){
                    count = MAX_ITERS;
                }else{
                    count = smoothedTime.iters;
                }
                float alpha = clamp(count / TRUE_MAX_ITERS, 0.05, 1.0);
                vec4 prevColour = texture2D(prevFrame, prevPos / windowSizePixels);
                newColour = mix(prevColour, newColour, alpha);
            }
            fragColour += newColour;
        }


    }
    gl_FragColor = fragColour / TOTAL_SAMPLES;

}
