function main() {
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl');
  if(!gl) {
    return
  }
  const program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d'])
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');

  const worldViewLocation = gl.getUniformLocation(program, 'u_worldView');
  const projectionLocation = gl.getUniformLocation(program, 'u_projection')
  const textureLocation = gl.getUniformLocation(program, 'u_texture');
  const fogColorLocation = gl.getUniformLocation(program, 'u_fogColor');
  const fogNearLocation = gl.getUniformLocation(program, 'u_fogNear')
  const fogFarLocation = gl.getUniformLocation(program, 'u_fogFar')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  setGeometry(gl)

  const texturecoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texturecoordBuffer)
  setTexcoord(gl)

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,255,255]));
  const image = new Image();
  image.src = 'http://127.0.0.1:5500/webgl-texture/f-texture.png';
  image.addEventListener('load', () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (isPowerOf2(image.width) &&  isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  })

  function isPowerOf2(value) {
    return (value & (value-1)) === 0
  }

  
  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);
  var fogColor = [0.8, 0.9, 1, 1];
  var settings = {
    fogNear: 1.1,
    fogFar: 13.0,
    xOff: 1.1,
    zOff: 1.4,
  };

  webglLessonsUI.setupUI(document.querySelector("#ui"), settings, [
    { type: "slider",   key: "fogNear",  min: 0, max: 40, precision: 3, step: 0.001, },
    { type: "slider",   key: "fogFar",   min: 0, max: 40, precision: 3, step: 0.001, },
  ]);

  let then = 0

  requestAnimationFrame(drawScene)
  function drawScene(time) {
    time *= 0.001;
    const deltaTime = time - then;
    then = time;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    modelYRotationRadians += -0.7 * deltaTime;
    modelXRotationRadians += -0.4 * deltaTime;

    gl.clearColor(...fogColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program)
    

    gl.enableVertexAttribArray(positionLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT,false,0,0)

    gl.enableVertexAttribArray(texcoordLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, texturecoordBuffer)
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false,0,0)

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    const cameraPosition = [0,0,2]
    const up = [0,1,0]
    const target = [0,0,0]

    const cameraMatrix = m4.lookAt(cameraPosition, target, up);
    const viewMatrix = m4.inverse(cameraMatrix)

    var worldViewMatrix = m4.xRotate(viewMatrix, modelXRotationRadians);
    worldViewMatrix = m4.yRotate(worldViewMatrix, modelYRotationRadians);

    gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix)
    gl.uniformMatrix4fv(worldViewLocation, false, worldViewMatrix);

    gl.uniform1i(textureLocation, 0)

    gl.uniform1f(fogNearLocation, settings.fogNear)
    gl.uniform1f(fogFarLocation, settings.fogFar)
    gl.uniform4fv(fogColorLocation, fogColor)
    
    const numCubes = 40;
    for (let i = 0; i <= numCubes; ++i) {
      var worldViewMatrix = m4.translate(viewMatrix, -2 + i * settings.xOff, 0, -i * settings.zOff);
      worldViewMatrix = m4.xRotate(worldViewMatrix, modelXRotationRadians + i * 0.1);
      worldViewMatrix = m4.yRotate(worldViewMatrix, modelYRotationRadians + i * 0.1);

      gl.uniformMatrix4fv(worldViewLocation, false, worldViewMatrix);

      // Draw the geometry.
      gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
    }

    requestAnimationFrame(drawScene)
  }
}



function setGeometry(gl) {
  var positions = new Float32Array([
    -0.5, -0.5,  -0.5,
    -0.5,  0.5,  -0.5,
     0.5, -0.5,  -0.5,
    -0.5,  0.5,  -0.5,
     0.5,  0.5,  -0.5,
     0.5, -0.5,  -0.5,

    -0.5, -0.5,   0.5,
     0.5, -0.5,   0.5,
    -0.5,  0.5,   0.5,
    -0.5,  0.5,   0.5,
     0.5, -0.5,   0.5,
     0.5,  0.5,   0.5,

    -0.5,   0.5, -0.5,
    -0.5,   0.5,  0.5,
     0.5,   0.5, -0.5,
    -0.5,   0.5,  0.5,
     0.5,   0.5,  0.5,
     0.5,   0.5, -0.5,

    -0.5,  -0.5, -0.5,
     0.5,  -0.5, -0.5,
    -0.5,  -0.5,  0.5,
    -0.5,  -0.5,  0.5,
     0.5,  -0.5, -0.5,
     0.5,  -0.5,  0.5,

    -0.5,  -0.5, -0.5,
    -0.5,  -0.5,  0.5,
    -0.5,   0.5, -0.5,
    -0.5,  -0.5,  0.5,
    -0.5,   0.5,  0.5,
    -0.5,   0.5, -0.5,

     0.5,  -0.5, -0.5,
     0.5,   0.5, -0.5,
     0.5,  -0.5,  0.5,
     0.5,  -0.5,  0.5,
     0.5,   0.5, -0.5,
     0.5,   0.5,  0.5,

    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setTexcoord(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, 0,
      0, 1,
      1, 0,
      0, 1,
      1, 1,
      1, 0,

      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,

      0, 0,
      0, 1,
      1, 0,
      0, 1,
      1, 1,
      1, 0,

      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,

      0, 0,
      0, 1,
      1, 0,
      0, 1,
      1, 1,
      1, 0,

      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]),
    gl.STATIC_DRAW);
}

main()