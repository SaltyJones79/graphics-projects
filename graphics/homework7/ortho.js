var canvas, gl;

var numVertices  = 36;
var pointsArray = [];
var colorsArray = [];

/*
      E ----  F
     /|     / |
    A ---  B  |
    | |    |  |
    | G----+- H
    |/     | /
    C------D/                 */
var vertices = [
        vec4(-1,  1,  1, 1.0 ),  // A (0)
        vec4( 1,  1,  1, 1.0 ),  // B (1) 
        vec4(-1, -1,  1, 1.0 ),  // C (2)
        vec4( 1, -1,  1, 1.0 ), // D (3)
        vec4( -1, 1, -1, 1.0 ), // E (4)
        vec4( 1,  1, -1, 1.0 ), // F (5)
        vec4( -1,-1, -1, 1.0 ), // G (6)
        vec4( 1, -1, -1, 1.0 ),  // H (7)
    ];

var vertexColors = [
        vec4( 1.0, 0.0, 0.0, 1.0 ),  // red (0)
        vec4( 0.8, 0.8, 0.2, 1.0 ),  // yellowish-green (1)
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green (2)
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue (3)
        vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta (4)
        vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan (5)
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow (6)
    ];

var mvMatrix, pMatrix;
var modelView, projection;

// quad uses first index to set color for face
function quad(a, b, c, d) {
     pointsArray.push(vertices[a]); 
     colorsArray.push(vertexColors[a]); 
     pointsArray.push(vertices[b]); 
     colorsArray.push(vertexColors[a]); 
     pointsArray.push(vertices[c]); 
     colorsArray.push(vertexColors[a]);    
     pointsArray.push(vertices[a]); 
     colorsArray.push(vertexColors[a]); 
     pointsArray.push(vertices[c]); 
     colorsArray.push(vertexColors[a]); 
     pointsArray.push(vertices[d]); 
     colorsArray.push(vertexColors[a]);   
}

// Each face is formed with two triangles
function colorCube() {
    quad( 0, 1, 3, 2 );  // front(ABDC) red
    quad( 4, 5, 7, 6 );  // back(EFHG)  magenta
    quad( 3, 1, 5, 7 );  // right (DBFH) blue
    quad( 6, 2, 0, 4 );  // left (GCAE) yellow
    quad( 2, 6, 7, 3 ); // bottom (CGHD) green
    quad( 5, 4, 0, 1); // top (AEFB) cyan
}

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    colorCube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
 
    modelView = gl.getUniformLocation( program, "modelView" );
    projection = gl.getUniformLocation( program, "projection" );

    render();
}

var eye = vec3(4, 4, -4);
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
           
    mvMatrix=lookAt(vec3(3, 3, 3), at, up); 
    //pMatrix = ortho(-3, 3, -3, 3, 2, 6);
    pMatrix=ortho(0, 4, 0, 3, 2, 10);
        
    var t=mult(pMatrix, mvMatrix);
    console.log("projection*modelview");
	console.log(flatten(t));

    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
            
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
}
