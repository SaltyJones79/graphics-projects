// sky.jpg  power of 2 image
var canvas;
var gl;
var program;
var image;

var numVertices  = 36;

var pointsArray = [];
var texCoordsArray = [];

var texture;

// vertex positions
/*  A  C       C
    B        B D   */
var vertices = [
    vec2( -0.5, 0.5),  
    vec2( -0.5,  -0.5), 
    vec2( 0.5, 0.5),
    vec2( -0.5,  -0.5), 
    vec2( 0.5, 0.5),
    vec2( 0.5,  -0.5),
];

// texture coordinates
// version 1 -- basic version
/*  A C     C
    B     B D */
var texCoord = [
    vec2(0, 1),
    vec2(0, 0),
    vec2(1, 1),

    vec2(0, 0),
    vec2(1, 1),
    vec2(1, 0),
];


// version 2
/*
var texCoord = [
    vec2(0.2, 0.7),
    vec2(0.2, 0),
    vec2(0.5, 0.7),

    vec2(0.2, 0),
    vec2(0.5, 0.7),
    vec2(0.7, 0),
];
*/

// version 3
// set TEXTURE_WRAP_T and TEXTURE_WRAP_S
/*
var texCoord = [
    vec2(-0.3, 1.7),
    vec2(-0.3, -0.2),
    vec2(1.7, 1.7),

    vec2(-0.3, -0.2),
    vec2(1.7, 1.7),
    vec2(1.7, -0.2),
];
*/

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  =======  Load shaders  ===============
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // ========  Initiailze Vertex buffers =============
    InitVertexBuffers();

    // ========  Establish Textures =================
    // create the texture object
    texture = gl.createTexture();

    // create the image object
    texture.image = new Image();

    // register the event handler to be called on loading an image
    texture.image.onload = function() {  loadTexture(texture);}

    // Tell the broswer to load an image
    texture.image.src='sky.jpg';

    render();
}


function InitVertexBuffers()
{
    // position buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    // texture buffer
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vTexCoord );
}


function loadTexture(texture) 
{
    // Flip the image's y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Enable texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // bind the texture object to the target
    gl.bindTexture( gl.TEXTURE_2D, texture );

    // set the texture image
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image );
    //gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image );

    // v1 (needed combination for images that are not powers of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // v2
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);

    // set the texture parameters
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    // mipmap option
    //gl.generateMipmap( gl.TEXTURE_2D );
    //gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    //gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST);

    // set the texture unit 0 the sampler
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
};

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT);

    gl.drawArrays( gl.TRIANGLES, 0, 6);

    requestAnimFrame(render);
}
