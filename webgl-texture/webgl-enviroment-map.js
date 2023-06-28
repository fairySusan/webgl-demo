function main() {
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const normalLocation = gl.getAttribLocation(program, 'a_normal');
  const worldViewProjectionLocation = gl.getUniformLocation(program, 'u_worldViewProjection');
  const worldLocation = gl.getUniformLocation(program, 'u_world');
  const textureLocation = gl.getUniformLocation(program, 'u_texture');
  const worldCameraPositionLocation = gl.getUniformLocation(program, 'u_worldCameraPosition')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  setGeometry(gl)

  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  setNormals(gl)

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

  const faceInfo = [
    {target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,url: 'http://127.0.0.1:5500/webgl-texture/pos-x.jpg'},
    {target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,url: 'http://127.0.0.1:5500/webgl-texture/neg-x.jpg'},
    {target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,url: 'http://127.0.0.1:5500/webgl-texture/pos-y.jpg'},
    {target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,url: 'http://127.0.0.1:5500/webgl-texture/neg-y.jpg',},
    {target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,url: 'http://127.0.0.1:5500/webgl-texture/pos-z.jpg',},
    {target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,url: 'http://127.0.0.1:5500/webgl-texture/neg-z.jpg',},
  ]
  faceInfo.forEach(faceInfo => {
    const {target, url} = faceInfo

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512
    const height = 512
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null)

    const image = new Image()
    image.src = url;
    image.addEventListener('load',  () => {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image)
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    })
  })
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  
  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  let then = 0
  requestAnimationFrame(drawScene)
  function drawScene(time) {
    time *= 0.0005

    let deltaTime = time - then
    then = time
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Animate the rotation
    modelYRotationRadians += -0.7 * deltaTime;
    modelXRotationRadians += -0.4 * deltaTime;

    gl.useProgram(program)

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

    gl.enableVertexAttribArray(normalLocation);

    // Bind the normal buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);

    const camera = [0,0,2]
    const target = [0,0,0]
    const up = [0, 1, 0]

    const cameraMatrix = m4.lookAt(camera, target, up)
    const viewMatrix = m4.inverse(cameraMatrix)

    let worldMatrix = m4.xRotation(modelXRotationRadians);
    worldMatrix = m4.yRotate(worldMatrix, modelYRotationRadians);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)
    const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix,worldMatrix)
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix)
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix)
    gl.uniform3fv(worldCameraPositionLocation, camera)
    gl.uniform1i(textureLocation, 0)

    gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);

    requestAnimationFrame(drawScene);
  }
}

main()

function setGeometry(gl) {
  var positions = new Float32Array(
    [
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

function setNormals(gl) {
  var normals = new Float32Array(
    [
       0, 0, -1,
       0, 0, -1,
       0, 0, -1,
       0, 0, -1,
       0, 0, -1,
       0, 0, -1,

       0, 0, 1,
       0, 0, 1,
       0, 0, 1,
       0, 0, 1,
       0, 0, 1,
       0, 0, 1,

       0, 1, 0,
       0, 1, 0,
       0, 1, 0,
       0, 1, 0,
       0, 1, 0,
       0, 1, 0,

       0, -1, 0,
       0, -1, 0,
       0, -1, 0,
       0, -1, 0,
       0, -1, 0,
       0, -1, 0,

      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,

       1, 0, 0,
       1, 0, 0,
       1, 0, 0,
       1, 0, 0,
       1, 0, 0,
       1, 0, 0,
    ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}