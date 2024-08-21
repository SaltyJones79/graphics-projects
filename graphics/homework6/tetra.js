/*
Programmer: Jeremy Saltz
This program draws a tetrahedron with four texures and can be moves by 
the user with the mouse. The user can zoom in and out with the wheel, spin it 
with the left button and drag it with the right button. 
 */

//vars for the program
var canvas, gl;
var program;
var image;
var numVertices = 12;
var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];
var textures = [];
var textureUniformLocations = []; //to store texture locations
//array of textures
var imageSources = ["baby_Ada.jpg", "Al_Cat.jpg", "me.jpg", "baby_Grace.jpg"];
// Define an array for texture indices
var texIndicesArray = [];
// Variables that control the orthographic projection bounds.
var y_max = 5;
var y_min = -5;
var x_max = 8;
var x_min = -8;
var near = -50;
var far = 50;

//texture coordinates
var texCoord = [vec2(0, 0), vec2(0, 1), vec2(1, 1), vec2(1, 0)];

//function to store tex
function initTextures() {
  for (let i = 0; i < imageSources.length; i++) {
    let texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function () {
      loadTexture(texture, i);
    };
    texture.image.src = imageSources[i];
    textures.push(texture);
  }
}

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var vertices = [
  vec4(-0.5, -0.5, -0.5, 1.0), // A (0)
  vec4(-0.5, 0.5, 0.5, 1.0), // B (1)
  vec4(0.5, -0.5, 0.5, 1.0), // C (2)
  vec4(0.5, 0.5, -0.5, 1.0), // D (3)
];

var vertexColors = [
  vec4(1.0, 0.0, 0.0, 1.0), // red (0 front)
  vec4(0.8, 0.8, 0.2, 1.0), // yellowish-green (1)
  vec4(0.0, 1.0, 0.0, 1.0), // green (2)
  vec4(0.0, 0.0, 1.0, 1.0), // blue (3 right)
  vec4(1.0, 0.0, 1.0, 1.0), // magenta (4)
  vec4(0.0, 1.0, 1.0, 1.0), // cyan (5 top)
  vec4(1.0, 1.0, 0.0, 1.0), // yellow (6 left)
];

function tetra(a, b, c, texIndex) {
    var indices = [a, b, c];
    for (var i = 0; i < indices.length; i++) {
        pointsArray.push(vertices[indices[i]]);
        colorsArray.push(vertexColors[indices[i]]);
        texCoordsArray.push(texCoord[i]); // This will use the first three texture coordinates (0, 1, 2)
        texIndicesArray.push(texIndex); // Ensure that texIndex is correct for each face
    }
}

// Each face is formed with two triangles
function colorTetra() {
  tetra(0, 1, 2, 0); // Triangle ABC, texture index 0
  tetra(0, 1, 3, 1); // Triangle ABD, texture index 1
  tetra(0, 2, 3, 2); // Triangle ACD, texture index 2
  tetra(1, 2, 3, 3); // Triangle BCD, texture index 3
}

// namespace contain all the project information
var AllInfo = {
  // Camera pan control variables.
  zoomFactor: 8,
  translateX: 0,
  translateY: 0,

  // Camera rotate control variables.
  phi: 1,
  theta: 0.5,
  radius: 1,
  dr: (2.0 * Math.PI) / 180.0,

  // Mouse control variables
  mouseDownRight: false,
  mouseDownLeft: false,

  mousePosOnClickX: 0,
  mousePosOnClickY: 0,
};

//window on load function for loading the project
window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Get the uniform locations for the texture samplers after the program is linked
  for (var i = 0; i < imageSources.length; i++) {
    textureUniformLocations[i] = gl.getUniformLocation(program, "texture" + i);
  }
  
  colorTetra(); // created the color cube - point positions and face colors

  // Initialize all the buffers
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  var texIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texIndexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(texIndicesArray),
    gl.STATIC_DRAW
  );

  var aTexIndex = gl.getAttribLocation(program, "aTexIndex");
  gl.enableVertexAttribArray(aTexIndex);
  gl.vertexAttribPointer(aTexIndex, 1, gl.FLOAT, false, 0, 0);

  // ==============  Establish Textures =================
  initTextures();

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  // Set the position of the eye
  document.getElementById("eyeValue").onclick = function () {
    eyeX = document.parameterForm.xValue.value;
    eyeY = document.parameterForm.yValue.value;
    eyeZ = document.parameterForm.zValue.value;
    render();
  };

  // These four just set the handlers for the buttons.
  document.getElementById("thetaup").addEventListener("click", function (e) {
    AllInfo.theta += AllInfo.dr;
    render();
  });
  document.getElementById("thetadown").addEventListener("click", function (e) {
    AllInfo.theta -= AllInfo.dr;
    render();
  });
  document.getElementById("phiup").addEventListener("click", function (e) {
    AllInfo.phi += AllInfo.dr;
    render();
  });
  document.getElementById("phidown").addEventListener("click", function (e) {
    AllInfo.phi -= AllInfo.dr;
    render();
  });

  // Set the scroll wheel to change the zoom factor.
  // wheelDelta returns an integer value indicating the distance that the mouse wheel rolled.
  // Negative values mean the mouse wheel rolled down. The returned value is always a multiple of 120.
  document.getElementById("gl-canvas").addEventListener("wheel", function (e) {
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
  document
    .getElementById("gl-canvas")
    .addEventListener("mousedown", function (e) {
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

  document.addEventListener("mouseup", function (e) {
    AllInfo.mouseDownLeft = false;
    AllInfo.mouseDownRight = false;
    render();
  });

  document.addEventListener("mousemove", function (e) {
    if (AllInfo.mouseDownRight) {
      AllInfo.translateX += (e.x - AllInfo.mousePosOnClickX) / 30;
      AllInfo.mousePosOnClickX = e.x;

      AllInfo.translateY -= (e.y - AllInfo.mousePosOnClickY) / 30;
      AllInfo.mousePosOnClickY = e.y;
    } else if (AllInfo.mouseDownLeft) {
      AllInfo.phi += (e.x - AllInfo.mousePosOnClickX) / 100;
      AllInfo.mousePosOnClickX = e.x;

      AllInfo.theta += (e.y - AllInfo.mousePosOnClickY) / 100;
      AllInfo.mousePosOnClickY = e.y;
    }
    render();
  });

  render();
};

//fucntion to load the textures to the buffer
function loadTexture(texture, index) {
  console.log("Loading texture at index: ", index);
  gl.activeTexture(gl.TEXTURE0 + index);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    texture.image
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);
var eye = vec3(2, 2, 2);

var eyeX = 0.5,
  eyeY = 0.5,
  eyeZ = 0.5; // default eye position input values

var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Set the projection and model-view matrices
  projectionMatrix = ortho(
    x_min * AllInfo.zoomFactor - AllInfo.translateX,
    x_max * AllInfo.zoomFactor - AllInfo.translateX,
    y_min * AllInfo.zoomFactor - AllInfo.translateY,
    y_max * AllInfo.zoomFactor - AllInfo.translateY,
    near,
    far
  );
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

  eye = vec3(
    AllInfo.radius * Math.sin(AllInfo.theta) * Math.cos(AllInfo.phi),
    AllInfo.radius * Math.sin(AllInfo.theta) * Math.sin(AllInfo.phi),
    AllInfo.radius * Math.cos(AllInfo.theta)
  );
  modelViewMatrix = lookAt(eye, at, up);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  for (var i = 0; i < numVertices; i += 3) {
    var texIndex = texIndicesArray[i]; // Use the first vertex of each face to get the texture index

    // Activate the texture unit and bind the texture
    gl.activeTexture(gl.TEXTURE0 + texIndex);
    gl.bindTexture(gl.TEXTURE_2D, textures[texIndex]);
    gl.uniform1i(textureUniformLocations[texIndex], texIndex);

    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, i, 3);
}
};
