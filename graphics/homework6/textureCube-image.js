var canvas;
var gl;
var program;
var image;

var numVertices  = 12;

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texture;

var textures = [];
var imageSources = [ 'baby_Ada.jpg','Al_Cat.jpg', 'me.jpg', 'baby_Grace.jpg'];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function initTextures() {
    for (var i = 0; i < imageSources.length; i++) {
        var texture = gl.createTexture();
        texture.image = new Image();
        texture.image.onload = function(texture, i) { 
            return function() {
                loadTexture(texture, i);
            }
        }(texture, i);
        texture.image.src = imageSources[i];
        textures.push(texture);
    }
}

var vertices = [
    vec4(-0.5,  -0.5,  -0.5, 1.0 ),  // A (0)
    vec4( -0.5,  0.5,  0.5, 1.0 ),  // B (1)
    vec4(0.5, -0.5,  0.5, 1.0 ),  // C (2)
    vec4( 0.5, 0.5,  -0.5, 1.0 ), // D (3)
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];    

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;
var theta = [45.0, 45.0, 45.0];

var thetaLoc;
var texIndicesArray = [];

function tetra(a, b, c, texIndex) {
     pointsArray.push(vertices[a]); 
     colorsArray.push(vertexColors[a]); 
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[b]); 
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[2]); 

     pointsArray.push(vertices[c]); 
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[3]);
     for (var i = 0; i < 3; i++) { // Each face has three vertices
        texIndicesArray.push(texIndex);
    } 
}

function colorTetra()
{
    tetra(0, 1, 2, 0); // Triangle ABC, texture index 0
    tetra(0, 1, 3, 1); // Triangle ABD, texture index 1
    tetra(0, 2, 3, 2); // Triangle ACD, texture index 2
    tetra(1, 2, 3, 3); // Triangle BCD, texture index 3
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    // generate the mesh vertex positions, color, normal, textures, etc.
    colorTetra();

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    //  initialize the attribute buffers
    //
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    var texIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texIndicesArray), gl.STATIC_DRAW);

    var aTexIndex = gl.getAttribLocation(program, "aTexIndex");
    gl.enableVertexAttribArray(aTexIndex);
    gl.vertexAttribPointer(aTexIndex, 1, gl.FLOAT, false, 0, 0);

    // event handler related setup
    thetaLoc = gl.getUniformLocation(program, "theta"); 

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
   

    // ==============  Establish Textures =================
    initTextures()

    render();
}

function loadTexture(texture, index) 
{
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "textures[" + index + "]"), index);
}

// In the render function, bind the correct texture for each face
var render = function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, flatten(theta));

    for (var i = 0; i < numVertices; i += 3) {
        var texIndex = texIndicesArray[i / 3];
        gl.uniform1f(gl.getUniformLocation(program, "vTexIndex"), texIndex);
        gl.drawArrays(gl.TRIANGLES, i, 3);
    }

    requestAnimFrame(render);
}