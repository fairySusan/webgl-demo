function main() {
  const image = new Image()
  image.src = "../leaves.png"
  image.onload = () => {
    render(image)
  }

  function render(image) {
    const canvas = document.getElementById('canvas')
    const gl = canvas.getContext('webgl')
    if (!gl) {
      return alert('Your browser do not support webgl!')
    }

    const program = createShaderFromScripts(gl, 'vertex-shader-2d', 'fragment-shader-2d');

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texcoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 画了一个矩形
    setRectangle(gl, 0, 0, image.width, image.height)

    const texCoordBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
    ]), gl.STATIC_DRAW)

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

    resizeCanvasToDisplySize(gl.canvas)

    gl.viewport(0,0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0,0,0,0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // 绘制矩形
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const size = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

    // 接下来绘制图形纹理
    gl.enableVertexAttribArray(texcoordLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)

    gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset)

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)

    const primitiveType = gl.TRIANGLES;
    const count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

function setRectangle(gl, x, y, width, height) {
  const x1 = x;
  const x2 = x+width;
  const y1 = y;
  const y2 = y+height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2
  ]), gl.STATIC_DRAW)
}

main()