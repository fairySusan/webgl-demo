function main () {

  const image = new Image()
  image.src = "./2294472375_24a3b8ef46_o.jpg"
  image.onload = () => {
    render(image)
  }
  function render(image) {
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
      return
    }
    const skyboxProgram = webglUtils.createProgramFromScripts(gl, ['skybox-vertex-shader', 'skybox-fragment-shader']);
    const envmapProgram = webglUtils.createProgramFromScripts(gl, ['envmap-vertex-shader', 'envmap-fragment-shader']);

    const positionLocation = gl.getAttribLocation(skyboxProgram, 'a_position');
    const texcoordLocation = gl.getAttribLocation(skyboxProgram, 'a_texCoord');
    const textureLocation = gl.getUniformLocation(skyboxProgram, "u_texture");
    const worldLocation = gl.getUniformLocation(skyboxProgram, 'u_world');
    const worldViewProjectionLocation = gl.getUniformLocation(skyboxProgram, 'u_worldViewProjection');
    const viewProjectionInverseLocation = gl.getUniformLocation(skyboxProgram, 'u_viewProjectionInverseMatrix');
    const worldCameraPositionLocation = gl.getUniformLocation(skyboxProgram, 'u_worldCameraPosition')

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


    const texture1 = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,texture1)
    const w = gl.canvas.clientWidth
    const h = gl.canvas.clientHeight
    let lx = (4096 - w) / 2
    let rx = lx +w
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      1/3,  2/3,
      2/3,  2/3,
      1/3,  1/3,
      1/3,  1/3,
      2/3,  2/3,
      2/3,  1/3,
    ]), gl.STATIC_DRAW)

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

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
      // 相机在一个圆圈内绕行
      let cameraPosition = [Math.cos(time * 0.1) * 0.5, 0, Math.sin(time * 0.1) * 0.5];
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

      // 绘制平面
      gl.enableVertexAttribArray(positionLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // 绘制纹理
      gl.enableVertexAttribArray(texcoordLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0)  

      gl.uniform1i(textureLocation, 0);
      gl.uniformMatrix4fv(viewProjectionInverseLocation, false, viewDirectionProjectionInverseMatrix);
      gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
      gl.uniformMatrix4fv(worldLocation, false, worldMatrix)
      gl.uniformMatrix4fv(worldCameraPositionLocation, false, cameraPosition)

      // 画了一个矩形
      gl.drawArrays(gl.TRIANGLES, 0, 1*6)
      
      requestAnimationFrame(drawScene)
    }
  }
}

main()

function setGeometry(gl) {
  const positions = new Float32Array([
   -1.0, -1.0,
    1.0, -1.0,
   -1.0,  1.0,
   -1.0,  1.0,
    1.0, -1.0,
    1.0,  1.0,
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