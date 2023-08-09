function main() {
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl')
  if(!gl) {
    return alert('Your browser do not support webgl!')
  }

  const program = createShaderFromScripts(gl, 'vertex-shader-3d', 'fragment-shader-3d')
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const positionLocation = gl.getAttribLocation(program, 'a_position');

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  setGeometry(gl)

  drawScene()
  function drawScene() {
    resizeCanvasToDisplySize(gl.canvas)
    gl.viewport(0,0,gl.canvas.width, gl.canvas.height)

    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // 绘制图形
    gl.drawArrays(gl.POINTS, 0, gl.canvas.clientWidth*gl.canvas.clientHeight);
  }
}

main()

function setGeometry(gl) {
  const positions = []
  const width = gl.canvas.clientWidth
  const height = gl.canvas.clientHeight
  for (let x=0; x<=width; x++) {
    for (let y=0; y<=height; y++) {
      positions.push(x,y)
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER,  new Float32Array(positions), gl.STATIC_DRAW)
}