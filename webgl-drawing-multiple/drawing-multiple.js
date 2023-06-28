function main() {
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl')
  if(!gl) {
    return alert('Your browser do not support webgl!')
  }

  const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, 10, 12, 6);
  const cubeBufferInfo = primitives.createCubeWithVertexColorsBufferInfo(gl, 20);
  const coneBufferInfo = primitives.createTruncatedConeWithVertexColorsBufferInfo(gl, 10, 0, 20, 12, 1, true, false);

  function degToRad(d) {
    return d * Math.PI / 180;
  }
  
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function emod(x, n) {
    return x >= 0 ? (x % n) : ((n - (-x % n)) % n);
  }

  const programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d'])

  let fieldOfViewRadians = degToRad(60);

  const shapes = [
    sphereBufferInfo,
    cubeBufferInfo,
    coneBufferInfo
  ]
  const sphereUniforms = {
    u_colorMult: [0.5, 1, 0.5, 1],
    u_matrix: m4.identity()
  }
  const cubeUniforms = {
    u_colorMult: [1, 0.5, 0.5, 1],
    u_matrix: m4.identity(),
  };
  const coneUniforms = {
    u_colorMult: [0.5, 0.5, 1, 1],
    u_matrix: m4.identity(),
  };

  const objectsToDraw = [];
  const objects = [];


  var baseHue = rand(0, 360);
  var numObjects = 200;
  for (var ii = 0; ii < numObjects; ++ii) {
    var object = {
      uniforms: {
        u_colorMult: chroma.hsv(emod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
        u_matrix: m4.identity(),
      },
      translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
      xRotationSpeed: rand(0.8, 1.2),
      yRotationSpeed: rand(0.8, 1.2),
    };
    objects.push(object);
    objectsToDraw.push({
      programInfo: programInfo,
      bufferInfo: shapes[ii % shapes.length],
      uniforms: object.uniforms,
    });
  }

  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
    let matrix = m4.translate(viewProjectionMatrix, translation[0], translation[1], translation[2])
    matrix = m4.xRotate(matrix, xRotation)
    matrix = m4.yRotate(matrix, yRotation)
    return matrix
  }

  requestAnimationFrame(drawScene)

  function drawScene(time) {
    time *= 0.0005

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0,0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000)
    const cameraPosition = [0, 0, 100]
    const target = [0,0,0]
    const up = [0,1,0]
    const cameraMatrix = m4.lookAt(cameraPosition, target, up)

    const viewMatrix = m4.inverse(cameraMatrix)

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

    objects.forEach(function(object) {
      object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time);
    });
    
    let lastUsedProgramInfo = null;
    let lastUsedBufferInfo = null;
    objectsToDraw.forEach(object => {
      const programInfo = object.programInfo
      const bufferInfo = object.bufferInfo
      const uniforms = object.uniforms
      let bindBuffers = false
      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo
        gl.useProgram(programInfo.program)

        bindBuffers = true
      }

      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo)
      }
      webglUtils.setUniforms(programInfo, uniforms)
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements)
    })

    requestAnimationFrame(drawScene)
  }
}

main()