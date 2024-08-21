/* ==============================================
MEMBERS:        Brent Yelle & Jeremy Saltz
ASSIGNMENT:     Project 4, Part I
DUE DATE:       11/20/2023
DESCRIPTION:    [t.b.d.] This is going to be a 
park with board game peices. I have commented out 
the Code that Brent had used to make his objects
and add my own to the scene so we have the same template.

============================================== */

var canvas, gl;

// for matrix viewing
var modelMatrix,        viewMatrix,         projectionMatrix;
var modelMatrixLoc,     viewMatrixLoc,      projectionMatrixLoc;
var ambientProduct,     diffuseProduct,     specularProduct,        lightPosition,      shininess;
var ambientProductLoc,  diffuseProductLoc,  specularProductLoc,     lightPositionLoc,   shininessLoc;
var boolUseTex;
var boolUseTexLoc
var RATIO = 1;

const FALSE=0, TRUE=1;

// for projectionMatrix
var y_max   = 5;
var y_min   = -5;
var x_max   = 8;
var x_min   = -8;
var near    = -50;
var far     = 50;

// for view matrix
var eye;
var eyeX=2, eyeY=2, eyeZ=2; // default eye position input values
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);

// for drawing the figures
var pointsArray     = [];
var colorsArray     = [];
var normalsArray    = [];
var texCoordsArray  = [];

var fullTexCoords   = [[0,0], [0,1], [1,1], [1,0]];

var total_points    = 0;
var should_animate  = false;
var should_spin     = false;

//colors for the different oblects
var COLORS = {
    default     : vec4(1,0,0,1),
    lampstand   : vec4(47/255, 53/255, 74/255, 1),
    lamplight   : vec4(255/255, 253/255, 153/255, 1),
    background  : vec4(30/255, 50/255, 25/255, 1),
    bush        : vec4(22/255, 89/255, 42/255, 1),
    meeple      : vec4(202/255, 164/255, 114/255, 1.0),
    trashtop    : vec4(113/225,193/255, 63/255, 1.0),
    trashbase   : vec4(244/255, 255/255, 63/255, 1.0),
    checker     : vec4(100/255, 0/255, 0/255, 1,0),
    dark_wood   : vec4(67/255, 39/255, 15/255, 1.0 ),
    hour_glass  : vec4(127/255, 255/255, 212/255, 1.0 ),
    meeple_two  : vec4(98/255,42/255,15/255, 1),
    top_stone   : vec4(224/255, 224/255, 224/255, 1.0),
    airplane    : vec4(250/275, 244/275, 237/275, 1.0),
    crayon_1    : vec4(225/255, 29/255, 206/255, 1.0 ),
    crayon_2    : vec4(26/255, 72/255, 118/255, 1.0 ),
    crayon_3    : vec4(253/255, 94/255, 83/255, 1.0 )
}

// lighting-control arrays
var lightPosition   = vec4(3, -2.5, 6.5, 1);

var lightAmbient    = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse    = vec4(0.4, 0.4, 0.4, 1.0);
var lightSpecular   = vec4(0.2, 0.2, 0.2, 1.0);

// counts to save location in the arrays
var POINTCOUNT = {
    lamppost        : 0,
    sphere          : 0,
    meepleBody      : 0,
    trashcan        : 0,
    trashbottom     : 0,
    checkerside     : 0,
    checkerface     : 0,
    airplane        : 0,
    crayon_one      : 0,
    crayon_two      : 0,
    crayon_three    : 0
}

function setLighting(amb, dif, spec, shiny) {
    // set up lighting and material
    ambientProduct = mult(lightAmbient, amb);
    diffuseProduct = mult(lightDiffuse, dif);
    specularProduct = mult(lightSpecular, spec);

	// send lighting and material coefficient products to GPU
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), shiny );
    return;
}

/* ==============================================
FUNCTIONS FOR CREATING PRIMITIVES
============================================== */
function triangle(p1, p2, p3, color=COLORS.default, texindices = [0,1,2]) {
    var nx,ny,nz;

    pointsArray.push(p1);
    pointsArray.push(p2);
    pointsArray.push(p3);
    var norm = newell2([p1,p2,p3]);
    //console.log("normal: ", nx, ny, nz);
    normalsArray.push(norm, norm, norm);
    texCoordsArray.push(fullTexCoords[texindices[0]], fullTexCoords[texindices[1]], fullTexCoords[texindices[2]]);

    for (var i=0; i<3; i++) { colorsArray.push(color); }
    total_points += 3;
    return 3;
}

function quadrilateral(p1, p2, p3, p4, color=COLORS.default) {
    triangle(p1,p2,p3,color, [0,1,2]);
    triangle(p1,p3,p4,color, [0,2,3]);
    return 6;
}

function pentagon(a, b, c, d, e, color=COLORS.default) {
    triangle(a,b,c,color, [0,1,2]);
    triangle(a,c,d,color, [0,2,3]);
    triangle(a,d,e,color, [0,1,3]);
    return 9;
}

// Newell's method for calculating normals
function newell2(points_list) {
    var nx=0, ny=0, nz=0;
    var max_points = points_list.length;
    for (var i=0; i<max_points; i++) {
        next_i = (i+1) % max_points;
        nx += (points_list[i][1] - points_list[next_i][1]) * (points_list[i][2] + points_list[next_i][2]);
        ny += (points_list[i][2] - points_list[next_i][2]) * (points_list[i][0] + points_list[next_i][0]);
        nz += (points_list[i][0] - points_list[next_i][0]) * (points_list[i][1] + points_list[next_i][1]);
    }
    let normed = normalize(vec3(nx, ny, nz));

    if (normed[0] == NaN)
        return vec3(0,1,0);
    else
        return normed;
}

function newell3(points_list) {
    return [0,1,0];
}

function newell(points_list) {
    /*  A
       B C */
    var v1 = subtract(points_list[0], points_list[2]);
    var v2 = subtract(points_list[1], points_list[2]);
    return normalize(vec3(cross(v1,v2)));
}

// convert from cylindrical to rectangular coordinates (NOTE THE SWAPPING OF y AND z)
function cylindrical_to_rectangular(radius, theta, height) {
    return vec4(radius * Math.cos(theta), height, radius * Math.sin(theta), 1);
}

// convert from spherical to rectangular coordinates (NOTE THE SWAPPING OF y AND z); theta is azimuthal, phi is vertical
function spherical_to_rectangular(radius, theta, phi) {
    return vec4(radius * Math.cos(theta) * Math.sin(phi),
                radius * Math.cos(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                1);
}

// matrix for scaling, because the one in MV.js is broken
function scaleMatrix(x_scale, y_scale, z_scale) {
    let m = mat4();
    m[0][0] = x_scale;
    m[1][1] = y_scale;
    m[2][2] = z_scale;
    return m;
}

// namespace to contain all the project information
var AllInfo = {

    // Camera pan control variables.
    zoomFactor : 0.5,
    translateX : 0,
    translateY : 0,

    // Camera rotate control variables.
    phi     : 1,
    theta   : 0.5,
    radius  : 1,
    dr      : 2.0 * Math.PI/180.0,

    // Mouse control variables
    mouseDownRight : false,
    mouseDownLeft  : false,

    mousePosOnClickX : 0,
    mousePosOnClickY : 0
};

function resetAllInfo() {
    AllInfo.zoomFactor  = 0.5;
    AllInfo.translateX  = 0;
    AllInfo.translateY  = 0;
    AllInfo.phi         = 1;
    AllInfo.theta       = 0.5;
    AllInfo.radius      = 1;
    AllInfo.dr          = 2.0 * Math.PI/180.0;
    AllInfo.mouseDownLeft       = false;
    AllInfo.mouseDownRight      = false;
    AllInfo.mousePosOnClickX    = 0;
    AllInfo.mousePosOnClickY    = 0;
}

/* ==============================================
FUNCTION LOADED INTO HTML
============================================== */
window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    RATIO = canvas.width / canvas.height;
    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    /* =================================================
    LOAD OBJECTS INTO GLOBAL ARRAYS HERE
    ================================================= */
    
    createChecker(color=COLORS.checker);
    createLamppost();
    createBackground();
    createBush();
    createMeeple();
    createTrashBase(color=COLORS.trashbase);  // generates the points of the base of the trashcan
    createTrashTop(color=COLORS.trashtop);    // generates the points for the top of the trashcan
    createHourGlasss();
    createMeepleTwo();
    createTop();
    createAirplane();
    createCrayons();
    

    /* =================================================
    ALL OBJECTS SHOULD BE LOADED NOW
    ================================================= */

    setBuffers(program);
    setupTextures();

    // Set the position of the eye
    document.getElementById("eyeValue").onclick=function() {
        eyeX=document.parameterForm.xValue.value;
        eyeY=document.parameterForm.yValue.value;
        eyeZ=document.parameterForm.zValue.value;
        render();
    };

    // These four just set the handlers for the buttons.
    document.getElementById("thetaup").addEventListener("click", function(e) {
        AllInfo.theta += AllInfo.dr;
        render();
    });
    document.getElementById("thetadown").addEventListener("click", function(e) {
        AllInfo.theta -= AllInfo.dr;
        render();
    });
    document.getElementById("phiup").addEventListener("click", function(e) {
        AllInfo.phi += AllInfo.dr;
        render();
    });
    document.getElementById("phidown").addEventListener("click", function(e) {
        AllInfo.phi -= AllInfo.dr;
        render();
    });

    // Set the scroll wheel to change the zoom factor.
    // wheelDelta returns an integer value indicating the distance that the mouse wheel rolled.
    // Negative values mean the mouse wheel rolled down. The returned value is always a multiple of 120.
    document.getElementById("gl-canvas").addEventListener("wheel", function(e) {
        if (e.wheelDelta > 0) {
            AllInfo.zoomFactor = Math.max(0.1, AllInfo.zoomFactor - 0.1);
        } else {
            AllInfo.zoomFactor += 0.1;
        }
        render();
    });

    //************************************************************************************
    //* When you click a mouse button, set it so that only that button is seen as
    //* pressed in AllInfo. Then set the position. The idea behind this and the mousemove
    //* event handler's functionality is that each update we see how much the mouse moved
    //* and adjust the camera value by that amount.
    //************************************************************************************
    document.getElementById("gl-canvas").addEventListener("mousedown", function(e) {
        if (e.which == 1) {
            AllInfo.mouseDownLeft = true;
            AllInfo.mouseDownRight = false;
            AllInfo.mousePosOnClickY = e.y;
            AllInfo.mousePosOnClickX = e.x;
        } else if (e.which == 3) {
            AllInfo.mouseDownRight = true;
            AllInfo.mouseDownLeft = false;
            AllInfo.mousePosOnClickY = e.y;
            AllInfo.mousePosOnClickX = e.x;
        }
        render();
    });

    document.addEventListener("mouseup", function(e) {
        AllInfo.mouseDownLeft = false;
        AllInfo.mouseDownRight = false;
        render();
    });

    document.addEventListener("mousemove", function(e) {
        if (AllInfo.mouseDownRight) {
            AllInfo.translateX += (e.x - AllInfo.mousePosOnClickX)/30;
            AllInfo.mousePosOnClickX = e.x;

            AllInfo.translateY -= (e.y - AllInfo.mousePosOnClickY)/30;
            AllInfo.mousePosOnClickY = e.y;
        } else if (AllInfo.mouseDownLeft) {
            AllInfo.phi += (e.x - AllInfo.mousePosOnClickX)/100;
            AllInfo.mousePosOnClickX = e.x;

            AllInfo.theta += (e.y - AllInfo.mousePosOnClickY)/100;
            AllInfo.mousePosOnClickY = e.y;
        }
        render();
    });

    // pressing A will cause the animation to occur
    window.addEventListener("keydown", function(event) {
        if (event.key == 'a' || event.key == 'A') {
            should_animate = !should_animate;
            render();
        }
    });

    var sound = new Audio("its-time-to-duel.mp3");

    // pressing R will cause the scene to rotate
    window.addEventListener("keydown", function(event) {
        if (event.key == 'r' || event.key == 'R') {
            should_spin = !should_spin;
            sound.play();
            render();
        }
    });

    // pressing B will cause the scene to reset to initial conditions
    window.addEventListener("keydown", function(event) {
        if (event.key == 'b' || event.key == 'B') {
            // stop & reset animation
            should_spin    = false;
            should_animate = false;
            current_spin_angle = 0;
            // stop the audio & reset to beginning
            sound.pause();
            sound.currentTime = 0;
            // reset view
            resetAllInfo();
            render();
        }
    });

    render();
}

/* ==============================================
RENDERING FUNCTION
============================================== */
var current_spin_angle = 0;

var render = function() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // projection matrix determined by scene controls
    projectionMatrix = ortho( x_min*AllInfo.zoomFactor - AllInfo.translateX,
                              x_max*AllInfo.zoomFactor - AllInfo.translateX,
                              y_min*AllInfo.zoomFactor - AllInfo.translateY,
                              y_max*AllInfo.zoomFactor - AllInfo.translateY,
                              near, far);
    //console.log(ortho(-6,6, -6,6, 2,10), "answer");
    //console.log("16:", frustum(-6, 6, -8, 8, 2, 10));
    //console.log("17:", newell2([[0,2,0], [0,0,2], [2,0,0], [2,1,-1]]));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Setup the view matrix.
    eye = vec3( AllInfo.radius*Math.cos(AllInfo.phi),
                AllInfo.radius*Math.sin(AllInfo.theta),
                AllInfo.radius*Math.sin(AllInfo.phi));

    viewMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

    /* =================================================
    DRAW ALL FIGURES HERE
    ================================================= */
    var current_offset = 0;
    current_offset += drawChecker(current_offset, current_spin_angle);
    current_offset += drawLamppost(current_offset);
    current_offset += drawBackground(current_offset);
    current_offset += drawBush(current_offset);
    current_offset += drawMeeple(current_offset);
    current_offset += drawTrashCan(current_offset);
    current_offset += drawHourGlass(current_offset);
    current_offset += drawMeepleTwo(current_offset);
    current_offset += drawTop(current_offset);
    current_offset += drawAirplane(current_offset);
    current_offset += drawCrayons(current_offset);
    
    if (should_animate) {
        current_spin_angle += 0.02;
    }
    if (should_spin) {
        AllInfo.phi += 0.0001;
    }
    if (should_animate || should_spin) {
        requestAnimFrame(render);
    }
}

function setBuffers(program) {

    console.log("sending arrays to buffers, lengths:", colorsArray.length, normalsArray.length, pointsArray.length, texCoordsArray.length);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // matrices for point calculation
    modelMatrixLoc      = gl.getUniformLocation(program, "modelMatrix");
    viewMatrixLoc       = gl.getUniformLocation(program, "viewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    ambientProductLoc   = gl.getUniformLocation(program, "ambientProduct");
    specularProductLoc  = gl.getUniformLocation(program, "specularProduct");
    diffuseProductLoc   = gl.getUniformLocation(program, "diffuseProduct");
    lightPositionLoc    = gl.getUniformLocation(program, "lightPosition");
    shininessLoc        = gl.getUniformLocation(program, "shininess");

    // boolean for using the textures or not
    boolUseTexLoc       = gl.getUniformLocation(program, "boolUseTex");

    //setLighting(amb, spec, shiny);

}

function loadTexture(texture, textureEnum, textureEnumInt) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.activeTexture(textureEnum);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.uniform1i(gl.getUniformLocation(program, "texture"), textureEnumInt);
    return;
}

function setupTexture(image_filename, textureEnum, textureEnumInt) {
    var newTexture = gl.createTexture();
    newTexture.image = new Image();
    newTexture.image.crossOrigin = "anonymous";
    newTexture.image.onload = function() { loadTexture(newTexture, textureEnum, textureEnumInt); return; };
    newTexture.image.src = image_filename;
    return;
}

function setupTextures() {
    setupTexture("newbkgrd.jpg", gl.TEXTURE0, 0);
    setupTexture("wood_grain_2.jpg", gl.TEXTURE1, 1);
    setupTexture("steel_can.jpg", gl.TEXTURE2, 2);
    setupTexture("green_can.jpg", gl.TEXTURE3, 3);
    setupTexture("wood_grain_1.jpg", gl.TEXTURE4, 4);
    setupTexture("wood_grain_3.jpg", gl.TEXTURE5, 5);
    setupTexture("checkerthing.png", gl.TEXTURE6, 6);
    setupTexture("notebook.jpg", gl.TEXTURE7, 7);
}

/* ==============================================
PRIMITIVE OBJECTS
============================================== */
function createCube(color=COLORS.default) {
    /*
      E ----  F
     /|     / |
    A ---  B  |
    | |    |  |
    | G----+- H
    |/     | /
    C------D/                 */
    var p = [
        vec4(-1,  1,  1, 1.0 ), // A (0)
        vec4( 1,  1,  1, 1.0 ), // B (1)
        vec4(-1, -1,  1, 1.0 ), // C (2)
        vec4( 1, -1,  1, 1.0 ), // D (3)
        vec4(-1,  1, -1, 1.0 ), // E (4)
        vec4( 1,  1, -1, 1.0 ), // F (5)
        vec4(-1, -1, -1, 1.0 ), // G (6)
        vec4( 1, -1, -1, 1.0 ), // H (7)
    ];

    //console.log("making front");
    quadrilateral( p[0], p[2], p[3], p[1], color); // front( ACDB)
    //console.log("making back");
    quadrilateral( p[4], p[5], p[7], p[6], color); // back( EFHG)
    //console.log("making right");
    quadrilateral( p[1], p[3], p[7], p[5], color); // right ( BDHF)
    //console.log("making left");
    quadrilateral( p[6], p[2], p[0], p[4], color); // left ( GCAE)
    //console.log("making bottom");
    quadrilateral( p[2], p[6], p[7], p[3], color); // bottom ( CGHD)
    //console.log("making top");
    quadrilateral( p[5], p[4], p[0], p[1], color); // top ( ABFE)
    //console.log("made cube");
    return;
}

function drawCube(current_offset, modelmat=0) {
    gl.drawArrays(gl.TRIANGLES, current_offset, 36);
    return 36;
}

function createSphere(color=COLORS.default) {
    const PHI_SLICES    = 8;
    const THETA_SLICES  = 16;
    const DELTA_PHI     = Math.PI / PHI_SLICES;
    const DELTA_THETA   = 2.0 * Math.PI / THETA_SLICES;
    const RADIUS        = 2;
    POINTCOUNT.sphere   = 0;

    for (var p=0; p < PHI_SLICES; p++) {
        for (var t=0; t < THETA_SLICES; t++) {
            var p1 = spherical_to_rectangular(RADIUS,     t*DELTA_THETA,     p*DELTA_PHI);
            var p2 = spherical_to_rectangular(RADIUS,     t*DELTA_THETA, (p+1)*DELTA_PHI);
            var p3 = spherical_to_rectangular(RADIUS, (t+1)*DELTA_THETA, (p+1)*DELTA_PHI);
            var p4 = spherical_to_rectangular(RADIUS, (t+1)*DELTA_THETA,     p*DELTA_PHI);
            POINTCOUNT.sphere += quadrilateral(p1, p2, p3, p4, color); 
        }
    }

    return;
}

function createSphere(color=COLORS.default) {
    const PHI_SLICES    = 100;
    const THETA_SLICES  = 2 * PHI_SLICES;
    const DELTA_PHI     = Math.PI / PHI_SLICES;
    const DELTA_THETA   = 2.0 * Math.PI / THETA_SLICES;
    const RADIUS        = 2;
    POINTCOUNT.sphere   = 0;

    for (var p=0; p < PHI_SLICES; p++) {
        for (var t=0; t < THETA_SLICES; t++) {
            var p1 = spherical_to_rectangular(RADIUS,     t*DELTA_THETA,     p*DELTA_PHI);
            var p2 = spherical_to_rectangular(RADIUS,     t*DELTA_THETA, (p+1)*DELTA_PHI);
            var p3 = spherical_to_rectangular(RADIUS, (t+1)*DELTA_THETA, (p+1)*DELTA_PHI);
            var p4 = spherical_to_rectangular(RADIUS, (t+1)*DELTA_THETA,     p*DELTA_PHI);
            POINTCOUNT.sphere += quadrilateral(p1, p2, p3, p4, color); 
        }
    }

    return;
}

function createFuzzySphere(color=COLORS.default) {
    const PHI_SLICES    = 12;
    const THETA_SLICES  = 2 * PHI_SLICES;
    const DELTA_PHI     = Math.PI / PHI_SLICES;
    const DELTA_THETA   = 2.0 * Math.PI / THETA_SLICES;
    const RADIUS        = 2;
    POINTCOUNT.sphere   = 0;

    function rad_var() {
        const VARLEVEL = 1;
        return (Math.random() - 0.5) * VARLEVEL;
    }

    for (var p=0; p < PHI_SLICES; p++) {
        for (var t=0; t < THETA_SLICES; t++) {
            var p1 = spherical_to_rectangular(RADIUS + rad_var(),     t*DELTA_THETA,     p*DELTA_PHI);
            var p2 = spherical_to_rectangular(RADIUS + rad_var(),     t*DELTA_THETA, (p+1)*DELTA_PHI);
            var p3 = spherical_to_rectangular(RADIUS + rad_var(), (t+1)*DELTA_THETA, (p+1)*DELTA_PHI);
            var p4 = spherical_to_rectangular(RADIUS + rad_var(), (t+1)*DELTA_THETA,     p*DELTA_PHI);
            POINTCOUNT.sphere += quadrilateral(p1, p2, p3, p4, color); 
        }
    }

    return;
}


function drawSphere(current_offset) {
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.sphere);
    return POINTCOUNT.sphere;
}

/* ==============================================
BACKGROUND OBJECTS
============================================== */

const GROUND = {
    thickness   : 0.23,
    length      : 4,
    width       : 4,
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    specular : vec4(0.7, 0.7, 0.7, 1.0),
    diffuse : vec4(0.2, 0.2, 0.2, 1.0),
    shininess : 2
}

function createBackground() {
    return createCube(COLORS.background);
};
function drawBackground(current_offset) {
    setLighting(GROUND.ambient, GROUND.diffuse, GROUND.specular, GROUND.shininess);
    modelMatrix = mult(scaleMatrix(GROUND.length, GROUND.thickness, GROUND.width), translate(0,-1,0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    
    gl.uniform1i(boolUseTexLoc, FALSE);
    gl.drawArrays(gl.TRIANGLES, current_offset, 30);
    gl.uniform1i(boolUseTexLoc, TRUE);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    gl.drawArrays(gl.TRIANGLES, current_offset+30, 6);
    gl.uniform1i(boolUseTexLoc, FALSE);

    return 36;
}

/*
function drawSun(current_offset) {
    modelMatrix = mult(translate(0,0,0), scaleMatrix(1,.7,1));
    modelMatrix = mult(scaleMatrix(.2, .2, .2), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    return drawSphere(current_offset);
}*/

/* ==============================================
BRENT'S OBJECTS
============================================== */

const LAMPPOST = {
    stand_pts : [
        [0,                    0],
        [0,                    0.518292682926829],
        [0.0124575311438279,   0.518292682926829],
        [0.0169875424688562,   0.396341463414634],
        [0.029445073612684,    0.347560975609756],
        [0.0385050962627407,   0.365853658536585],
        [0.0475651189127973,   0.329268292682927],
        [0.183465458663647,    0.213414634146341],
        [0.190260475651189,    0.231707317073171],
        [0.197055492638732,    0.189024390243902],
        [0.211778029445074,    0.176829268292683],
        [0.221970554926387,    0.225609756097561],
        [0.232163080407701,    0.219512195121951],
        [0.237825594563986,    0.152439024390244],
        [0.243488108720272,    0.176829268292683],
        [0.249150622876557,    0.146341463414634],
        [0.7519818799547,      0.115853658536585],
        [0.758776896942242,    0.189024390243902],
        [0.782559456398641,    0.170731707317073],
        [0.797281993204983,    0.0975609756097561],
        [0.815402038505096,    0.0609756097560976],
        [0.893544733861835,    0.0731707317073171],
        [0.904869762174405,    0.823170731707317],
        [0.917327293318233,    1],
        [0.951302378255946,    0.402439024390244],
        [0.958097395243488,    0.420731707317073],
        [0.976217440543601,    0.0487804878048781],
        [0.983012457531144,    0.0853658536585366],
        [1,                    0]
    ],
    light_pts : [
        [0.815402038505096,    0.0609756097560976],
        [0.822197055492639,    0.390243902439024],
        [0.898074745186863,    0.719512195121951]
    ],
    sides : 8,
    scale_ratio : 0.2,
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(0.8, 0.8, 0.8, 1.0),
    specular : vec4(0.8, 0.8, 0.8, 1.0),
    shininess : 50,
    stand_position : vec4(0.0, 0.0, 0.0, 0.0),
    positions : [[-2.9,0,1.3], [-2.9,0,-1.3]]
}

function createLamppost() {
    var angle = 2.0 * Math.PI / LAMPPOST.sides;
    POINTCOUNT.lamppost = 0;

    // draw the lampstand
    for (var i=0; i < LAMPPOST.stand_pts.length - 1; i++) {
        var [h1, r1] = LAMPPOST.stand_pts[i];
        var [h2, r2] = LAMPPOST.stand_pts[i+1];
        for (var j = 0; j < LAMPPOST.sides; j++) {
            var p1 = cylindrical_to_rectangular(r1, j*angle, h1);
            var p2 = cylindrical_to_rectangular(r2, j*angle, h2);
            var p3 = cylindrical_to_rectangular(r2, (j+1)*angle, h2);
            var p4 = cylindrical_to_rectangular(r1, (j+1)*angle, h1);
            POINTCOUNT.lamppost += quadrilateral(p1, p2, p3, p4, COLORS.lampstand);
            //console.log("built for i=", i, "j=", j);
        }
    }

    // draw the light
    for (var i=0; i < LAMPPOST.light_pts.length -1; i++) {
        var [h1, r1] = LAMPPOST.light_pts[i];
        var [h2, r2] = LAMPPOST.light_pts[i+1];
        for (var j=0; j < LAMPPOST.sides; j++) {
            var p1 = cylindrical_to_rectangular(r1, j*angle, h1);
            var p2 = cylindrical_to_rectangular(r2, j*angle, h2);
            var p3 = cylindrical_to_rectangular(r2, (j+1)*angle, h2);
            var p4 = cylindrical_to_rectangular(r1, (j+1)*angle, h1);
            POINTCOUNT.lamppost += quadrilateral(p1, p2, p3, p4, COLORS.lamplight);
        }
    }
    
    return;
}


function drawLamppost(current_offset) {
    setLighting(LAMPPOST.ambient, LAMPPOST.diffuse, LAMPPOST.specular, LAMPPOST.shininess);
    gl.uniform1i(boolUseTexLoc, FALSE);

    var base_mm = scaleMatrix(LAMPPOST.scale_ratio, 1, LAMPPOST.scale_ratio);

    for (var i=0; i < LAMPPOST.positions.length; i++) {
        let [dx, dy, dz] = LAMPPOST.positions[i];
        modelMatrix = mult(translate(dx, dy, dz), base_mm);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.lamppost);
    }

    return POINTCOUNT.lamppost;
}


function createBush() {
    createFuzzySphere(COLORS.bush);
}

const BUSH = {
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(0.8, 0.8, 0.8, 1.0),
    specular : vec4(0.8, 0.8, 0.8, 1.0),
    shininess : 10,
    positions : [[1.5,0,-1.4], [-5.5,0,-1.4], [1.17,0,5.2], [-5.5,0,5.4]],
    scales    : [2,2.4,3,2.1]
};

function drawBush(current_offset) {
    setLighting(BUSH.ambient, BUSH.diffuse, BUSH.specular, BUSH.shininess);
    gl.uniform1i(boolUseTexLoc, FALSE);

    for (var i=0; i < BUSH.positions.length; i++) {
        let dx = BUSH.positions[i][0];
        let dy = BUSH.positions[i][1];
        let dz = BUSH.positions[i][2];
        let s  = BUSH.scales[i];

        modelMatrix = scaleMatrix(0.1*s,0.07*s,0.1*s);
        modelMatrix = mult(translate(2+dx,.1+dy,-2+dz), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        drawSphere(current_offset);
    
        modelMatrix = scaleMatrix(0.09*s,0.05*s,0.13*s);
        modelMatrix = mult(translate(2.1+dx,.1+dy,-2+dz), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        drawSphere(current_offset);
    
        modelMatrix = scaleMatrix(0.11*s,0.09*s,0.06*s);
        modelMatrix = mult(translate(2.1+dx,.1+dy,-2+dz), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        drawSphere(current_offset);
    
        modelMatrix = scaleMatrix(0.08*s,0.06*s,0.1*s);
        modelMatrix = mult(translate(2.1+dx,.1+dy,-2.2+dz), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        drawSphere(current_offset);
    }

    return POINTCOUNT.sphere; // returns
}

const CHECKER = { 
    num_sides : 16,
    radius    : 0.3/1.4,
    height    : .08,
    depression: 0.1,
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(1.9, 1.9, 1.9, 1.0),
    specular : vec4(4.8, 4.8, 4.8, 1.0),
    shininess : 50,
    positions : [[.78, -0.96,-2.85], [.26, -0.96,-2.85], [.26, -0.96+0.08,-2.85]]
}

function createChecker(color=COLORS.default) {
    //console.log("creating checker");
    POINTCOUNT.checkerside = 0;
    POINTCOUNT.checkerface = 0;
    
    var top_ring = [];
    var bottom_ring = [];
    var top_center    = vec4(0,  CHECKER.height*CHECKER.depression, 0, 1);
    var bottom_center = vec4(0, -CHECKER.height*CHECKER.depression, 0, 1);

    //make the two rings
    var delta_angle = (2*Math.PI)/CHECKER.num_sides;
    for (let i=0; i<=CHECKER.num_sides; i++) {
        let x = CHECKER.radius * Math.cos(i*delta_angle);
        let z = CHECKER.radius * Math.sin(i*delta_angle);
        top_ring.push(   vec4(x, CHECKER.height/2,z,1));
        bottom_ring.push(vec4(x,-CHECKER.height/2,z,1));
    }

    //console.log(top_ring);
    //console.log(bottom_ring);

    //make top
    for (let i=0; i<CHECKER.num_sides; i++) {
        POINTCOUNT.checkerface += triangle(top_center, top_ring[i], top_ring[i+1], color);
    }
    //make bottom
    for (let i=0; i<CHECKER.num_sides; i++) {
        triangle(bottom_center, bottom_ring[i+1], bottom_ring[i], color);
    }
    

    //make sides
    for (let i=0; i<CHECKER.num_sides; i++) {
        POINTCOUNT.checkerside += quadrilateral(top_ring[i], bottom_ring[i], bottom_ring[i+1], top_ring[i+1], color);
    }

    //console.log(POINTCOUNT.checkerface, "checkerface");
    //console.log(POINTCOUNT.checkerside, "checkerside");

    return;    
}

function drawChecker(current_offset,spin_angle=45) {
    //console.log("drawing checker");
    setLighting(CHECKER.ambient, CHECKER.diffuse, CHECKER.specular, CHECKER.shininess);
    gl.uniform1i(boolUseTexLoc, TRUE);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 6);

    for (var i=0; i < CHECKER.positions.length; i++) {
        let [dx, dy, dz] = CHECKER.positions[i];
        modelMatrix = mult(translate(1+dx,1+dy,1+dz), rotate(spin_angle, [1,0,0]));
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        //draw top
        gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.checkerface);
        //draw bottom
        gl.drawArrays(gl.TRIANGLES, current_offset + POINTCOUNT.checkerface, POINTCOUNT.checkerface);
        //draw sides
        gl.drawArrays(gl.TRIANGLES, current_offset + POINTCOUNT.checkerface*2, POINTCOUNT.checkerside);
    }

    gl.uniform1i(boolUseTexLoc, FALSE);

    return 2*POINTCOUNT.checkerface + POINTCOUNT.checkerside;
}

const AIRPLANE = {
    wing_points : [vec4(0,0,0,1), vec4(.1,.55,0,1), vec4(.3,.45,0,1), vec4(.275,.3,0,1)],
    crevice_points : [vec4(0,0,0,1), vec4(.1,.55,0,1), vec4(0,.5,.2,1)],
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(1.9, 1.9, 1.9, 1.0),
    specular : vec4(1, 1, 1, 1.0),
    shininess : 5,
    position : [-1.36,-0.05,-0.8],
    scalefactor : 1.5
}

function createAirplane() {
    POINTCOUNT.airplane = 0;
    // one wing
    POINTCOUNT.airplane += quadrilateral(AIRPLANE.wing_points[0], AIRPLANE.wing_points[1], AIRPLANE.wing_points[2], AIRPLANE.wing_points[3], COLORS.airplane);
    // center part
    POINTCOUNT.airplane += triangle(AIRPLANE.crevice_points[0], AIRPLANE.crevice_points[1], AIRPLANE.crevice_points[2], COLORS.airplane);
    return;
}

function drawAirplane(current_offset) {
    gl.uniform1i(boolUseTexLoc, TRUE);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 7);

    var mm = mult(scaleMatrix(AIRPLANE.scalefactor, AIRPLANE.scalefactor, AIRPLANE.scalefactor), rotate(40, [1,0,0]));
    mm = mult(translate(AIRPLANE.position[0], AIRPLANE.position[1], AIRPLANE.position[2]), mm);
    
    modelMatrix = mm;
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, current_offset, 6);
    gl.drawArrays(gl.TRIANGLES, current_offset+6, 3);

    modelMatrix = mult(mm, scaleMatrix(-1,1,1));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, current_offset, 6);
    gl.drawArrays(gl.TRIANGLES, current_offset+6, 3);

    return POINTCOUNT.airplane;
}


/* ==============================================
JEREMY'S OBJECTS
============================================== */

const MEEPLE = {
    body_points : [
        [0,    .104],
        [.003, .110],
        [.03, .126],
        [.07, .161],
        [.06, .197],
        [.05, .219],
        [.03, .238],
        [.045, .245],
        [.06, .246],
        [.08, .257],
        [.08, .266],
        [.08, .287],
        [.08, .294],
        [.08, .301],
        [.08, .328],
        [.07, .380],
        [.07, .410],
        [.08, .425],
        [.08, .433],
        [.08, .447],
        [.08, .465],
        [.08, .488],
        [.095, .512],
        [.097, .526],
        [.099, .525 ],
    ],
    scale_ratio : 1.5,
    rotate      : -180,
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(0.8, 0.8, 0.8, 1.0),
    specular : vec4(0.8, 0.8, 0.8, 1.0),
    shininess : 25
}

const TRASHCAN = {
    top_points : [
        vec4(0, 0, 0, 1),   // A(0)
        vec4(1, 0, 0, 1),   // B(1)
        vec4(1, 1, 0, 1),   // C(2)
        vec4(0.5, 1.5, 0, 1), // D(3)
        vec4(0, 1, 0, 1),    // E(4)
        vec4(0, 0, 1, 1),    // F(5)
        vec4(1, 0, 1, 1),    // G(6)
        vec4(1, 1, 1, 1),    // H(7)
        vec4(0.5, 1.5, 1, 1),  // I(8)
        vec4(0, 1, 1, 1)     // J(9)
    ],
    base_points : [
        vec4(-1,  1,  1, 1.0 ), // A (0)
        vec4( 1,  1,  1, 1.0 ), // B (1)
        vec4(-1, -1,  1, 1.0 ), // C (2)
        vec4( 1, -1,  1, 1.0 ), // D (3)
        vec4(-1,  1, -1, 1.0 ), // E (4)
        vec4( 1,  1, -1, 1.0 ), // F (5)
        vec4(-1, -1, -1, 1.0 ), // G (6)
        vec4( 1, -1, -1, 1.0 ), // H (7)
    ],
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(0.8, 0.8, 0.8, 1.0),
    specular : vec4(0.8, 0.8, 0.8, 1.0),
    shininess : 50
}

const HOURGLASS = {
    outer_part : [
    [0, .104],
	[.13, .104],
	[.13, .114],
	[.01, .114],
	[.01, .197],
	[.01, .219],
	[.01, .238],
	[.01, .245],
	[.01, .246],
	[.01, .257],
	[.01, .266],
	[.01, .287],
	[.01, .294],
	[.01, .301],
	[.01, .328],
	[.01, .380],
	[.01, .410],
	[.01, .425],
	[.01, .433],
	[.01, .447],
	[.01, .465],
	[.01, .532],
	[.13, .532],
	[.13, .542],
	[.0, .542],
    ],
    inner_part : [
        [0,   .114],
        [.09, .114],
        [.1, .133],
        [.09, .152],
        [.08, .171],
        [.07, .190],
        [.06, .209],
        [.05, .228],
        [.04, .247],
        [.03, .266],
        [.02, .285],
        [.012, .304],
        [.012, .323],
        [.012, .342],
        [.02, .361],
        [.03, .380],
        [.04, .399],
        [.05, .418],
        [.06, .437],
        [.07, .456 ],
        [.08, .475],
        [.09, .494],
        [.1, .513],
        [.09, .532],
        [0, .532],
    ],
    scale_ratio : 1.5,
    rotate      : -180,
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(0.8, 0.8, 0.8, 1.0),
    specular : vec4(0.8, 0.8, 0.8, 1.0),
    shininess : 50
}

const TOP = {
    topPart : [
    [0,  .114],
	[.01, .114],
	[.012, .133],
	[.013, .152],
	[.014, .171],
	[.015, .190],
	[.016, .209],
	[.017, .228],
	[.018, .247],
	[.019, .266],
	[.02, .285],
	[.021, .304],
	[.02, .323],
	[.11, .342],
	[.1, .361],
	[.09, .380],
	[.08, .399],
	[.07, .418],
	[.06, .437],
	[.05, .456],
	[.04, .475],
	[.03, .494],
	[.02, .513],
	[.01, .532],
	[0, .532],
    ],
    scale_ratio : 1.5,
    rotate      : -180,
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(0.8, 0.8, 0.8, 1.0),
    specular : vec4(0.8, 0.8, 0.8, 1.0),
    shininess : 50
}

const CRAYON = {
    crayon : [
    [0.0,   .114],
	[.013, .114],
	[.013, .133],
	[.013, .152],
	[.013, .171],
	[.013, .190],
	[.013, .209],
	[.013, .228],
	[.013, .247],
	[.013, .266],
	[.013, .285],
	[.013, .304],
	[.013, .323],
	[.013, .342],
	[.013, .361],
	[.013, .380],
	[.013, .399],
	[.013, .418],
	[.013, .437],
	[.013, .456],
	[.013, .475],
	[.013, .494],
	[.009, .513],
	[.001, .532],
	[0, .532,],
    ],
    scale_ratio : 2.5,
    rotate      : -180,
    ambient : vec4(0.2, 0.2, 0.2, 1.0),
    diffuse : vec4(0.8, 0.8, 0.8, 1.0),
    specular : vec4(0.8, 0.8, 0.8, 1.0),
    shininess : 25
}
function createMeeple() {
    var meepleBodyPoints = MEEPLE.body_points;
    POINTCOUNT.meepleBody = 0;
    var vertices = [];

    // Setup initial points matrix (2D profile)
    for (var i = 0; i < 25; i++) {
        vertices.push(vec4(meepleBodyPoints[i][0], meepleBodyPoints[i][1], 0, 1));
    }

    var r;
    var t = Math.PI / 12;

    // Generate additional vertices by rotating the 2D profile
    for (var j = 0; j < 24; j++) {
        var angle = (j + 1) * t;
        for (var i = 0; i < 25; i++) {
            r = vertices[i][0];
            vertices.push(vec4(r * Math.cos(angle), vertices[i][1], -r * Math.sin(angle), 1));
        }
    }

    var N = 25; // number of points in one slice

    // Create quadrilaterals using the vertices
    for (var i = 0; i < 24; i++) { // slices
        for (var j = 0; j < 24; j++) { // layers
            POINTCOUNT.meepleBody += quadrilateral(
                vertices[i * N + j],
                vertices[(i + 1) * N + j],
                vertices[(i + 1) * N + (j + 1)],
                vertices[i * N + (j + 1)],
                COLORS.meeple
            );
        }
    }
}

function drawMeeple(current_offset){
    // Start with the rotation matrix
    var rotationMatrix = rotate(MEEPLE.rotate, [0, 0, 1]); // Assuming rotation around the Y-axis

    // Apply scaling
    var scalingMatrix = scaleMatrix(MEEPLE.scale_ratio, MEEPLE.scale_ratio, MEEPLE.scale_ratio);

    // Apply translation
    var translationMatrix = translate(0, .75, 2);

    // Set the model matrix in the shader
    setLighting(MEEPLE.ambient, MEEPLE.diffuse, MEEPLE.specular, MEEPLE.shininess);
    // Combine the transformations: First scale, then rotate, then translate
    modelMatrix = mult(translationMatrix, mult(rotationMatrix, scalingMatrix));
    
   
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    

    gl.uniform1i(boolUseTexLoc, TRUE);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);
    // Draw the meeple body
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.meepleBody);

    // Return the number of points drawn
    return POINTCOUNT.meepleBody;
}

// generates the points for the top of the trashcan 
function createTrashTop(color=COLORS.default)
{
    POINTCOUNT.trashcan = 0;
    POINTCOUNT.trashcan += quadrilateral(TRASHCAN.top_points[0], TRASHCAN.top_points[5], TRASHCAN.top_points[9], TRASHCAN.top_points[4], color);   // AFJE left side
    POINTCOUNT.trashcan += quadrilateral(TRASHCAN.top_points[3], TRASHCAN.top_points[4], TRASHCAN.top_points[9], TRASHCAN.top_points[8], color);   // DEJI left roof
    POINTCOUNT.trashcan += quadrilateral(TRASHCAN.top_points[2], TRASHCAN.top_points[3], TRASHCAN.top_points[8], TRASHCAN.top_points[7], color);
    POINTCOUNT.trashcan += quadrilateral(TRASHCAN.top_points[1], TRASHCAN.top_points[2], TRASHCAN.top_points[7], TRASHCAN.top_points[6], color);
    POINTCOUNT.trashcan += quadrilateral(TRASHCAN.top_points[0], TRASHCAN.top_points[1], TRASHCAN.top_points[6], TRASHCAN.top_points[5], color);
    POINTCOUNT.trashcan += pentagon (TRASHCAN.top_points[5], TRASHCAN.top_points[6], TRASHCAN.top_points[7], TRASHCAN.top_points[8], TRASHCAN.top_points[9], color);  // FGHIJ back
    POINTCOUNT.trashcan += pentagon (TRASHCAN.top_points[0], TRASHCAN.top_points[4], TRASHCAN.top_points[3], TRASHCAN.top_points[2], TRASHCAN.top_points[1], color);  // ABCDE (clockwise) front
}

// generates the points for the base of the trashcan and stores the point count
function createTrashBase(color=COLORS.default){
    POINTCOUNT.trashbottom = 0;
    POINTCOUNT.trashbottom += quadrilateral( TRASHCAN.base_points[0], TRASHCAN.base_points[1], TRASHCAN.base_points[3], TRASHCAN.base_points[2], color); // front(ABDC)
    POINTCOUNT.trashbottom += quadrilateral( TRASHCAN.base_points[4], TRASHCAN.base_points[5], TRASHCAN.base_points[7], TRASHCAN.base_points[6], color); // back(EFHG)
    POINTCOUNT.trashbottom += quadrilateral( TRASHCAN.base_points[3], TRASHCAN.base_points[1], TRASHCAN.base_points[5], TRASHCAN.base_points[7], color); // right (DBFH)
    POINTCOUNT.trashbottom += quadrilateral( TRASHCAN.base_points[6], TRASHCAN.base_points[2], TRASHCAN.base_points[0], TRASHCAN.base_points[4], color); // left (GCAE)
    POINTCOUNT.trashbottom += quadrilateral( TRASHCAN.base_points[2], TRASHCAN.base_points[6], TRASHCAN.base_points[7], TRASHCAN.base_points[3], color); // bottom (CGHD)
    POINTCOUNT.trashbottom += quadrilateral( TRASHCAN.base_points[5], TRASHCAN.base_points[4], TRASHCAN.base_points[0], TRASHCAN.base_points[1], color); // top (AEFB)
}

// draws the base of the trashcan
function drawTrashBase(current_offset){
    
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.trashbottom);
    //return POINTCOUNT.trashbottom;
}

// draws the top of the trashcan
function drawTrashTop(current_offset){
    
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.trashcan);
    //return POINTCOUNT.trashcan;
}

// draws the whole trashcan
function drawTrashCan(current_offset){
    gl.uniform1i(boolUseTexLoc, TRUE);
    setLighting(TRASHCAN.ambient, TRASHCAN.diffuse, TRASHCAN.specular, TRASHCAN.shininess);
   
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 3);
    modelMatrix = scaleMatrix(0.15,0.1,0.15);
    modelMatrix = mult(translate(-2,.1,2), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    drawTrashBase(current_offset);
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 2);
    modelMatrix = scaleMatrix(0.3,0.15,0.3);
    modelMatrix = mult(translate(-2.15,.2,1.85), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    drawTrashTop(current_offset+POINTCOUNT.trashbottom);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 3);
    modelMatrix = scaleMatrix(0.15,0.1,0.15);
    modelMatrix = mult(translate(1.55,.1,2), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    drawTrashBase(current_offset);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 2);
    modelMatrix = scaleMatrix(0.3,0.15,0.3);
    modelMatrix = mult(translate(1.4,.2,1.85), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    drawTrashTop(current_offset+POINTCOUNT.trashbottom);
    return POINTCOUNT.trashbottom+POINTCOUNT.trashcan;
}

function createHourGlasss(){
    var outerHourGlassPoints = HOURGLASS.outer_part;
    var innerHourGlassPoints = HOURGLASS.inner_part;
    
    POINTCOUNT.hourGlass = 0;
    POINTCOUNT.rods = 0;
    var hourGlassVertices = [];
    var inner_partVertices = [];
    

    // Setup initial points matrix (2D profile)
    for (var i = 0; i < 25; i++) {
        hourGlassVertices.push(vec4(outerHourGlassPoints[i][0], outerHourGlassPoints[i][1], 0, 1));
    }

    var r;
    var t = Math.PI / 12;

    // Generate additional vertices by rotating the 2D profile
    for (var j = 0; j < 24; j++) {
        var angle = (j + 1) * t;
        for (var i = 0; i < 25; i++) {
            r = hourGlassVertices[i][0];
            hourGlassVertices.push(vec4(r * Math.cos(angle), hourGlassVertices[i][1], -r * Math.sin(angle), 1));
        }
    }

    var N = 25; // number of points in one slice

    // Create quadrilaterals using the vertices
    for (var i = 0; i < 24; i++) { // slices
        for (var j = 0; j < 24; j++) { // layers
            POINTCOUNT.hourGlass += quadrilateral(
                hourGlassVertices[i * N + j],
                hourGlassVertices[(i + 1) * N + j],
                hourGlassVertices[(i + 1) * N + (j + 1)],
                hourGlassVertices[i * N + (j + 1)],
                COLORS.dark_wood
            );
        }
    }
    
    for (var i = 0; i < 25; i++) {
        inner_partVertices.push(vec4(innerHourGlassPoints[i][0], innerHourGlassPoints[i][1], 0, 1));
    }

    // Generate additional vertices by rotating the 2D profile
    for (var j = 0; j < 24; j++) {
        var angle = (j + 1) * t;
        for (var i = 0; i < 25; i++) {
            r = inner_partVertices[i][0];
            inner_partVertices.push(vec4(r * Math.cos(angle), inner_partVertices[i][1], -r * Math.sin(angle), 1));
        }
    }

    // Create quadrilaterals using the vertices
    for (var i = 0; i < 24; i++) { // slices
        for (var j = 0; j < 24; j++) { // layers
            POINTCOUNT.hourGlass += quadrilateral(
                inner_partVertices[i * N + j],
                inner_partVertices[(i + 1) * N + j],
                inner_partVertices[(i + 1) * N + (j + 1)],
                inner_partVertices[i * N + (j + 1)],
                COLORS.hour_glass
            );
        }
    }
}

function drawHourGlass(current_offset){
    gl.uniform1i(boolUseTexLoc, FALSE);
    setLighting(HOURGLASS.ambient, HOURGLASS.diffuse, HOURGLASS.specular, HOURGLASS.shininess);
    
    var rotationMatrix = rotate(HOURGLASS.rotate, [0, 0, 1]); // Assuming rotation around the Y-axis

    // Apply scaling
    var scalingMatrix = scaleMatrix(HOURGLASS.scale_ratio, HOURGLASS.scale_ratio, HOURGLASS.scale_ratio);

    // Apply translation
    var translationMatrix = translate(-2.6, .83, -2);

    modelMatrix = mult(translationMatrix, mult(rotationMatrix, scalingMatrix));
    
   
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));


    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.hourGlass);

    return POINTCOUNT.hourGlass;
}

function createMeepleTwo() {
    var meepleBodyPoints = MEEPLE.body_points;
    POINTCOUNT.meepleBodyTwo = 0;
    var vertices = [];

    // Setup initial points matrix (2D profile)
    for (var i = 0; i < 25; i++) {
        vertices.push(vec4(meepleBodyPoints[i][0], meepleBodyPoints[i][1], 0, 1));
    }

    var r;
    var t = Math.PI / 12;

    // Generate additional vertices by rotating the 2D profile
    for (var j = 0; j < 24; j++) {
        var angle = (j + 1) * t;
        for (var i = 0; i < 25; i++) {
            r = vertices[i][0];
            vertices.push(vec4(r * Math.cos(angle), vertices[i][1], -r * Math.sin(angle), 1));
        }
    }

    var N = 25; // number of points in one slice

    // Create quadrilaterals using the vertices
    for (var i = 0; i < 24; i++) { // slices
        for (var j = 0; j < 24; j++) { // layers
            POINTCOUNT.meepleBodyTwo += quadrilateral(
                vertices[i * N + j],
                vertices[(i + 1) * N + j],
                vertices[(i + 1) * N + (j + 1)],
                vertices[i * N + (j + 1)],
                COLORS.meeple_two
            );
        }
    }
}

function drawMeepleTwo(current_offset){
    gl.uniform1i(boolUseTexLoc, TRUE);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 5);
     
    // Start with the rotation matrix
    var rotationMatrix = rotate(MEEPLE.rotate, [0, 0, 1]); // Assuming rotation around the Y-axis

    // Apply scaling
    var scalingMatrix = scaleMatrix(MEEPLE.scale_ratio, MEEPLE.scale_ratio, MEEPLE.scale_ratio);

    // Apply translation
    var translationMatrix = translate(-1, .75, -2);

    // Set the model matrix in the shader
    setLighting(MEEPLE.ambient, MEEPLE.diffuse, MEEPLE.specular, MEEPLE.shininess);
    // Combine the transformations: First scale, then rotate, then translate
    modelMatrix = mult(translationMatrix, mult(rotationMatrix, scalingMatrix));
    
   
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // Draw the meeple body
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.meepleBodyTwo);

    // Return the number of points drawn
    return POINTCOUNT.meepleBodyTwo;
}

function createTop(){
    var topPoints = TOP.topPart;
    POINTCOUNT.top_points = 0;
    var vertices = [];

    // Setup initial points matrix (2D profile)
    for (var i = 0; i < 25; i++) {
        vertices.push(vec4(topPoints[i][0], topPoints[i][1], 0, 1));
    }

    var r;
    var t = Math.PI / 12;

    // Generate additional vertices by rotating the 2D profile
    for (var j = 0; j < 24; j++) {
        var angle = (j + 1) * t;
        for (var i = 0; i < 25; i++) {
            r = vertices[i][0];
            vertices.push(vec4(r * Math.cos(angle), vertices[i][1], -r * Math.sin(angle), 1));
        }
    }

    var N = 25; // number of points in one slice

    // Create quadrilaterals using the vertices
    for (var i = 0; i < 24; i++) { // slices
        for (var j = 0; j < 24; j++) { // layers
            POINTCOUNT.top_points += quadrilateral(
                vertices[i * N + j],
                vertices[(i + 1) * N + j],
                vertices[(i + 1) * N + (j + 1)],
                vertices[i * N + (j + 1)],
                COLORS.top_stone
            );
        }
    }
}

function drawTop(current_offset){
    gl.uniform1i(boolUseTexLoc, FALSE);
    // Start with the rotation matrix
    var rotationMatrix = rotate(TOP.rotate, [0, 0, 1]); // Assuming rotation around the Y-axis

    // Apply scaling
    var scalingMatrix = scaleMatrix(TOP.scale_ratio, TOP.scale_ratio, TOP.scale_ratio);

    // Apply translation
    var translationMatrix = translate(-2.5, .83, -1);

    // Set the model matrix in the shader
    setLighting(TOP.ambient, TOP.diffuse, TOP.specular, TOP.shininess);
    // Combine the transformations: First scale, then rotate, then translate
    modelMatrix = mult(translationMatrix, mult(rotationMatrix, scalingMatrix));
    
   
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // Draw the meeple body
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.top_points);

    // Return the number of points drawn
    return POINTCOUNT.top_points;

}

function createCrayons(){
    createCrayonOne();
    createCrayonTwo();
    createCrayonThree();
}

function drawCrayons(current_offset){
    current_offset += drawCrayonOne(current_offset);
    current_offset += drawCrayonTwo(current_offset);
    current_offset += drawCrayonThree(current_offset);

    return 3*POINTCOUNT.crayon_one;
}

function createCrayonOne(){
    var crayonPoints = CRAYON.crayon;
    POINTCOUNT.crayon_one = 0;
    var vertices = [];

    // Setup initial points matrix (2D profile)
    for (var i = 0; i < 25; i++) {
        vertices.push(vec4(crayonPoints[i][0], crayonPoints[i][1], 0, 1));
    }

    var r;
    var t = Math.PI / 12;

    // Generate additional vertices by rotating the 2D profile
    for (var j = 0; j < 24; j++) {
        var angle = (j + 1) * t;
        for (var i = 0; i < 25; i++) {
            r = vertices[i][0];
            vertices.push(vec4(r * Math.cos(angle), vertices[i][1], -r * Math.sin(angle), 1));
        }
    }

    var N = 25; // number of points in one slice

    // Create quadrilaterals using the vertices
    for (var i = 0; i < 24; i++) { // slices
        for (var j = 0; j < 24; j++) { // layers
            POINTCOUNT.crayon_one += quadrilateral(
                vertices[i * N + j],
                vertices[(i + 1) * N + j],
                vertices[(i + 1) * N + (j + 1)],
                vertices[i * N + (j + 1)],
                COLORS.crayon_1
            );
        }
    }

}

function createCrayonTwo(){
    var crayonPoints = CRAYON.crayon;
    POINTCOUNT.crayon_two = 0;
    var vertices = [];

    // Setup initial points matrix (2D profile)
    for (var i = 0; i < 25; i++) {
        vertices.push(vec4(crayonPoints[i][0], crayonPoints[i][1], 0, 1));
    }

    var r;
    var t = Math.PI / 12;

    // Generate additional vertices by rotating the 2D profile
    for (var j = 0; j < 24; j++) {
        var angle = (j + 1) * t;
        for (var i = 0; i < 25; i++) {
            r = vertices[i][0];
            vertices.push(vec4(r * Math.cos(angle), vertices[i][1], -r * Math.sin(angle), 1));
        }
    }

    var N = 25; // number of points in one slice

    // Create quadrilaterals using the vertices
    for (var i = 0; i < 24; i++) { // slices
        for (var j = 0; j < 24; j++) { // layers
            POINTCOUNT.crayon_two += quadrilateral(
                vertices[i * N + j],
                vertices[(i + 1) * N + j],
                vertices[(i + 1) * N + (j + 1)],
                vertices[i * N + (j + 1)],
                COLORS.crayon_2
            );
        }
    }

}

function createCrayonThree(){
    var crayonPoints = CRAYON.crayon;
    POINTCOUNT.crayon_three = 0;
    var vertices = [];

    // Setup initial points matrix (2D profile)
    for (var i = 0; i < 25; i++) {
        vertices.push(vec4(crayonPoints[i][0], crayonPoints[i][1], 0, 1));
    }

    var r;
    var t = Math.PI / 12;

    // Generate additional vertices by rotating the 2D profile
    for (var j = 0; j < 24; j++) {
        var angle = (j + 1) * t;
        for (var i = 0; i < 25; i++) {
            r = vertices[i][0];
            vertices.push(vec4(r * Math.cos(angle), vertices[i][1], -r * Math.sin(angle), 1));
        }
    }

    var N = 25; // number of points in one slice

    // Create quadrilaterals using the vertices
    for (var i = 0; i < 24; i++) { // slices
        for (var j = 0; j < 24; j++) { // layers
            POINTCOUNT.crayon_three += quadrilateral(
                vertices[i * N + j],
                vertices[(i + 1) * N + j],
                vertices[(i + 1) * N + (j + 1)],
                vertices[i * N + (j + 1)],
                COLORS.crayon_3
            );
        }
    }

}

function drawCrayonOne(current_offset){

    gl.uniform1i(boolUseTexLoc, FALSE);
    // Start with the rotation matrix
    var rotationMatrix = rotate(CRAYON.rotate+90, [0, 0, 1]); // Assuming rotation around the Y-axis

    // Apply scaling
    var scalingMatrix = scaleMatrix(CRAYON.scale_ratio, CRAYON.scale_ratio, CRAYON.scale_ratio);

    // Apply translation
    var translationMatrix = translate(0.2, .01, 0.5);

    // Set the model matrix in the shader
    setLighting(CRAYON.ambient, CRAYON.diffuse, CRAYON.specular, CRAYON.shininess);
    // Combine the transformations: First scale, then rotate, then translate
    modelMatrix = mult(translationMatrix, mult(rotationMatrix, scalingMatrix));
    
   
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // Draw the meeple body
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.top_points);

    // Return the number of points drawn
    return POINTCOUNT.crayon_one;

}

function drawCrayonTwo(current_offset){

    gl.uniform1i(boolUseTexLoc, FALSE);
    // Start with the rotation matrix
    var rotationMatrix = rotate(CRAYON.rotate+90, [1, 0, 1]); // Assuming rotation around the Y-axis

    // Apply scaling
    var scalingMatrix = scaleMatrix(CRAYON.scale_ratio, CRAYON.scale_ratio, CRAYON.scale_ratio);

    // Apply translation
    var translationMatrix = translate(0.26, .01, .018);

    // Set the model matrix in the shader
    setLighting(CRAYON.ambient, CRAYON.diffuse, CRAYON.specular, CRAYON.shininess);
    // Combine the transformations: First scale, then rotate, then translate
    modelMatrix = mult(translationMatrix, mult(rotationMatrix, scalingMatrix));
    
   
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // Draw the meeple body
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.top_points);

    // Return the number of points drawn
    return POINTCOUNT.crayon_two;

}

function drawCrayonThree(current_offset){

    gl.uniform1i(boolUseTexLoc, FALSE);
    // Start with the rotation matrix
    var rotationMatrix = rotate(CRAYON.rotate-90, [1, 0, 1]); // Assuming rotation around the Y-axis

    // Apply scaling
    var scalingMatrix = scaleMatrix(CRAYON.scale_ratio, CRAYON.scale_ratio, CRAYON.scale_ratio);

    // Apply translation
    var translationMatrix = translate(0.03, .01, 0.09);

    // Set the model matrix in the shader
    setLighting(CRAYON.ambient, CRAYON.diffuse, CRAYON.specular, CRAYON.shininess);
    // Combine the transformations: First scale, then rotate, then translate
    modelMatrix = mult(translationMatrix, mult(rotationMatrix, scalingMatrix));
    
   
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // Draw the meeple body
    gl.drawArrays(gl.TRIANGLES, current_offset, POINTCOUNT.top_points);

    // Return the number of points drawn
    return POINTCOUNT.crayon_three;

}