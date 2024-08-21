/*
Programmer: Jeremy Saltz
The program draws a planet with 4 different color rings and puts it into the
sky on a sky set to the golden ratio. First the rings in the back are scaled and 
rotated to create depth behind the filled-in circle that is scaled to fit the 
ratio. Then the rings in the front are mirrored to the back rings. After the 
panet is completed it is then scaled and translated to the top left of the sky. 
*/
var modelViewMatrix;
var modelViewMatrixLoc;
var projectionMatrix;
var projectionMatrixLoc;
var modelViewStack=[];

var points=[];
var colors=[];

var ringColors = [
    vec4(1.0, 0.0, 0.0, 1.0),  // Red
    vec4(0.0, 1.0, 0.0, 1.0),  // Green
    vec4(0.0, 0.0, 1.0, 1.0),  // Blue
    vec4(1.0, 0.0, 1.0, 1.0)   // Pink
];

var cmtStack=[];

var Ratio=1.618;   // ratio used for canvas and for world window

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Generate the points for the 3 components of the planet
    GenerateBackCircles();
    GenerateCircle();
    GenerateFrontCircles();

    modelViewMatrix = mat4();
    projectionMatrix = ortho(-8, 8, -8, 8, -1, 1);
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.2, 0.2, 0.5, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc= gl.getUniformLocation(program, "projectionMatrix");

    render();
}

function scale4(a, b, c) {
   	var result = mat4();
   	result[0][0] = a;
   	result[1][1] = b;
   	result[2][2] = c;
   	return result;
}

function GenerateBackCircles(){
    var radii = [0.6, 0.7, 0.8, 0.9];
    var center = vec2(0, 0);
    var SIZE = 50; // slices for half circle
    var angle = Math.PI / SIZE;//set the angle

    for (var r = 0; r < radii.length; r++) {
        for (var i = 0; i < SIZE + 1; i++) {
            points.push([
                center[0] + radii[r] * Math.cos(i * angle),
                center[1] + radii[r] * Math.sin(i * angle)
            ]);
            //parallel to the half ring points
            colors.push(ringColors[r]);//colors the rings 
        }
    }
}

function GenerateCircle(){
    var radius = 0.5; // Adjust as per the requirement
    var center = vec2(0, 0);
    var SIZE = 100; // slices for full circle
    var angle = (2 * Math.PI) / SIZE;

    // Push points for the planet circle
    for (var i = 0; i < SIZE + 1; i++) {
        points.push([
            center[0] + radius * Math.cos(i * angle),
            center[1] + radius * Math.sin(i * angle)
        ]);

        colors.push([1, 1, 0, 1.0]); // Color for planet, adjust as required
    }
}

function GenerateFrontCircles(){
    // Essentially a mirror of GenerateBackCircles
    var radii = [0.6, 0.7, 0.8, 0.9];
    var center = vec2(0, 0);
    var SIZE = 50; // slices for half circle
    var angle = Math.PI / SIZE;

    for (var r = 0; r < radii.length; r++) {
        for (var i = 0; i < SIZE + 1; i++) {
            points.push([
                center[0] + radii[r] * Math.cos(-i * angle),
                center[1] + radii[r] * Math.sin(-i * angle)
            ]);

            colors.push(ringColors[r]);//colors the rings 
        }
    }


}


function DrawFullPlanet(){

    

    // Create transformation matrices for the rings 
    var scaleMatrixRings = scale4(2*Ratio, 0.5*Ratio, 1);  // Adjusted scale values for rings
    var rotationMatrix = rotate(80, 0, 0, 1);  // Rotate around Z-axis

    // Combine transformations for the rings: Scale -> Rotate
    var transformationMatrixRings = mult(rotationMatrix, scaleMatrixRings);

    // Push current model view matrix to the stack for later restoration
    modelViewStack.push(modelViewMatrix);

    // Update model view matrix for rings
    modelViewMatrix = mult(modelViewMatrix, transformationMatrixRings);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    
    // Draw Back Circles
    for (var i = 0; i < 4; i++) {
        gl.drawArrays(gl.LINE_STRIP, i * 51, 51); 
    }

    // Restore original model view matrix
    modelViewMatrix = modelViewStack.pop();
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));


    // Create transformation matrices for the planet
    var scaleMatrixPlanet = scale4(2, 2*Ratio, 1);  // scale values

    // Push current model view matrix to the stack for later restoration
    modelViewStack.push(modelViewMatrix);

    // Update model view matrix for planet
    modelViewMatrix = mult(modelViewMatrix, scaleMatrixPlanet);  // Only scale for planet
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix)); 

    // Draw the planet circle
    gl.drawArrays(gl.TRIANGLE_FAN, 204, 101);

    // Restore original model view matrix
    modelViewMatrix = modelViewStack.pop();
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // 3. Transformation and Drawing of Front Circles (Rings)

    // We already have the transformation matrix for the rings. 
    // Push the current model view matrix to the stack for later restoration
    modelViewStack.push(modelViewMatrix);

    // Update model view matrix for front rings
    modelViewMatrix = mult(modelViewMatrix, transformationMatrixRings);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw Front Circles
    for (var i = 0; i < 4; i++) {
        gl.drawArrays(gl.LINE_STRIP, 305 + i * 51, 51); 
    }

    // Restore original model view matrix
    modelViewMatrix = modelViewStack.pop();
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

function render()
{

    gl.clear( gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    modelViewMatrix = mult(translate(-5, 5, 0),scale4(0.75,0.75, 1));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    DrawFullPlanet();
}