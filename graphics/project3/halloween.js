/*
Programmer: Jeremy Saltz
This program draws a Halloween scene with a sky, ground, stars,
a planet, several different objects, and a ghost. The objects are
space rocks, space trees, and hockey masks. The program creates depth
by rendering the objects in the scene in a certain order. First the 
sky goes up, then the ground, then the stars, then the objects, and planet.
After that the ghost, and bow and arrow are rendered. After the scene has
rendered, the user can press 's' or 'S' to call a ghost. The ghost will 
render in the top half of the scene. The user can also turn the bow and 
arrow left with 'l', 'L', or the left arrow key and right with the 'r', 'R',
and the right arrow key. The user can also press the 'f' or 'F' key and the
arrow will fire. After the arrow has shot off the scene it will be rendered 
back on the bow in the position and the ghost will disappear.
*/

// variables for the matrix modeling.
var modelViewMatrix;
var modelViewMatrixLoc;
var projectionMatrix;
var projectionMatrixLoc;
var modelViewStack = [];
var canvas;
// variables for the the different objects points and colors
var points = [];
var colors = [];

const NUM_STARS = 44; // number of stars set to my age
var starLocations = []; // Array to hold random star locations

// block of starting point global vars for tracking the objects location
//in the array
var starStartPoint = 0;
var objPointsLength = 0;
var objStartIndex = 0;
var ghostStartPoint = 0;
var objPointsLength2 = 0;
var objStartIndex2 = 0;
var maskStartPoint = 0;
let bowStartPoint = 0;
let arrowStartPoint = 0;

//colors for the planets rings
var ringColors = [
  vec4(1.0, 0.0, 0.0, 1.0), // Red
  vec4(0.0, 1.0, 0.0, 1.0), // Green
  vec4(0.0, 0.0, 1.0, 1.0), // Blue
  vec4(1.0, 0.0, 1.0, 1.0), // Pink
];

//some color constants for the objects
const arrowColor = vec4(0.58, 0.13, 0.45, 1.0);
const bowColor = vec4(1.0, 0.0, 0.0, 1.0);
const maskColor = vec4(1.0, 1.0, 1.0, 1.0); // White color for the mask
const eyeColor = vec4(0.0, 0.0, 0.0, 1.0); // Black color for the eyes

var ghostState = 0;
var ghostX, ghostY;
var bowRotationAngle = 0;
// Global variables for the arrow's state and position
var arrowState = 'ready'; // 'ready', 'firing', or 'resetting'
var arrowPosition = vec2(0.0,-5.5); // Initial position, aligned with the bow
var arrowSpeed = 0.1; // Speed of the arrow
var arrowDirection; // Initial direction of the arrow 
var Ratio = 1.618; // ratio used for canvas and for world window

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  // Generate all the points for the scene in order
  SkyAndGroundPoints(); // creates sky and ground points
  GenerateBackCircles(); // rings for planet
  GenerateCircle(); //planet
  GenerateFrontCircles(); //rings
  GenerateObject(); //space rocks
  GenerateObject2(); //space twees
  GenerateSimpleStar(); //stars like I use to draw when I was a kid in the 80's
  generateStarLocations(); //store the star location
  GenerateGhost(); //BOO!! IT'S A GHOST
  GenerateHockeyMask(); //scary masks coming at you!
  generateBow(); //time to hunt
  generateArrow(); //if you have a bow you need an arrow

  //sets the view area
  modelViewMatrix = mat4();
  projectionMatrix = ortho(-8, 8, -8, 8, -1, 1);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 0.2, 0.5, 1.0);

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  document.addEventListener("keydown", function (event) {
    //event for the 's' and 'S' keydown
    if (event.key === "s" || event.key === "S") {
      //change the ghost state to 1
      if (ghostState === 0) {
        // Generate a random X and Y position for the ghost only when the ghost is spawned
        ghostX = Math.random() * 16 - 8; // This will give you a range from -8 to 8
        ghostY = Math.random() * 8; // This will give you a range from 0 to 8
        ghostState = 1;
      } else {
        //so the ghost can move location
        ghostState = 0;
      }
      render(); // Call the render function to redraw the scene with the updated ghost state
    } else if (
      //for the 'l' and 'L' events to turn the bow and arrow
      event.key === "l" ||
      event.key === "L" ||
      event.key === "ArrowLeft"
    ) {
      // Rotate the bow to the left
      bowRotationAngle += 5; // Adjust this value as needed for the desired rotation speed
      render(); // Re-render the scene with the updated bow angle
    } else if (
      //for the 'r' and 'R' events to turn the bow and arrow
      event.key === "r" ||
      event.key === "R" ||
      event.key === "ArrowRight"
    ) {
      // Rotate the bow to the right
      bowRotationAngle -= 5; // Adjust this value as needed for the desired rotation speed
      render(); // Re-render the scene with the updated bow angle
    } else if (event.key === 'f' || event.key === 'F') {
      //fire arrow function
      fireArrow();
  }
  });

  render();
};

//scale function
function scale4(a, b, c) {
  var result = mat4();
  result[0][0] = a;
  result[1][1] = b;
  result[2][2] = c;
  return result;
}

//function to draw the sky and the ground
function SkyAndGroundPoints() {
  // Sky vertices
  points.push(vec2(-8, 8), vec2(8, 8), vec2(8, -1.7), vec2(-8, -1.7));

  colors.push(vec4(0.2, 0.1, 0.6, 1.0)); //darker purple
  colors.push(vec4(0.2, 0.1, 0.6, 1.0));
  colors.push(vec4(0.53, 0.2, 0.8, 1.0)); // lighter purple
  colors.push(vec4(0.53, 0.2, 0.8, 1.0));

  // Ground vertices
  points.push(vec2(-8, -1.7), vec2(8, -1.7), vec2(8, -8), vec2(-8, -8));

  colors.push(vec4(0.03, 0.25, 0.3, 1.0)); //dark teal
  colors.push(vec4(0.03, 0.25, 0.3, 1.0));
  colors.push(vec4(0.23, 0.5, 0.6, 1.0)); //lighter teal
  colors.push(vec4(0.23, 0.5, 0.6, 1.0));
}

//function to generate rings
function GenerateBackCircles() {
  var radii = [0.6, 0.7, 0.8, 0.9];
  var center = vec2(0, 0);
  var SIZE = 50; // slices for half circle
  var angle = Math.PI / SIZE; //set the angle

  for (var r = 0; r < radii.length; r++) {
    for (var i = 0; i < SIZE + 1; i++) {
      points.push([
        center[0] + radii[r] * Math.cos(i * angle),
        center[1] + radii[r] * Math.sin(i * angle),
      ]);
      //parallel to the half ring points
      colors.push(ringColors[r]); //colors the rings
    }
  }
}

//the center of the panet
function GenerateCircle() {
  var radius = 0.5; // Adjust as per the requirement
  var center = vec2(0, 0);
  var SIZE = 100; // slices for full circle
  var angle = (2 * Math.PI) / SIZE;

  // Push points for the planet circle
  for (var i = 0; i < SIZE + 1; i++) {
    points.push([
      center[0] + radius * Math.cos(i * angle),
      center[1] + radius * Math.sin(i * angle),
    ]);

    colors.push([1, 1, 0, 1.0]); // Color for planet, adjust as required
  }
}

//the rings
function GenerateFrontCircles() {
  // Essentially a mirror of GenerateBackCircles
  var radii = [0.6, 0.7, 0.8, 0.9];
  var center = vec2(0, 0);
  var SIZE = 50; // slices for half circle
  var angle = Math.PI / SIZE;

  for (var r = 0; r < radii.length; r++) {
    for (var i = 0; i < SIZE + 1; i++) {
      points.push([
        center[0] + radii[r] * Math.cos(-i * angle),
        center[1] + radii[r] * Math.sin(-i * angle),
      ]);

      colors.push(ringColors[r]); //colors the rings
    }
  }
}

//simple star
function GenerateSimpleStar() {
  // saves the location of the star
  starStartPoint = points.length;

  //points for the star
  const starPoints = [
    vec2(0, 1),
    vec2(-1, -1),
    vec2(1, 0.5),
    vec2(-1, 0.5),
    vec2(1, -1),
    vec2(0, 1),
  ];

  // Push the points in the sequence for drawing a star shape
  for (let i = 0; i < starPoints.length; i++) {
    points.push(starPoints[i]);
    colors.push(vec4(0.75, 0.86, 0, 1.0));
  }
}

//first object a space rock
function GenerateObject() {
  //objects points
  const objPoints = [
    vec2(0, 1.5),
    vec2(-1.5, 0),
    vec2(1.5, 0),
    vec2(1.5, 2),
    vec2(-1.5, 0),
  ];

  //pushes points
  for (let i = 0; i < objPoints.length; i++) {
    points.push(objPoints[i]);
  }

  colors.push(vec4(0.53, 0.2, 0.1, 1.0)); //darker orange-red
  colors.push(vec4(0.53, 0.2, 0.1, 1.0));
  colors.push(vec4(0.53, 0.2, 0.1, 1.0));
  colors.push(vec4(0.7, 0.5, 0.9, 1.0)); // lighter orange-red
  colors.push(vec4(0.7, 0.5, 0.9, 1.0));

  //store location of object
  objStartIndex = points.length - objPoints.length;

  objPointsLength = objPoints.length;
}

//store the random star locations
function generateStarLocations() {
  for (let i = 0; i < NUM_STARS; i++) {
    let x = Math.random() * 16 - 8; // Random X between -8 and 8
    let y = Math.random() * 2.67 + 5.33; // Random Y in the upper 1/3 of the sky (between 5.33 and 8)
    starLocations.push(vec2(x, y));
  }
}

//points for the space tree
function GenerateObject2() {
  const objPoints = [
    vec2(0, 1), // Top point
    vec2(-0.5, -1), // Bottom left
    vec2(0.5, -1), // Bottom right
    vec2(-1, 0.5), // Middle left
    vec2(1, 0.5), // Middle right
    vec2(0, -0.5), // Bottom center
  ];

  for (let i = 0; i < objPoints.length; i++) {
    points.push(objPoints[i]);
  }

  colors.push(vec4(0, 0.1, 0.0, 1.0)); //darker green
  colors.push(vec4(0, 0.1, 0.0, 1.0));
  colors.push(vec4(0, 0.2, 0.1, 1.0));
  colors.push(vec4(0.1, 0.3, 0.2, 1.0)); //medium green
  colors.push(vec4(0.2, 0.4, 0.3, 1.0));
  colors.push(vec4(0.3, 0.5, 0.4, 1.0)); //ligher green

  //save the locations
  objStartIndex2 = points.length - objPoints.length;

  objPointsLength2 = objPoints.length;
}

//points for the hockey mask
function GenerateHockeyMask() {
  maskStartPoint = points.length;
  GenerateOvalFace();
  GenerateEye(-0.5, 0.5); // Left eye
  GenerateEye(0.5, 0.5); // Right eye
}

//mask helper function for the oval mask
function GenerateOvalFace() {
  //makes an oval for the mask inside this function
  let numSegments = 50;
  let a = 1.5;
  let b = 1.0;

  for (let i = 0; i < numSegments; i++) {
    let theta = (i / numSegments) * 2.0 * Math.PI;
    let x = a * Math.cos(theta);
    let y = b * Math.sin(theta);

    points.push(vec2(x, y));
    colors.push(maskColor);
  }
}

//mask helper function for the eye
function GenerateEye(xCenter, yCenter) {
  let numSegments = 20;
  let radius = 0.3;

  for (let i = 0; i < numSegments; i++) {
    let theta = (i / numSegments) * 2.0 * Math.PI;
    let x = xCenter + radius * Math.cos(theta);
    let y = yCenter + radius * Math.sin(theta);

    points.push(vec2(x, y));
    colors.push(eyeColor);
  }
}

// genreate the points for the bow
function generateBow() {
  bowStartPoint = points.length;

  points.push(vec2(-2, 0));
  colors.push(bowColor);
  points.push(vec2(-1, 0));
  colors.push(bowColor);
  points.push(vec2(-1, 0.5));
  colors.push(bowColor);
  // Add the half-circle points from vec2(-1, -0.5) to vec2(1, 0.5)
  let numSemicirclePoints = 50;
  let radius = 1.0;
  let centerX = 0.0; // The center of the half-circle

  for (let i = 0; i <= numSemicirclePoints; i++) {
    let angle = (Math.PI * i) / numSemicirclePoints; // Angle varies from 0 to pi
    let x = centerX + -radius * Math.cos(angle);
    let y = 0.5 + radius * Math.sin(angle);
    points.push(vec2(x, y));
    colors.push(bowColor);
  }

  points.push(vec2(1, 0.5));
  colors.push(bowColor);
  points.push(vec2(1, 0.0));
  colors.push(bowColor);
  points.push(vec2(2, 0));
  colors.push(bowColor);

  points.push(vec2(-1, 0.0));
  colors.push(bowColor);
  points.push(vec2(0.0, -1));
  colors.push(bowColor);
  points.push(vec2(1, 0));
  colors.push(bowColor);
}

// generate the points for the arrow
function generateArrow() {
  arrowStartPoint = points.length;

  //arrow shaft
  points.push(vec2(0, 2));
  colors.push(arrowColor);
  points.push(vec2(0, -1));
  colors.push(arrowColor);

  //arrow feathers
  points.push(vec2(-0.1, -1.5));
  colors.push(arrowColor);
  points.push(vec2(0, -1));
  colors.push(arrowColor);
  points.push(vec2(0.1, -1.5));
  colors.push(arrowColor);

  //arrow feathers
  points.push(vec2(-0.1, -1));
  colors.push(arrowColor);
  points.push(vec2(0, -0.5));
  colors.push(arrowColor);
  points.push(vec2(0.1, -1));
  colors.push(arrowColor);

  //arrow feathers
  points.push(vec2(-0.1, -0.5));
  colors.push(arrowColor);
  points.push(vec2(0.0, 0.0));
  colors.push(arrowColor);
  points.push(vec2(0.1, -0.5));
  colors.push(arrowColor);

  //arrow head
  points.push(vec2(0.0, 2));
  colors.push(vec4(0.35, 0.55, 0.679, 1.0));
  points.push(vec2(-0.15, 1.5));
  colors.push(vec4(0.25, 0.4, 0.55, 1.0));
  points.push(vec2(0.15, 1.5));
  colors.push(vec4(0.25, 0.4, 0.55, 1.0));
}

//BOO!!! IT'S A GHOST!!!
function GenerateGhost() {
  ghostStartPoint = points.length;
  // begin body  (87 points)
  points.push(vec2(3, 0));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(3.1, 1));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(3.5, 2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(4, 3.6));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(4, 4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(4.1, 3.3));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(4.5, 3));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(5.5, 3));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(6, 3.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(6.5, 4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(6.7, 4.2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(6.8, 2.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(7, 2.4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(7.5, 2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(8, 2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(8.5, 1.7));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(9, 1.2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(10, 0.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(10, -2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(10.4, -2.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(10.5, -3.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(10.7, -1.7));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(11, -1.4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(11.2, -1.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(12, -2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(12.5, -2.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(13, -3));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(13, -2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(12.8, -0.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(12, 0));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(12.5, 0.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(11, 1));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(10.8, 1.4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(10.2, 2.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(10, 4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(9.8, 7.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(7.5, 9.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(6, 11));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(3, 12));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(0.5, 15));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(0, 17));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-1.8, 17.4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-4, 16.6));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-5, 14));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-6, 10.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-9, 10));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-10.5, 8.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-12, 7.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-12.5, 4.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-13, 3));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-13.5, -1));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-13, -2.3));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-12, 0));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-11.5, 1.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-11.5, -2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-10.5, 0));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-10, 2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-8.5, 4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-8, 4.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-8.5, 7));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-8, 5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-6.5, 4.2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-4.5, 6.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-4, 4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-5.2, 2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-5, 0));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-5.5, -2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-6, -5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-7, -8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-8, -10));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-9, -12.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-10, -14.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-10.5, -15.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-11, -17.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-5, -14));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-4, -11));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-5, -12.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-3, -12.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2, -11.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(0, -11.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(1, -12));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(3, -12));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(3.5, -7));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(3, -4));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(4, -3.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(4.5, -2.5));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(3, 0));
  colors.push(vec4(1, 1, 1, 1));
  // end body

  // begin mouth (6 points)
  points.push(vec2(-1, 6));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-0.5, 7));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-0.2, 8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-1, 8.6));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2, 7));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-1.5, 5.8));
  colors.push(vec4(1, 1, 1, 1));
  // end mouth

  // begin nose (5 points)
  points.push(vec2(-1.8, 9.2));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-1, 9.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-1.1, 10.6));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-1.6, 10.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-1.9, 10));
  colors.push(vec4(1, 1, 1, 1));

  // begin left eye, translate (2.6, 0.2, 0) to draw the right eye
  // outer eye, draw line loop (9 points)
  points.push(vec2(-2.9, 10.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.2, 11));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2, 12));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2, 12.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.2, 13));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.5, 13));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.9, 12));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-3, 11));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.9, 10.5));
  colors.push(vec4(1, 1, 1, 1));

  // eye ball, draw triangle_fan (7 points)
  points.push(vec2(-2.5, 11.4)); // middle point
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.9, 10.8));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.2, 11));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2, 12));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.9, 12));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-3, 11));
  colors.push(vec4(1, 1, 1, 1));
  points.push(vec2(-2.9, 10.5));
  colors.push(vec4(1, 1, 1, 1));
  // end left eye
}

//draws the planet
function DrawFullPlanet() {
  // Push the initial state of the modelViewMatrix to the stack
  modelViewStack.push(modelViewMatrix);
  // Create transformation matrices for the rings
  var scaleMatrixRings = scale4(2 * Ratio, 0.5 * Ratio, 1); // Adjusted scale values for rings
  var rotationMatrix = rotate(80, 0, 0, 1); // Rotate around Z-axis

  // Combine transformations for the rings: Scale -> Rotate
  var transformationMatrixRings = mult(rotationMatrix, scaleMatrixRings);

  // Push current model view matrix to the stack for later restoration
  modelViewStack.push(modelViewMatrix);

  // Update model view matrix for rings
  modelViewMatrix = mult(modelViewMatrix, transformationMatrixRings);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  // Draw Back Circles
  for (var i = 0; i < 4; i++) {
    gl.drawArrays(gl.LINE_STRIP, 8 + i * 51, 51);
  }
  // Restore original model view matrix
  modelViewMatrix = modelViewStack.pop();
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Create transformation matrices for the planet
  var scaleMatrixPlanet = scale4(2, 2 * Ratio, 1); // scale values

  // Push current model view matrix to the stack for later restoration
  modelViewStack.push(modelViewMatrix);

  // Update model view matrix for planet
  modelViewMatrix = mult(modelViewMatrix, scaleMatrixPlanet); // Only scale for planet
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Draw the planet circle
  gl.drawArrays(gl.TRIANGLE_FAN, 212, 101);

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
    gl.drawArrays(gl.LINE_STRIP, 313 + i * 51, 51); // Adjusted by adding 8
  }

  // Restore original model view matrix
  modelViewMatrix = modelViewStack.pop();
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

//draws the sky and ground
function DrawSkyAndGround() {
  modelViewMatrix = mat4(); // Reset to identity
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Draw the sky rectangle
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // Draw the ground rectangle
  gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
}

//draws the star
function DrawStar(position, scale) {
  // Push the current state of the modelViewMatrix to the stack
  modelViewStack.push(modelViewMatrix);

  // Update model view matrix for the star based on its position and scale
  let translationMatrix = translate(position[0], position[1], 0);
  let scalingMatrix = scale4(scale, scale, 1); // Using the scale4 function for uniform scaling in x and y
  modelViewMatrix = mult(translationMatrix, scalingMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Draw the star
  gl.drawArrays(gl.LINE_STRIP, starStartPoint, 6); // Star is the last 6 vertices

  // Restore original model view matrix
  modelViewMatrix = modelViewStack.pop();
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

//draws the rocks
function DrawObject(scaleFactor, position, rotationAngle) {
  modelViewStack.push(modelViewMatrix);

  let translationMatrix = translate(position[0], position[1], 0);
  let scalingMatrix = scale4(scaleFactor, scaleFactor, 1);
  let rotationMatrix = rotate(rotationAngle, 0, 0, 1); // Rotate around Z-axis

  // Combine transformations: Translate -> Scale -> Rotate
  let transformationMatrix = mult(translationMatrix, scalingMatrix);
  transformationMatrix = mult(transformationMatrix, rotationMatrix);

  modelViewMatrix = mult(modelViewMatrix, transformationMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  gl.drawArrays(gl.TRIANGLE_FAN, objStartIndex, objPointsLength);

  modelViewMatrix = modelViewStack.pop();
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

//draws the space trees
function DrawObject2(scaleFactor, position, rotationAngle) {
  modelViewStack.push(modelViewMatrix);

  let translationMatrix = translate(position[0], position[1], 0);
  let scalingMatrix = scale4(scaleFactor, scaleFactor, 1);
  let rotationMatrix = rotate(rotationAngle, 0, 0, 1); // Rotate around Z-axis

  // Combine transformations: Translate -> Scale -> Rotate
  let transformationMatrix = mult(translationMatrix, scalingMatrix);
  transformationMatrix = mult(transformationMatrix, rotationMatrix);

  modelViewMatrix = mult(modelViewMatrix, transformationMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  gl.drawArrays(gl.TRIANGLE_FAN, objStartIndex2, objPointsLength2);

  modelViewMatrix = modelViewStack.pop();
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

//draws the ghost
function DrawGhost() {
  modelViewMatrix = mult(modelViewMatrix, scale4(1 / 10, 1 / 10, 1));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  var n = ghostStartPoint; // Use ghostStartPoint directly
  gl.drawArrays(gl.LINE_LOOP, n, 87); // body
  n += 87;
  gl.drawArrays(gl.LINE_LOOP, n, 6); // mouth
  n += 6;
  gl.drawArrays(gl.LINE_LOOP, n, 5); // nose
  n += 5;
  gl.drawArrays(gl.LINE_LOOP, n, 9); // left eye
  n += 9;
  gl.drawArrays(gl.TRIANGLE_FAN, n, 7); // left eye ball
  n += 7; // though not necessary to increment here as it's not used below

  modelViewMatrix = mult(modelViewMatrix, translate(2.6, 0, 0));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.drawArrays(gl.LINE_STRIP, n - 16, 9); // right eye (going back to left eye's position)
  gl.drawArrays(gl.TRIANGLE_FAN, n - 7, 7); // right eye ball (going back to left eyeball's position)
}

//draws the hockey mask
function DrawHockeyMask(scaleFactor, position, rotationAngle) {
  modelViewStack.push(modelViewMatrix);

  let translationMatrix = translate(position[0], position[1], 0);
  let scalingMatrix = scale4(scaleFactor, scaleFactor, 1);
  let rotationMatrix = rotate(rotationAngle, 0, 0, 1); // Rotate around Z-axis

  // Combine transformations: Translate -> Scale -> Rotate
  let transformationMatrix = mult(translationMatrix, scalingMatrix);
  transformationMatrix = mult(transformationMatrix, rotationMatrix);

  modelViewMatrix = mult(modelViewMatrix, transformationMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Additional scaling for the oval face (e.g., 1 for x-axis and 1.5 for y-axis to stretch it vertically)
  let ovalScalingMatrix = scale4(0.75, 2, 1);
  let ovalModelViewMatrix = mult(modelViewMatrix, ovalScalingMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(ovalModelViewMatrix));
  gl.drawArrays(gl.TRIANGLE_FAN, maskStartPoint, 50); // 50 points for the face

  // Reset the modelViewMatrix for the eyes
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Draw the left eye
  gl.drawArrays(gl.TRIANGLE_FAN, maskStartPoint + 50, 20); // 20 points for the left eye

  // Draw the right eye
  gl.drawArrays(gl.TRIANGLE_FAN, maskStartPoint + 70, 20); // 20 points for the right eye

  modelViewMatrix = modelViewStack.pop();
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

//draws the bow
function DrawBowAndString(scaleFactor, position, rotationAngle) {
  modelViewStack.push(modelViewMatrix);

  let translationMatrix = translate(position[0], position[1], 0);
  let scalingMatrix = scale4(scaleFactor, scaleFactor, 1);
  let rotationMatrix = rotate(rotationAngle, 0, 0, 1); // Rotate around Z-axis

  // Combine transformations: Translate -> Scale -> Rotate
  let transformationMatrix = mult(translationMatrix, scalingMatrix);
  transformationMatrix = mult(transformationMatrix, rotationMatrix);

  modelViewMatrix = mult(modelViewMatrix, transformationMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  gl.drawArrays(gl.LINE_STRIP, bowStartPoint, 57);
  gl.drawArrays(gl.LINE_STRIP, bowStartPoint + 57, 3);

  modelViewMatrix = modelViewStack.pop();
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

//draws the arrow
function DrawArrow(scaleFactor, position, rotationAngle) {
  modelViewStack.push(modelViewMatrix);

    let translationMatrix = translate(position[0], position[1], 0); 
    let scalingMatrix = scale4(scaleFactor, scaleFactor, 1); 
    let rotationMatrix = rotate(rotationAngle, 0, 0, 1);  // Rotate around Z-axis

    // Combine transformations: Translate -> Scale -> Rotate
    let transformationMatrix = mult(translationMatrix, scalingMatrix);
    transformationMatrix = mult(transformationMatrix, rotationMatrix);
    
    // Apply the transformation
    modelViewMatrix = mult(modelViewMatrix, transformationMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Now draw the arrow
    gl.drawArrays(gl.LINE_STRIP, arrowStartPoint, 2); 
    gl.drawArrays(gl.LINE_STRIP, arrowStartPoint + 2, 3);
    gl.drawArrays(gl.LINE_STRIP, arrowStartPoint + 5, 3); 
    gl.drawArrays(gl.LINE_STRIP, arrowStartPoint + 8, 3);
    gl.drawArrays(gl.TRIANGLES, arrowStartPoint + 11, 3);

    // Restore the previous matrix
    modelViewMatrix = modelViewStack.pop();
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
}

// function calculates the direction the arrow will fire
function fireArrow() {
  if (arrowState === 'ready') {
    arrowState = 'firing';

    // Calculate the arrow's direction based on the bow's rotation angle
    var angleInRadians = bowRotationAngle * Math.PI / 180;
    arrowDirection = vec2(-Math.sin(angleInRadians), Math.cos(angleInRadians));

    // Start the arrow animation
    animateArrow();
  }
}

function animateArrow() {
  if (arrowState === 'firing') {
    // Update arrow position
    arrowPosition[0] += arrowDirection[0] * arrowSpeed;
    arrowPosition[1] += arrowDirection[1] * arrowSpeed;

    // Check if the arrow has moved beyond the screen to reset it
    if (arrowPosition[0] < -8 || arrowPosition[0] > 8 || arrowPosition[1] < -8 || arrowPosition[1] > 8) {
      resetArrowAndGhost();
    } else {
      // Keep the animation going
      requestAnimationFrame(animateArrow);
    }

    // Trigger a render of the scene
    render();
  }
}
function resetArrowAndGhost() {
  arrowState = 'ready';
  ghostState = 0;
  arrowPosition = vec2(0.0, -5.5); // Reset arrow position to the bow
  // Reset any other necessary state variables
}
//where all the magic happens and renders the scene
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

  // Draw Sky and Ground
  DrawSkyAndGround();

  // Set a scale for the stars
  let starScale = 0.1;

  // loops through the stars
  for (let i = 0; i < NUM_STARS; i++) {
    DrawStar(starLocations[i], starScale);
  }

  // Reset the modelViewMatrix before drawing the custom object
  modelViewMatrix = mat4(); // Reset to identity
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  //draws the objects
  DrawObject2(2.5, vec2(5, 0), 0);
  DrawObject2(2, vec2(-4, -0.75), 0);
  DrawObject2(1.5, vec2(0, -1.0), 0);

  // Draw the object in different sizes and at different locations
  DrawObject(1.67, vec2(5.5, -4), 0);
  DrawObject(2.5, vec2(-8, -1.75), -90);
  DrawObject(0.9, vec2(2.68, -2.8), 30);
  DrawObject2(0.85, vec2(2.5, -5), 0);
  DrawObject(0.9, vec2(-1.75, -3.75), 30);
  DrawObject2(0.85, vec2(-1.8, -4.9), 0);

  // Set the transformation matrix for the Planet and Rings
  modelViewMatrix = mult(translate(-5, 5, 0), scale4(0.75, 0.75, 1));
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Draw Full Planet
  DrawFullPlanet();

  if (ghostState == 1) {
    // Use the already generated X and Y position for the ghost
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(ghostX, ghostY, 0));
    modelViewMatrix = mult(modelViewMatrix, scale4(1, 1, 1));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    DrawGhost();
  }
  // Set the transformation matrix for the hockey mask
  modelViewMatrix = mat4(); // Reset the modelViewMatrix
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Draw the hockey mask with scale, position, and rotation
  DrawHockeyMask(0.4, vec2(1.25, -2.5), 0.0);
  DrawHockeyMask(0.3, vec2(-3.0, -3.3), 0.0);
  DrawHockeyMask(0.2, vec2(3.35, -2.78), 0.0);

  modelViewMatrix = mat4(); // Reset the modelViewMatrix
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  // Draw the bow and arrows
  DrawBowAndString(0.75, vec2(0.0, -5.5), bowRotationAngle);

  modelViewMatrix = mat4(); // Reset the modelViewMatrix
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  if (arrowState === 'firing') {
    // No need to reset modelViewMatrix as we are already setting it above
    DrawArrow(0.75, arrowPosition, bowRotationAngle); // Draw the arrow in its new position
  } else if (arrowState === 'ready') {
    DrawArrow(0.75, vec2(0.0, -5.5), bowRotationAngle); // Draw the arrow in the 'ready' position on the bow
  }
}
setInterval(render, 100);
