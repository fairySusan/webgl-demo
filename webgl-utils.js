/* 创建并编译一个着色器 */
function compileShader(gl, shaderSource, shaderType) {
  // 1、创建着色器程序
  const shader = gl.createShader(shaderType)
  // 2、设置着色器的源码
  gl.shaderSource(shader, shaderSource)

  // 3、编译着色器
  gl.compileShader(shader)

  // 4、检测编译是否成功
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if(!success) {
    throw('could not compile shader:' + gl.getShaderInfoLog(shader))
  }
  return shader
}

/* 链接两个着色器到一个program */
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram()

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  
  gl.linkProgram(program)
  
  const success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!success) {
    throw("program failed to link:" + gl.getProgramInfoLog(program))
  }
  return program
}

/* 用 script 标签的内容创建着色器 */
function createShaderFromScript(gl, scriptId, opt_shaderType) {
  const shaderScript = document.getElementById(scriptId)
  if(!shaderScript) {
    throw("*** Error: unknown script element" + scriptId)
  }

  const shaderSource = shaderScript.text
  if (!opt_shaderType) {
    if (shaderScript.type === 'x-shader/x-vertex') {
      opt_shaderType = gl.VERTEX_SHADER
    } else if(shaderScript.type === 'x-shader/x-fragment') {
      opt_shaderType = gl.FRAGMENT_SHADER
    } else if(!opt_shaderType) {
      throw('*** Error: shader type not set')
    }
  }

  return compileShader(gl, shaderSource, opt_shaderType)
}

function createShaderFromScripts(gl, vertexShaderId, fragmentShaderId) {
  const vertexShader = createShaderFromScript(gl, vertexShaderId, gl.VERTEX_SHADER)
  const fragmentShader = createShaderFromScript(gl, fragmentShaderId, gl.FRAGMENT_SHADER)
  return createProgram(gl, vertexShader, fragmentShader)
}

function resizeCanvasToDisplySize(canvas) {

  const realToCSSPixels = window.devicePixelRatio
 // 获取浏览器中画布的显示尺寸
 const displayWidth = Math.floor(canvas.clientWidth * realToCSSPixels)
 const displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels)

  if (canvas.width !== displayWidth || canvas.heigth !== displayHeight) {
    canvas.width = displayWidth
    canvas.height = displayHeight
  }
}