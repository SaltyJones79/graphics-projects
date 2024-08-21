/*
Programmer: Jeremy Saltz
This program is from test one at is draws a circle with a radius of 0.6 and has
8 shapes around it. 
*/ 
var gl, program;
var modelViewStack = [];
var vertices = [];
var modelViewMatrix;

function main() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    generateCirclePoints();
    generateShapePoints();

    initBuffers();

    render();
}

function initBuffers() {
    // Configure WebGL
    gl.clearColor(0.9, 0.9, 1.0, 1.0);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Prepare to send the model view matrix to the vertex shader
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
}

// Form the 4x4 scale transformation matrix
function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}

function generateCirclePoints() {
    var radius = 0.6;
    var center = vec2(0, 0);
    SIZE = 100; // slices
    var angle = (2 * Math.PI) / SIZE;

    // Push points for the circle
    for (var i = 0; i < SIZE + 1; i++) {
        vertices.push([
            center[0] + radius * Math.cos(i * angle),
            center[1] + radius * Math.sin(i * angle)
        ]);
    }
}

function generateShapePoints() {
    // Define the shape points (5 vertices)
    vertices.push(vec2(0.2, 0));
    vertices.push(vec2(0, 0.35));
    vertices.push(vec2(-0.2, 0));
    vertices.push(vec2(0, -0.1));
    vertices.push(vec2(0.2, 0));
}

var scaleFactor = 3/4; // Initial scale factor
var rotationAngle = -90; // Initial rotation angle

function DrawOneShape() {
    // Apply translation only
    // Scale the shape by scaleFactor using scale4
    // Rotate the shape by rotationAngle
    // Draw the shape

    var s = scale4(scaleFactor, scaleFactor, 1);
    var r = rotate(rotationAngle, 0, 0, 1);

    modelViewMatrix = mult(modelViewMatrix, s);
    modelViewMatrix = mult(modelViewMatrix, r);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINE_STRIP, vertices.length - 5, 5);

    // Reset the modelViewMatrix to avoid affecting future shapes
    modelViewMatrix = mat4();
}

function render() {
    modelViewMatrix = mat4();
    gl.clear(gl.COLOR_BUFFER_BIT);

    var radius = 0.75;
    var rotationStep = (Math.PI * 2) / 8;

    // Draw the circle first
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINE_STRIP, 0, 101);

    // Draw the shape around the circle
    for (var i = 0; i < 8; i++) {
        var t = translate(radius * Math.cos(rotationStep * i), radius * Math.sin(rotationStep * i), 0);

        if (i === 0) {
            rotationAngle = -90; // Set initial rotation to -90 degrees for the first shape
        } else {
            rotationAngle = -90 + i * 45; // Set subsequent rotations based on the shape index
        }

        modelViewMatrix = mult(t, modelViewMatrix); // Apply translation
        DrawOneShape();
    }
}
