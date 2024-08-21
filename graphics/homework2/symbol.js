/*Programmer: Jeremy Saltz
This program draws a symbol with two circles. One with a radius of 0.5 
and the other with a radius of 1.0. The program draws a circle with a 
six point star in the center of the circle.
*/

var gl, program;// global variable to hold WebGL rendering context
var points;// glogal variable to hold points of the symbol
var SIZE;// var to hold the amount of slices based on theta

// the main function
function main() {

    // gets reference to an HTML canvas element maked "gl-canvas"
    var canvas = document.getElementById( "gl-canvas" );
    
    // assigns the initialized WebGL context to the 'gl' variable
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { console.log( "WebGL isn't available" ); return; }

	var center= vec2(0.0, 0.0);// location of the center of the circle
    var radius = 0.5; // radius of the inner circle
    var Radius = 1.0;// radius of the outer circle

    // the GeneratePoints function is called and stored in the poits var
    var points = GeneratePoints(center, radius, Radius);

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
 	if (!program) { console.log('Failed to intialize shaders.'); return; }
	gl.useProgram( program );
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render(); // calls the render function to render the symbol
};


// generate points to draw a symbol from two concentric circles, 
// the inner circle one with radius, the outer circle with Radius 
// centered at (center[0], center[1]) using GL_Line_STRIP
function GeneratePoints(center, radius, Radius)
{
    var vertices=[];
    SIZE=6; // slices
    ANGLE_SLICE = 100; // angleSlice outer circle angles

    var angle = 2*Math.PI/SIZE;// the angle to be sliced for the star
    var circle_theta = 2*Math.PI/ANGLE_SLICE;// the angle to be sliced for the circle

	
    // loop to set points for the star in the center of the circle
    for (var i=0; i<SIZE; i++) {
        // point from inner circle
        vertices.push(vec2(center[0]+radius*Math.cos(i*angle), center[1]+radius*Math.sin(i*angle)));

       // point from outer circle
        vertices.push(vec2(center[0]+Radius*Math.cos((i*angle)+Math.PI/6), center[1]+Radius*Math.sin((i*angle)+Math.PI/6)));
    }
    // final point to draw the star 
    vertices.push(vec2(center[0]+radius*Math.cos(0), center[1]+radius*Math.sin(0)));

    // loop to set the points for the outer circle
    for(var i = 0; i<ANGLE_SLICE+1; i++) {

        vertices.push([center[0]+Radius*Math.cos(i*circle_theta), 
        center[1]+Radius*Math.sin(i*circle_theta)]);
    }

    return vertices;// return the points to draw the symbol
}

// render function to draw the symbol
function render() {

    // clears the canvas color 
    gl.clear( gl.COLOR_BUFFER_BIT );

    // sets the color of the symbol
    gl.uniform1i(gl.getUniformLocation(program, "colorIndex"), 2);
    // draws the star in the center of the circle
    gl.drawArrays( gl.LINE_STRIP, 0, SIZE*2+1);
    // draws the outer circle
    gl.drawArrays( gl.LINE_STRIP, SIZE*2+1, ANGLE_SLICE +1 );
}