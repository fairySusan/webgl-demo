function main(){
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl')
  if (!gl) {
    return alert('Your browser do not support webgl!')
  }

  const program = createShaderFromScripts(gl, 'vertex-shader-2d', 'fragment-shader-2d');

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const colorLocation = gl.getUniformLocation(program, 'u_color')
  const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl)

  const m3 = {
    translate: (m, tx, ty) => {
      return m3.multiply(m, m3.translation(tx, ty))
    },
    rotate:(m, angleInRadians) => {
      return m3.multiply(m, m3.rotation(angleInRadians))
    },
    scale: (m, sx, sy) => {
      return m3.multiply(m, m3.scaling(sx, sy))
    },
    projection: (width, height) => {
      return [
        2 / width, 0, 0,
        0, -2 / height, 0,
        -1, 1, 1
      ];
    },
    translation: (tx, ty) => {
      return [
        1, 0, 0,
        0, 1, 0,
        tx, ty, 1,
      ]
    },
    rotation: (angleInRadians) => {
      const cos = Math.cos(angleInRadians)
      const sin = Math.sin(angleInRadians)

      return [
        cos, -sin, 0,
        sin, cos, 0,
        0, 0, 1
      ]
    },
    scaling: (sx, sy) => {
      return [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1
      ]
    },
    identity: () => {
      return [
        1,0,0,
        0,1,0,
        0,0,1
      ]
    },
    multiply: function(a, b) {
      var a00 = a[0 * 3 + 0];
      var a01 = a[0 * 3 + 1];
      var a02 = a[0 * 3 + 2];
      var a10 = a[1 * 3 + 0];
      var a11 = a[1 * 3 + 1];
      var a12 = a[1 * 3 + 2];
      var a20 = a[2 * 3 + 0];
      var a21 = a[2 * 3 + 1];
      var a22 = a[2 * 3 + 2];
      var b00 = b[0 * 3 + 0];
      var b01 = b[0 * 3 + 1];
      var b02 = b[0 * 3 + 2];
      var b10 = b[1 * 3 + 0];
      var b11 = b[1 * 3 + 1];
      var b12 = b[1 * 3 + 2];
      var b20 = b[2 * 3 + 0];
      var b21 = b[2 * 3 + 1];
      var b22 = b[2 * 3 + 2];
      return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
      ];
    },
  }

  let translation = [160, 150];
  let angleInRadians = 0;
  let scale = [0.85, 0.85];
  const color = [Math.random(), Math.random(), Math.random(), 1];
  drawScene()

  webglLessonsUI.setupSlider("#x", {value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
  webglLessonsUI.setupSlider("#y", {value: translation[1], slide: updatePosition(1), max: gl.canvas.height});
  webglLessonsUI.setupSlider("#angle", {slide: updateAngle, max: 360});
  webglLessonsUI.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2});
  webglLessonsUI.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2});

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateAngle(event, ui) {
    let angleInDegrees = 360 - ui.value;
    angleInRadians = angleInDegrees * Math.PI / 180;
    drawScene();
  }

  function updateScale(index) {
    return function(event, ui) {
      scale[index] = ui.value;
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

    const translationMatrix = m3.translation(translation[0], translation[1])
    const rotationMatrix = m3.rotation(angleInRadians)
    const scalingMatrix = m3.scaling(scale[0], scale[1])

    // 初始矩阵
    let matrix = m3.projection(gl.canvas.width, gl.canvas.height)
    let moveOriginMatrix = m3.translation(-50, -75);
 
    for (var i = 0; i < 5; ++i) {
      // 矩阵相乘
      matrix = m3.translate(matrix, translation[0], translation[1])
      matrix = m3.rotate(matrix, angleInRadians);
      matrix = m3.scale(matrix, scale[0], scale[1]);
      matrix = m3.multiply(matrix, moveOriginMatrix);
 
      // 设置矩阵
      gl.uniformMatrix3fv(matrixLocation, false, matrix);
 
      // 绘制图形
      gl.drawArrays(gl.TRIANGLES, 0, 18);
    }
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