var canvas;
var gl;

var shape="triangle";
var eye= [2, 2, 2];
var at = [0, 0, 0];
var up = [0, 1, 0];

var pointsArray = [];
var normalsArray = [];
var stacks, slices;
var N;
var vertices=[];
var mvMatrixStack=[];
var lightPosition = vec4(2, 3, 2, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 225/255, 149/255, 38/255, 1.0 );
var materialDiffuse = vec4(225/255, 149/255, 38/255, 1.0);
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 50.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 1;
var theta =[0, 0, 0];

var thetaLoc;

var flag = true;

window.onload = function init() 
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // generate the points
    SurfaceRevPoints();
    //GeneratePrimitives();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    
    projection = ortho(-3, 3, -3, 3, -20, 20);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

  
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));
    
    render();
}

function SetupLightingMaterial()
{
    // set up lighting and material
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	// send lighting and material coefficient products to GPU
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
}
//Pawn initial 2d line points for surface of revolution  (25 points)
//The points are defined from bottom up in the X-Y plane
var meepleBodyPoints = [
	[0,    .114, 0.0],
	[.013, .114, 0.0],
	[.013, .133, 0.0],
	[.013, .152, 0.0],
	[.013, .171, 0.0],
	[.013, .190, 0.0],
	[.013, .209, 0.0],
	[.013, .228, 0.0],
	[.013, .247, 0.0],
	[.013, .266, 0.0],
	[.013, .285, 0.0],
	[.013, .304, 0.0],
	[.013, .323, 0.0],
	[.013, .342, 0.0],
	[.013, .361, 0.0],
	[.013, .380, 0.0],
	[.013, .399, 0.0],
	[.013, .418, 0.0],
	[.013, .437, 0.0],
	[.013, .456, 0.0],
	[.013, .475, 0.0],
	[.013, .494, 0.0],
	[.009, .513, 0.0],
	[.001, .532, 0.0],
	[0, .532, 0.0],
];


//Sets up the vertices array so the pawn can be drawn
function SurfaceRevPoints()
{
	//Setup initial points matrix
	for (var i = 0; i<25; i++)
	{
		vertices.push(vec4(meepleBodyPoints[i][0], meepleBodyPoints[i][1], 
         meepleBodyPoints[i][2], 1));
	}

	var r;
        var t=Math.PI/12;

        // sweep the original curve another "angle" degree
	for (var j = 0; j < 24; j++)
	{
                var angle = (j+1)*t; 

                // for each sweeping step, generate 25 new points corresponding to the original points
		for(var i = 0; i < 25 ; i++ )
		{	
		        r = vertices[i][0];
                        vertices.push(vec4(r*Math.cos(angle), vertices[i][1], -r*Math.sin(angle), 1));
		}    	
	}

       var N=25; 
       // quad strips are formed slice by slice (not layer by layer)
       //          ith slice      (i+1)th slice
       //            i*N+(j+1)-----(i+1)*N+(j+1)
       //               |              |
       //               |              |
       //            i*N+j --------(i+1)*N+j
       // define each quad in counter-clockwise rotation of the vertices
       for (var i=0; i<24; i++) // slices
       {
           for (var j=0; j<24; j++)  // layers
           {
				quad(i*N+j, (i+1)*N+j, (i+1)*N+(j+1), i*N+(j+1)); 
           }
       }    
}

function triangle(a, b, c) 
{
	var points=[a, b, c];
   	var normal = Newell(points);
   	
        // triangle abc
   	pointsArray.push(a);
   	normalsArray.push(normal);
   	pointsArray.push(b);
   	normalsArray.push(normal);
   	pointsArray.push(c);
   	normalsArray.push(normal);
}

function quad(a, b, c, d) {

     var indices=[a, b, c, d];
     var normal = Newell(indices);

     // triangle a-b-c
     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 

     pointsArray.push(vertices[b]); 
     normalsArray.push(normal); 

     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);   

     // triangle a-c-d
     pointsArray.push(vertices[a]);  
     normalsArray.push(normal); 

     pointsArray.push(vertices[c]); 
     normalsArray.push(normal); 

     pointsArray.push(vertices[d]); 
     normalsArray.push(normal);    
}

function multiply(m, v)
{
    var vv=vec4(
     m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2]+ m[0][3]*v[3],
     m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2]+ m[1][3]*v[3],
     m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2]+ m[2][3]*v[3],
     m[3][0]*v[0] + m[3][1]*v[1] + m[3][2]*v[2]+ m[3][3]*v[3]);
    return vv;
}

function Newell(indices)
{
   var L=indices.length;
   var x=0, y=0, z=0;
   var index, nextIndex;

   for (var i=0; i<L; i++)
   {
       index=indices[i];
       nextIndex = indices[(i+1)%L];
       
       x += (vertices[index][1] - vertices[nextIndex][1])*
            (vertices[index][2] + vertices[nextIndex][2]);
       y += (vertices[index][2] - vertices[nextIndex][2])*
            (vertices[index][0] + vertices[nextIndex][0]);
       z += (vertices[index][0] - vertices[nextIndex][0])*
            (vertices[index][1] + vertices[nextIndex][1]);
   }

   return (normalize(vec3(x, y, z)));
}

var render = function()
{           
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    if(flag) theta[axis] += 2.0;
            
    modelView = lookAt(eye, at, up);
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    
    modelView = mult(modelView, scale4(5, -5, 5));
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    //gl.drawArrays( gl.TRIANGLES, 0, 24*6);
    gl.drawArrays( gl.TRIANGLES, 0, 24*24*6);
    

    requestAnimFrame(render);
}

function scale4(a, b, c) {
        var result = mat4();
        result[0][0] = a;
        result[1][1] = b;
        result[2][2] = c;
        return result;
}
