class TRS {
  constructor() {
    this.translation = [0,0,0]
    this.rotation = [0,0,0]
    this.scale = [1,1,1]
  }

  getMatrix(dst) {
    dst = dst || new Float32Array(16);
    var t = this.translation;
    var r = this.rotation;
    var s = this.scale;
  
    // 通过平移，旋转和缩放计算矩阵
    m4.translation(t[0], t[1], t[2]);
    m4.xRotate(dst, r[0], dst);
    m4.yRotate(dst, r[1], dst);
    m4.zRotate(dst, r[2], dst);
    m4.scale(dst, s[0], s[1], s[2], dst);
    return dst;
  }
}

class Node {
  constructor(source) {
    this.parent = null
    this.children = []
    this.localMatrix = m4.identity()
    this.worldMatrix = m4.identity()
    this.source = source
  }

  setParent(parent) {
    if(this.parent) {
      const index = this.parent.children.indeOf(this)
      if(index > 0) {
        this.parent.children.splice(index,1)
      }
    }
    if(parent) {
      parent.children.push(this)
    }
    this.parent = parent
  }

  updateWolrdMatrix(parentWorldMatrix) {
    const source = this.source
    if(source) {
      source.getMatrix(this.localMatrix)
    }
    if(parentWorldMatrix) {
      m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix)
    } else {
      // 没有parentWorldMatrix的，自己的localMatrix就是worldMatrix
      m4.copy(this.localMatrix, this.worldMatrix)
    }

    // 设置this的children的worldMatrix
    const worldMatrix = this.worldMatrix
    this.children.forEach((child) => {
      child.updateWolrdMatrix(worldMatrix)
    })
  }
}
function main() {
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl')
  if(!gl) {
    return alert('Your browser do not support webgl!')
  }

  const createFlattenedVertices = function(gl, vertices) {
    var last;
    return webglUtils.createBufferInfoFromArrays(
      gl,
      primitives.makeRandomVertexColors(
        primitives.deindexVertices(vertices),
        {
          vertsPerColor: 1,
          rand: function(ndx, channel) {
            if (channel === 0) {
              last = 128 + Math.random() * 128 | 0;
            }
            return channel < 3 ? last : 255;
          }
        })
    );
  };

  const sphereBufferInfo = createFlattenedVertices(gl, primitives.createSphereVertices(10, 12, 6));


  var programInfo = webglUtils.createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

  function degToRad(d) {
    return d * Math.PI / 180;
  }
  const fieldOfViewRadians = degToRad(60);

  const solarSystemNode = new Node()

  const earthOrbitNode= new Node()
  earthOrbitNode.localMatrix = m4.translation(100, 0, 0);

  const moonOrbitNode = new Node()
  moonOrbitNode.localMatrix = m4.translation(30, 0, 0);

  const sunNode = new Node()
  sunNode.localMatrix = m4.scaling(5, 5, 5);
  sunNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0, 1], // yellow
      u_colorMult:   [0.4, 0.4, 0, 1],
      u_worldInverseTransposeMatrix: undefined,
      u_reverseLightDirection: m4.normalize([100, 0, 100])
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  }

  const earthNode = new Node()
  earthNode.localMatrix = m4.translation(100,0,0)
  earthNode.localMatrix = m4.scaling(2, 2, 2);
  earthNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.2, 0.5, 0.8, 1],  // blue-green
      u_colorMult:   [0.8, 0.5, 0.2, 1],
      u_worldInverseTransposeMatrix: undefined,
      u_reverseLightDirection: m4.normalize([0, 100, 2])
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  }

  const moonNode = new Node()
  moonNode.localMatrix = m4.scaling(0.4, 0.4, 0.4);
  moonNode.drawInfo = {
    uniforms: {
      u_matrix: undefined,
      u_colorOffset: [0.6, 0.6, 0.6, 1],  // gray
      u_colorMult:   [0.1, 0.1, 0.1, 1],
      u_worldInverseTransposeMatrix: undefined,
      u_reverseLightDirection: m4.normalize([0, 100, 2])
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  }

  sunNode.setParent(solarSystemNode);
  earthOrbitNode.setParent(solarSystemNode);
  earthNode.setParent(earthOrbitNode);
  moonOrbitNode.setParent(earthOrbitNode)
  moonNode.setParent(moonOrbitNode);
  const objects = [
    sunNode,
    earthNode,
    moonNode
  ]

  const objectsToDraw = [
    sunNode.drawInfo,
    earthNode.drawInfo,
    moonNode.drawInfo,
  ]

  requestAnimationFrame(drawScene)

  let then = 0
  function drawScene(time) {
    time *= 0.0005
    let detalTime = time - then;
    then = time;
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000)
    const cameraPosition = [0, -200, 0]
    const target = [0,0,0]
    const up = [0,0,1]
    const cameraMatrix = m4.lookAt(cameraPosition, target, up)

    const viewMatrix = m4.inverse(cameraMatrix)

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

    m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix)
    // 旋转地球结点，地球自转
    m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix)
    // 旋转月球轨道结点，月球会绕地球转
    m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix)
    // 旋转月球结点，月球自转
    m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix)


    solarSystemNode.updateWolrdMatrix();

    objects.forEach(object => {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix)
      const worldInverseMatrix = m4.inverse(object.worldMatrix)
      const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix)
      object.drawInfo.uniforms.u_worldInverseTransposeMatrix = worldInverseTransposeMatrix
    })
    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(object => {
      const programInfo = object.programInfo
      const bufferInfo = object.bufferInfo

      let bindBuffers = false
      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);
        bindBuffers = true;
      }

      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      webglUtils.setUniforms(programInfo, object.uniforms);
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    })
    requestAnimationFrame(drawScene);
  }
}

main()