function main() {
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl')
  if(!gl) {
    return alert('Your browser do not support webgl!')
  }

  const program = createShaderFromScripts(gl, 'vertex-shader-3d', 'fragment-shader-3d')

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const normalLocation = gl.getAttribLocation(program, 'a_normal');

  const worldViewProjectionLocation = gl.getUniformLocation(program, 'u_worldViewProjection');
  const worldLocation = gl.getUniformLocation(program, 'u_world');
  const worldInverseTransposeLocation = gl.getUniformLocation(program, 'u_worldInverseTranspose');
  const colorLocation = gl.getUniformLocation(program, 'u_color');
  const lightWorldPositionLocation = gl.getUniformLocation(program, 'u_lightWorldPosition');
  const viewWorldPositionLocation = gl.getUniformLocation(program, 'u_viewWorldPosition');
  const shininessLocation = gl.getUniformLocation(program, 'u_shininess');
  const lightColorLocation = gl.getUniformLocation(program, 'u_lightColor');
  const specularColorLocation = gl.getUniformLocation(program, 'u_specularColor');
  
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  setGeometry(gl)


  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  setNormals(gl)

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var fRotationRadians = 0; 
  var shininess = 150;

  drawScene()

  webglLessonsUI.setupSlider("#fRotation", {value: radToDeg(fRotationRadians), slide: updateRotation, min: -360, max: 360});
  webglLessonsUI.setupSlider("#shininess", {value: shininess, slide: updateShininess, min: 1, max: 300});

  
  function updateRotation(event, ui) {
    fRotationRadians = degToRad(ui.value);
    drawScene();
  }

  function updateShininess(event, ui) {
    shininess = ui.value;
    drawScene();
  }


  function drawScene() {
    resizeCanvasToDisplySize(gl.canvas)
    gl.viewport(0,0,gl.canvas.width, gl.canvas.height)

    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation)

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

    gl.enableVertexAttribArray(normalLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)

    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0,0);

    const projectionMatrix = m4.perspective(fieldOfViewRadians, gl.canvas.width/gl.canvas.height, 1, 2000)

    const camera = [100, 150, 200]
    const target = [0,35,0]
    const up = [0, 1, 0]

    const cameraMatrix = m4.lookAt(camera, target, up)
    const viewMatrix = m4.inverse(cameraMatrix)
    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)
    let worldMatrix = m4.yRotation(fRotationRadians)
    let worldInverseMatrix = m4.inverse(worldMatrix)
    let worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix)
    const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix,worldMatrix)

    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix)
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix)
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix)

    gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1])
    gl.uniform3fv(lightWorldPositionLocation, [20, 30, 60])
    gl.uniform3fv(viewWorldPositionLocation, camera)
    gl.uniform1f(shininessLocation, shininess);
    gl.uniform3fv(lightColorLocation, m4.normalize([0.4, 0.7, 0.3]))
    gl.uniform3fv(specularColorLocation, m4.normalize([1, 0.2, 0.2]))
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
  }
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
  var positions = new Float32Array([
          // left column front
          0,   0,  0,
          0, 150,  0,
          30,   0,  0,
          0, 150,  0,
          30, 150,  0,
          30,   0,  0,

          // top rung front
          30,   0,  0,
          30,  30,  0,
          100,   0,  0,
          30,  30,  0,
          100,  30,  0,
          100,   0,  0,

          // middle rung front
          30,  60,  0,
          30,  90,  0,
          67,  60,  0,
          30,  90,  0,
          67,  90,  0,
          67,  60,  0,

          // left column back
            0,   0,  30,
           30,   0,  30,
            0, 150,  30,
            0, 150,  30,
           30,   0,  30,
           30, 150,  30,

          // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   60,  30,
          30,   30,  30,
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

          // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // right of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          0,   0,   0,
          0, 150,  30,
          0, 150,   0]);

  // Center the F around the origin and Flip it around. We do this because
  // we're in 3D now with and +Y is up where as before when we started with 2D
  // we had +Y as down.

  // We could do by changing all the values above but I'm lazy.
  // We could also do it with a matrix at draw time but you should
  // never do stuff at draw time if you can do it at init time.
  var matrix = m4.xRotation(Math.PI);
  matrix = m4.translate(matrix, -50, -75, -15);

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setNormals(gl) {
  var normals = new Float32Array([
          // left column front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // top rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // middle rung front
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // left column back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // top rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // middle rung back
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // top
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // top rung right
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // under top rung
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // between top rung and middle
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // top of middle rung
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // right of middle rung
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bottom of middle rung.
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // right of bottom
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // bottom
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // left side
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

main()