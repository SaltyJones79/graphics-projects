// transformation exercise
var gl, program;

var xstep=0.01;
var ystep=0.009;

var modelViewMatrix;
var version = 1;

var startLoc=[-1,0], endLoc = [1, 0];
var translateX=startLoc[0];  // starting X location
var loc=startLoc;  // starting location for version 3
var STEPS=100;
var count=0;

function main()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Four Vertices
    var vertices = [
        vec2( 0, 0 ),
        vec2(  0.2,  0 ),
        vec2(  0.2, 0.2 ),
        vec2( 0, 0.2)
    ];

    //  Configure WebGL
    //gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( .9, 0.9, 0.9, 1.0 );

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // pass modelViewMatrix to WebGL
   	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

	modelViewMatrix = mat4();

	// Handle Button click event
    var a = document.getElementById("OneButton");

    a.addEventListener("click", function(){
	    modelViewMatrix = mat4();
        version = 1;
        render();
    });

    var a = document.getElementById("TwoButton");
    a.addEventListener("click", function(){
        version = 2;
	    modelViewMatrix = translate(startLoc[0], 0, 0);
		count = 0;
        render();
    });

    var a = document.getElementById("ThreeButton");
    a.addEventListener("click", function(){
	    modelViewMatrix = mat4();
        version = 3;
        render();
    });
    render();
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    if (version == 1)
    {
        modelViewMatrix = mat4();
    }
    else if (version == 2)   // straight move
    {


























    }
    else if (version == 3)  // bouncing in a square
    {
        var rsize = 0.2;
        var windowWidth = 1;
        var windowHeight = 1;

        var x=loc[0];
        var y=loc[1];

	    // Compute the next location of the square
        x += xstep;
        y += ystep;

        // Reverse direction when it reaches left or right edge




        // Reverse direction when you reach top or bottom edge





        loc[0] = x;
        loc[1] = y;

        // apply transformation
        modelViewMatrix =
    }

    // pass modelviewmatrix to WebGL and then draw the square
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );

    setTimeout(function (){requestAnimFrame(render);}, 20);  // 20 ms between animation steps
}
