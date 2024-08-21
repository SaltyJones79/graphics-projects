/*
Programmer: Jeremy Saltz
This program has a star traving from the point (-0.75,-0.75) to the point (0, 0.75)
and then down to the point (0.75, -0.75) 
*/
// the global variables
var gl, program;//for webGL
var modelViewStack = [];//to store the stack
var vertices;//to store the vertices
var modelViewMatrix;//to store the model view matrix
var modelViewMatrixLoc;//to store the model view location
var TOTAL_STEPS = 200;//the total number of steps in the program
var HALF_STEPS = TOTAL_STEPS/2;//the total number of for each pathway
var scaleFactor = 1 / 10;//the scale factor
var stepCount = 0;//to store the number of steps
var startX = -0.75, startY = -0.75; // Initial location
var targetX1 = 0, targetY1 = 0.75;  // First target location
var targetX2 = 0.75, targetY2 = -0.75;  // Second target location
var locationX = startX, locationY = startY;  // Current location of the star


function main() {
    //set webGL cavas
    var canvas = document.getElementById('gl-canvas');

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGl isn't available"); }

    //to generate points
    vertices = generatePoints();

    //to load the webGL buffers
    initBuffers();

    //render the animation
    render();
}

//function for loading the buffers
function initBuffers() {
    // Configure WebGL
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

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

// the points to start the first branch of the star
function generatePoints() {
    vertices = [];

    vertices.push(vec2(0, 2));
    vertices.push(vec2(0.1, 1));
    vertices.push(vec2(0.4, 1));
    vertices.push(vec2(0, 4));
    vertices.push(vec2(-1, -0.3));
    vertices.push(vec2(-0.5, -0.5));
    vertices.push(vec2(0, 2));

    return vertices;
}

var rotationAngle = 0; // Initial rotation angle

//fucntion to draw one branch of the star
function DrawOneBranch() {
    var s;

    //push the matrix on to the stack
    modelViewStack.push(modelViewMatrix);
    //sets the scale matrix to mutiply by the modelViewMatri
    s = scale4(scaleFactor, scaleFactor, 1);
    //scales the matrix
    modelViewMatrix = mult(modelViewMatrix, s);

    // Apply rotation
    var r = rotate(rotationAngle, 0, 0, 1);
    modelViewMatrix = mult(modelViewMatrix, r);

    //loads the matrix on to the buffer 
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINE_STRIP, 0, 7);

    modelViewMatrix = modelViewStack.pop();// pops the matrix from the top of the stack
}

//function to draw one star
function DrawOneStar() {
      
    //loop to draw the star by rotating each branch by 360/5 degrees or 72 degrees
    for(var i=0; i<5; i++){
        // draws one branch
        DrawOneBranch();

        // pushes matrix onto the stack
        modelViewStack.push(modelViewMatrix);

        //calculates the rotation for each branch
        r = rotate(72*i, 0, 0, 1);
        modelViewMatrix = mult(modelViewMatrix, r);

        DrawOneBranch();//draws the new branch

        //pops off the stack
        modelViewMatrix = modelViewStack.pop();
    }
}

// a setinterval function to animate the star and travel the two paths
setInterval(function render() {
    // Clear the color buffer of the WebGL canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Declare variables used in animation
    var t;// Transformation matrix
    var deltaX1 = (targetX1 - startX) / HALF_STEPS; // Change in X position for the first half of animation
    var deltaY1 = (targetY1 - startY) / HALF_STEPS; // Change in Y position for the first half of animation
    var deltaX2 = (targetX2 - targetX1) / HALF_STEPS; // Change in X position for the second half of animation
    var deltaY2 = (targetY2 - targetY1) / HALF_STEPS; // Change in Y position for the second half of animation
    modelViewMatrix = mat4(); // Initialize a 4x4 model-view matrix.

    // Check if the animation is still in progress (stepCount < TOTAL_STEPS)
    if (stepCount < TOTAL_STEPS) {
        t = translate(locationX, locationY, 0);
        modelViewMatrix = t;
        DrawOneStar();

        // Check if the animation is in the first half (stepCount < HALF_STEPS).
        if (stepCount < HALF_STEPS) {
            locationX = locationX + deltaX1;
            locationY = locationY + deltaY1;
        } else {
            locationX = locationX + deltaX2;
            locationY = locationY + deltaY2;
        }

        stepCount++;
    } else {
        // Reset the animation when it's completed (stepCount reaches TOTAL_STEPS).
        stepCount = 0;
        locationX = startX;
        locationY = startY;
    }

}, 100);// Execute this function every 100 milliseconds.
    