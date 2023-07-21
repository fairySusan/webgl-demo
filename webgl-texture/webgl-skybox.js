function main () {
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return
  }
  const skyboxProgram = webglUtils.createProgramFromScripts(gl, ['skybox-vertex-shader', 'skybox-fragment-shader']);
  const envmapProgram = webglUtils.createProgramFromScripts(gl, ['envmap-vertex-shader', 'envmap-fragment-shader']);

  const positionLocation = gl.getAttribLocation(skyboxProgram, 'a_position');
  const skyboxLocation = gl.getUniformLocation(skyboxProgram, 'u_skybox');
  const viewProjectionInverseLocation = gl.getUniformLocation(skyboxProgram, 'u_viewProjectionInverseMatrix');

  const emPositionLocation = gl.getAttribLocation(envmapProgram, 'a_position');
  const emNormalLocation = gl.getAttribLocation(envmapProgram, 'a_normal');
  const emWorldViewProjectionLocation = gl.getUniformLocation(envmapProgram, 'u_worldViewProjection');
  const emWorldLocation = gl.getUniformLocation(envmapProgram, 'u_world');
  const emTextureLocation = gl.getUniformLocation(envmapProgram, 'u_texture');
  const emWorldCameraPositionLocation = gl.getUniformLocation(envmapProgram, 'u_worldCameraPosition')

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl)

  const emPositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, emPositionBuffer)
  setEmGeometry(gl)

  const emNormalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, emNormalBuffer)
  setEmNormals(gl)


  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_CUBE_MAP,texture)

  const faceInfos = [
    {target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,url: './pos-x.jpg'},
    {target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,url: './neg-x.jpg'},
    {target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,url: './pos-y.jpg'},
    {target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,url: './neg-y.jpg',},
    {target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,url: './pos-z.jpg',},
    {target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,url: './neg-z.jpg',},
  ]

  faceInfos.forEach(faceInfo => {
    const {target, url} = faceInfo;
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
    const image = new Image()
    image.src = url
    image.addEventListener('load', () => {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image)
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    })
  })
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  const fieldOfViewRadians = degToRad(60)

  requestAnimationFrame(drawScene)
  let then = 0;
  function drawScene(time) {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    time = time*0.001
    let deltaTime = time - then;
    then = time;

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let cameraPosition = [Math.cos(time * 0.1) * 2, 0, Math.sin(time * 0.1) * 2];
    const target = [0,0,0]
    const up = [0,1,0]
    const cameraMatrix = m4.lookAt(cameraPosition, target, up)
    const viewMatrix = m4.inverse(cameraMatrix)
    var viewDirectionMatrix = m4.copy(viewMatrix);
    // 我们只关心方向，所以清除了移动的部分
    viewDirectionMatrix[12] = 0
    viewDirectionMatrix[13] = 0
    viewDirectionMatrix[14] = 0
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    const viewDirectionProjectionMatrix = m4.multiply(projectionMatrix, viewDirectionMatrix);
    const viewDirectionProjectionInverseMatrix = m4.inverse(viewDirectionProjectionMatrix);
    const viewProjectionMatrix = m4.multiply(projectionMatrix,viewMatrix)

    let worldMatrix = m4.xRotation(time*0.11)
    const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix)

    gl.depthFunc(gl.LESS);
    // 绘制立方体
    gl.useProgram(envmapProgram);
    gl.enableVertexAttribArray(emPositionLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, emPositionBuffer)
    gl.vertexAttribPointer(emPositionLocation,3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(emNormalLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, emNormalBuffer)
    gl.vertexAttribPointer(emNormalLocation, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(emWorldViewProjectionLocation, false, worldViewProjectionMatrix)
    gl.uniformMatrix4fv(emWorldLocation, false, worldMatrix)
    gl.uniform3fv(emWorldCameraPositionLocation, cameraPosition)
    gl.uniform1i(emTextureLocation, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);

    // 绘制天空盒
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(skyboxProgram);
    gl.enableVertexAttribArray(positionLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(viewProjectionInverseLocation, false, viewDirectionProjectionInverseMatrix);
    gl.uniform1i(skyboxLocation, 0)

    gl.drawArrays(gl.TRIANGLES, 0, 1*6)
    
    requestAnimationFrame(drawScene)
  }
}

main()

function setGeometry(gl) {
  const positions = new Float32Array([
   -1, -1,
    1, -1,
   -1,  1,
   -1,  1,
    1, -1,
    1,  1,
  ])
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}


function setEmGeometry(gl) {
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


function setEmNormals(gl) {
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