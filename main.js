const canvas = document.getElementById('canvas')
const gl = canvas.getContext('webgl')
if (!gl) {
  alert('您的浏览器不支持webgl')
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader
  }
  console.log(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

const vertexShaderSource = document.querySelector('#vertex-shader-2d').text
const fragmentShaderSource = document.querySelector('#fragment-shader-2d').text

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

// 将两个着色器link到一个program
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  const success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if(success) {
    return program
  }
  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

/* ----------绘制前的准备-------------- */
const program = createProgram(gl, vertexShader, fragmentShader)

// 1. 找到a_position在内存中的位置
const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
const colorUniformLocation = gl.getUniformLocation(program, 'u_color')
const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution')


// 2. 创建一个缓冲来放置坐标点数据
const positionBuffer = gl.createBuffer()
// 3. 将这个缓冲绑定到gl.ARRAY_BUFFER这个全局变量
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
// 4. 声明三个二维坐标点
const positions = [
  100, 100,
  100, 0,
  0, 100
]
// 5. 将坐标点数据绑定到放到缓冲positionBuffer中, gl.ARRAY_BUFFER充当一个桥梁
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)


let translation = [200, 150]
let angleInRadians = 0
let scale = [1,1] 
// resizeCanvasToDisplySize(gl.canvas)
console.log(gl.canvas.width, gl.canvas.height)
console.log(gl.canvas.clientWidth, gl.canvas.clientHeight)


drawScene()
webglLessonsUI.setupSlider("#x", {value: translation[0], slide: updatePosition(0), max:gl.canvas.width})
webglLessonsUI.setupSlider("#y", {value: translation[0], slide: updatePosition(1), max:gl.canvas.height})
webglLessonsUI.setupSlider("#angle", {slide: updateAngle, max: 360})
webglLessonsUI.setupSlider("#scaleX", {value: scale[0], slide: updateScale(0), min:-5,max:5,step: 0.01, precision:2})
webglLessonsUI.setupSlider("#scaleY", {value: scale[1], slide: updateScale(1), min:-5,max:5,step: 0.01, precision:2})

function updatePosition(index) {
  return function(event, ui) {
    translation[index] = ui.value
    drawScene()
  }
}

function updateAngle(index, ui) {
  const angleInDegrees = 360 - ui.value
  angleInRadians = angleInDegrees * Math.PI / 180
  drawScene()
}

function updateScale(index) {
  return function(event, ui) {
    scale[index] = ui.value
    drawScene()
  }
}


/* ------------绘制方法---------------- */
function drawScene() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  // 清空画布
  gl.clearColor(0,0,0,0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // 运行program
  gl.useProgram(program)

  // 启用positionAttributeLocation
  gl.enableVertexAttribArray(positionAttributeLocation)

  const size = 2; // 每次取数据取2个
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  /* 将positionAttributeLocation与positionBuffer进行绑定，
  当读取a_position属性的时候，就是在从缓冲中拿出positions的坐标数据 */
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
  // 设置一个随机的颜色
  gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1)

  let matrix = m3.projection(gl.canvas.clientWidth,gl.canvas.clientHeight)
  matrix = m3.translate(matrix, translation[0], translation[1])
  matrix = m3.rotate(matrix, angleInRadians)
  matrix = m3.scale(matrix, scale[0], scale[1])

  gl.uniformMatrix3fv(matrixLocation, false, matrix)

  const primitiveType = gl.TRIANGLES; // 顶点着色器运行3次绘制一个三角形
  const offset1 = 0
  const count = 3 // 代表顶点着色器运行3次
  gl.drawArrays(primitiveType, offset, count)
}








