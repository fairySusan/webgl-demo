function main(){
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl')
  if (!gl) {
    return alert('Your browser do not support webgl!')
  }

  const program = createShaderFromScripts(gl, 'vertex-shader-2d', 'fragment-shader-2d');

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const translationLocation = gl.getUniformLocation(program, 'u_translation');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const colorLocation = gl.getUniformLocation(program, 'u_color')

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl)

  let translation = [0,0];
  let width = 100;
  let height = 30;
  const color = [Math.random(), Math.random(), Math.random(), 1];
  drawScene()

  webglLessonsUI.setupSlider("#x", {slide: updatePosition(0), max: gl.canvas.width });
  webglLessonsUI.setupSlider("#y", {slide: updatePosition(1), max: gl.canvas.height});

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {
    resizeCanvasToDisplySize(gl.canvas);

    gl.viewport(0,0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program)

    gl.enableVertexAttribArray(positionBuffer)

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)

    gl.uniform4fv(colorLocation, color)

    gl.uniform2fv(translationLocation, translation)

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
}

function setGeometry(gl) {
  gl.bufferData(gl.ARRAY_BUFFER,  new Float32Array([
    // 左竖
    0, 0,
    30, 0,
    0, 150,
    0, 150,
    30, 0,
    30, 150,

    // 上横
    30, 0,
    100, 0,
    30, 30,
    30, 30,
    100, 0,
    100, 30,

    // 中横
    30, 60,
    67, 60,
    30, 90,
    30, 90,
    67, 60,
    67, 90,
]),gl.STATIC_DRAW)
}

main();