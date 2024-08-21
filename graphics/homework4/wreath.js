/*
Programmer: Jeremy Saltz
This program draws a wreath from 12 stars. The star is started by a set
of vectors and then the points are scaled and rotated to make the star. After the star is 
created it is then scaled , rotated, and translated 12 times to make the wreath.  
*/
//global variables for the wreath 
var gl, program;
var modelViewStack = [];// var to hold the stack of making the star
var vertices;//to hold the vertices of the star branch vectors
var modelViewMatrix;//to hold the matrix as it is updated for scale, rotate, and translate
var modelViewMatrixLoc;//to store the matrix location

function main() {
    //get the webGL canvas
    var canvas = document.getElementById('gl-canvas');

    //create the webGL canvas
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGl isn't available"); }

    //get the vertices for the star branch
    vertices = generatePoints();

    //set up the buffers for vertex and fragment shaders
    initBuffers();

    //renders the wreath
    render();
}

//function for loading the shader buffers
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

// function to generate the points for the star branch
function generatePoints() {
    vertices = [];

    vertices.push(vec2(0, 2));
    vertices.push(vec2(0.1, 1));
    vertices.push(vec2(0.4, 1));
    vertices.push(vec2(0, 4));
    vertices.push(vec2(-1, -0.3));
    vertices.push(vec2(-0.5, -0.5));
    vertices.push(vec2(0, 2));

    // returns the points
    return vertices;
}

var scaleFactor = 1 / 4;//an intial scale factor
var rotationAngle = 0; // Initial rotation angle

// function to draw one branch of the star
function DrawOneBranch() {
    var s;//to save the scale factor 

    //push the matrix on to the stack
    modelViewStack.push(modelViewMatrix);
    //sets the scale matrix to mutiply by the modelViewMatrix
    s = scale4(scaleFactor, scaleFactor, 1);
    //scales the matrix
    modelViewMatrix = mult(modelViewMatrix, s);

    // Apply rotation
    var r = rotate(rotationAngle, 0, 0, 1);
    modelViewMatrix = mult(modelViewMatrix, r);

    //loads the matrix on to the buffer 
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINE_STRIP, 0, 7);//draws one branch of the star

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

//render function to draw the wreath
function render() {
    //clear the buffer
    gl.clear(gl.COLOR_BUFFER_BIT);

    //variables to calculate the rotation of the start and the translation of the stars
    var r, t;
    var radius = 0.7;//the radius of the wreath
    var rotationStep = (Math.PI * 2) / 12; // Divide 360 degrees into 12 parts

    modelViewMatrix = mat4();//create the matrix
    scaleFactor = 1 / 15;//scales the stars

    // loop for each star that is rotated and translated into the wreath
    for (var i = 0; i < 12; i++) {
        
        t = translate(radius * Math.cos(rotationStep * i), radius * Math.sin(rotationStep * i), 0);
        modelViewMatrix = t;
        r = rotate(25*i,0, 0, 1);
        modelViewMatrix=mult(t, r);

        DrawOneStar();
    }
}
