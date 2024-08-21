/*
Programmer: Jeremy Saltz
This program draws a twisted triangle using Siepinski's Gasket by recursion.
It moves the points and rotates by 2/3*PI radians or 120 degrees. 
*/

// var to store the angle to trist the triangle at
var theta=120/180*Math.PI;
// 
var canvas;// to store the canvas element
var gl;// WebGL variable

var points = [];// global array of points

var NumTimesToSubdivide = 5;// var for the count for the recurive base case


// the main funtion 
window.onload = function init()
{
    // gets reference to an HTML canvas element maked "gl-canvas"
    canvas = document.getElementById( "gl-canvas" );
    
    // assigns the initialized WebGL context to the 'gl' variable
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
        
    //  Initialize our data for the Sierpinski Gasket
    // First, initialize the corners of the triangle with three points.
    // triangle centered at origin (radius 0.6)
    // I kept this the same as the original code and only modified what was necessary
    var vertices = [
        vec2( -.52, -.3 ),
        vec2(  0,  .6 ),
        vec2(  .52, -.3 )
    ];

    // recurvie function to set the points for the triangle
    divideTritheta( vertices[0], vertices[1], vertices[2],
                    NumTimesToSubdivide);

    
    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 ); // set color

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render(); // calls the render function
};

function triangle( a, b, c )
{
    var aa, bb, cc; // vars to store new mid point vertices

    // twist the three points "theta" (120) degrees 
    // according their distance to the origin 
    aa = twist(a);
    bb = twist(b);
    cc = twist(c);

    points.push( aa, bb, cc );// pushes the points on to the poits array
}

// returns the "twisted" vertecies
function twist(p)
{
    var x, y;// x y prime vars
    var distance;// var used to calculate the x and y prime

    distance = Math.sqrt(p[0]*p[0] + p[1]*p[1]);// sets the distance

    // calulate the location of the points for the twisted shape
    x = p[0]*Math.cos(distance*theta) - p[1]*Math.sin(distance*theta);
    y = p[0]*Math.sin(distance*theta) + p[1]*Math.cos(distance*theta);

    return (vec2(x, y));// returns the new "twisted" points
}

// recursive function to set the points for the twisted shape
function divideTritheta( a, b, c, count )
{

    // check for end of recursion
    
    if ( count === 0 ) {
        triangle( a, b, c );
    }
    else {
    
        //bisect the sides
        
        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // four new triangle
        
        divideTritheta( a, ab, ac, count );

        /* this was the modification I made to get the shape to
        fill in. [divideTritheta( ab, bc, ac, count);]
        I noticed that I needed to add points for the triangles
        that were being filled in. I saw that the pattern was each new mid point
        and followed a similar pattern to get the midpoints for the fourth triangle 
        I needed. */
        divideTritheta( ab, bc, ac, count);

        divideTritheta( c, ac, bc, count );
        divideTritheta( b, bc, ab, count );
    }
}

// function to render the twisted triangle
function render()
{
    // clear color buffer
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length ); // draws the shape
}
