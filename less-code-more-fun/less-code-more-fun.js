function main() {
  const canvas = document.getElementById('canvas')
  const gl = canvas.getContext('webgl')
  if(!gl) {
    return alert('Your browser do not support webgl!')
  }

  
  const buffers = window.primitives.createSphereBuffers(gl, 10, 48, 24);
  
  const program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d'])
  const uniformSetters = webglUtils.createUniformSetters(gl, program);
  const attribSetters = webglUtils.createAttributeSetters(gl, program);

  const attribs = {
    a_position: {buffer: buffers.position, numComponents: 3},
    a_normal: {buffer: buffers.normal, numComponents: 3},
    a_texcoord: {buffer: buffers.texcoord, numComponents: 2}
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  const uniformThatAreTheSameForAllObjects = {
    u_lightWorldPos: [-50, 30, 100],
    u_viewInverse: m4.identity(),
    u_lightColor: [1,1,1,1]
  }

  const uniformThatAreComputedForEachObject = {
    u_worldViewProjection: m4.identity(),
    u_world: m4.identity(),
    u_worldInverseTranspose: m4.identity()
  }

  const rand = function (min, max) {
    if(max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max-min)
  }

  const randInt = function(range) {
    return Math.floor(Math.random() * range)
  }

  const textures = [
    textureUtils.makeStripeTexture(gl, {color1: '#FFF', color2: '#CCC'}),
    textureUtils.makeCheckerTexture(gl, {color1: '#FFF', color2: '#CCC'}),
    textureUtils.makeCircleTexture(gl, {color1: '#FFF', color2: '#CCC'}),
  ]

  const objects = []
  const numObjects = 300
  let baseColor = rand(240)

  for (let i=0; i<numObjects; i++) {
    objects.push({
      radius: rand(150),
      xRotation: rand(Math.PI * 2),
      yRotation: rand(Math.PI),
      materialUniforms: {
        u_colorMult: chroma.hsv(rand(baseColor, baseColor+120), 0.5, 1).gl(),
        u_diffuse: textures[randInt(textures.length)],
        u_specular: [1,1,1,1],
        u_shininess: rand(500),
        u_specularFactor: rand(1)
      }
    })
  }

  requestAnimationFrame(drawScene)

  function drawScene(time) {
    time = time * 0.0001 + 5;
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0,0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    const aspect = gl.canvas.width / gl.canvas.height;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    const cameraPosition = [0, 0, 100];
    const target = [0,0,0];
    const up = [0,1,0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up, uniformThatAreTheSameForAllObjects.u_viewInverse)
    const viewMatrix = m4.inverse(cameraMatrix)

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

    gl.useProgram(program)
    
    webglUtils.setAttributes(attribSetters, attribs)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    webglUtils.setUniforms(uniformSetters, uniformThatAreTheSameForAllObjects)

    objects.forEach(object => {
      let worldMatrix = m4.xRotation(object.xRotation * time)
      worldMatrix = m4.yRotate(worldMatrix, object.yRotation * time)
      worldMatrix = m4.translate(worldMatrix, 0, 0, object.radius)
      uniformThatAreComputedForEachObject.u_world = worldMatrix

      m4.multiply(viewProjectionMatrix, worldMatrix, uniformThatAreComputedForEachObject.u_worldViewProjection);
      m4.transpose(m4.inverse(worldMatrix), uniformThatAreComputedForEachObject.u_worldInverseTranspose);

      webglUtils.setUniforms(uniformSetters, uniformThatAreComputedForEachObject)

      webglUtils.setUniforms(uniformSetters, object.materialUniforms)

      gl.drawElements(gl.TRIANGLES, buffers.numElements, gl.UNSIGNED_SHORT, 0)

    })
    requestAnimationFrame(drawScene);
  }
}

main()