function main () {
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);
  gl.useProgram(program);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const colorLocation = gl.getAttribLocation(program, 'a_color');
  const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const numElements = setGeometry(gl)

  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl)

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var target = [0, 200, 300];
  var targetAngleRadians = 0;
  var targetRadius = 300;
  var fieldOfViewRadians = degToRad(60);

  
  drawScene();

  // Setup a ui.
  webglLessonsUI.setupSlider("#targetAngle", {value: radToDeg(targetAngleRadians), slide: updateTargetAngle, min: -360, max: 360});
  webglLessonsUI.setupSlider("#targetHeight", {value: target[1], slide: updateTargetHeight, min: 50, max: 300});

  function updateTargetAngle(event, ui) {
    targetAngleRadians = degToRad(ui.value);
    target[0] = Math.sin(targetAngleRadians) * targetRadius;
    target[2] = Math.cos(targetAngleRadians) * targetRadius;
    drawScene();
  }

  function updateTargetHeight(event, ui) {
    target[1] = ui.value;
    drawScene();
  }

  function drawScene() {
    const  numFs = 5;
    const radius = 600;
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const size = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset)

    gl.enableVertexAttribArray(colorLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 3000)

    const cameraTarget = [0, -100, 0]
    const cameraPosition = [500, 300, 500]
    const up = [0,1,0]

    const cameraMatrix = m4.lookAt(cameraPosition, cameraTarget, up)
    const viewMatrix = m4.inverse(cameraMatrix)
    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

    var deep = 5;
    var across = 5;
    for (var zz = 0; zz < deep; ++zz) {
      var v = zz / (deep - 1);
      var z = (v - .5) * deep * 150;
      for (var xx = 0; xx < across; ++xx) {
        var u = xx / (across - 1);
        var x = (u - .5) * across * 150;
        var matrix = m4.lookAt([x, 0, z], target, up);
        drawHead(matrix, viewProjectionMatrix, matrixLocation, numElements);
      }
    }

    drawHead(m4.translation(target[0], target[1], target[2]), viewProjectionMatrix, matrixLocation, numElements);

    function drawHead(matrix, viewProjectionMatrix, matrixLocation, numElements) {
      matrix = m4.multiply(viewProjectionMatrix, matrix)
      gl.uniformMatrix4fv(matrixLocation, false, matrix)
      gl.drawArrays(gl.TRIANGLES, 0, numElements);
    }
  }
}

main()

function setGeometry(gl) {
  var positions = new Float32Array(HeadData.positions);
  var matrix = m4.multiply(m4.scaling(6, 6, 6), m4.yRotation(Math.PI));
  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  return positions.length / 3;
}

// Fill the buffer with colors for the 'F'.
function setColors(gl, numElements) {
  var normals = HeadData.normals;
  var colors = new Uint8Array(normals.length);
  var offset = 0;
  for (var ii = 0; ii < colors.length; ii += 3) {
    for (var jj = 0; jj < 3; ++jj) {
      colors[offset] = (normals[offset] * 0.5 + 0.5) * 255;
      ++offset;
    }
  }
  gl.bufferData(
      gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
}
