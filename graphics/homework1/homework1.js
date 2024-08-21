/*
Programmer: Jeremy Saltz
This program draws two squares and two triangles.
The squares are drawn in the second and forth quadrents while the
triangles are drawn in the first and third quadrents. The squares 
are both blue and the triangles are both red.  
*/

var gl;// global variable to hold WebGL rendering context
var program;// global variable to hold WebGl shader program

// main function the entry point for the program
function main() {

    // gets reference to an HTML canvas element maked "gl-canvas" 
    var canvas = document.getElementById( "gl-canvas" );

    // assigns the initialized WebGL context to the 'gl' variable
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }//check for WebGl support

    //  Load shaders and initialize attribute buffers and links to program
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    // sets WebGL rendering context to use shader program
    gl.useProgram( program );

    // arrary of 11 vertices to set points for two triangles and two squares
    var vertices = [
        //the first four points for a square in the second quadrent
        vec2(-0.5, 0),
        vec2(-0.5,  0.5),
        vec2(0, 0.5),
        vec2(0, 0),
        
        //the next three points for the triangle in third quadrent
        vec2(-0.5, -0.5),
        vec2(-0.25,0),
        vec2(0,-0.5),

        //the vec above 'vec2(0,-0.5)' and the next three points
        //form the square in the fourth quadrent
        vec2(0.5, -0.5),
        vec2(0.5,0),
        vec2(0,0),

        // the two vec's above and the next vec are the points for
        // the last triangle in the first quadrent
        vec2(0.25, 0.5)
    ];

    // Load the data into the GPU
    var bufferId = gl.createBuffer();//creates a buffer object

    // binds the buffer to ARRAY_BUFFER and indicates it will be used fo vertex data
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );

    // loads vertex data to current buffer 
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );

    // how the attribute data should be extrated from the buffer
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );

    // enables the vPostion for use in the vertex shader
    gl.enableVertexAttribArray( vPosition );

    // calls the render function to render the shapes
    render();
};

// render function
function render() {

    // sets the clear color to black
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    // clears the canvas with the clear color
    gl.clear( gl.COLOR_BUFFER_BIT );

    // set the colorChoice to 0 which will be blue
    gl.uniform1i(gl.getUniformLocation(program, "colorChoice"), 0);

    // draws a triangle fan starting with the index 0 and ending after 4 points
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );

    // sets the color choice to 1 which is red
    gl.uniform1i(gl.getUniformLocation(program, "colorChoice"), 1);

    // starting at index 4 draw a triangle with the 3 points
    gl.drawArrays(gl.TRIANGLES, 4, 3);

    // sets color choice to 0/blue
    gl.uniform1i(gl.getUniformLocation(program, "colorChoice"), 0);

    // starts at index 6 and draws a triangle fan with the 4 points
    gl.drawArrays( gl.TRIANGLE_FAN, 6, 4);

    // set color to red/1
    gl.uniform1i(gl.getUniformLocation(program, "colorChoice"), 1);

    // draws a triangle with 3 points starting at index 8 
    gl.drawArrays(gl.TRIANGLES, 8, 3);
}
