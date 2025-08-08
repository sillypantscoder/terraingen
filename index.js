var scene = new Scene()

scene.camera.position.set(2, 2, 2)
scene.addOrbitControls()

var box = new Box()
scene.add(box)

var light1 = new AmbientLight(0xFFFF00, 0.2)
scene.add(light1)
var light2 = new DirectionalLight(0xFFFF00, 1.0, new THREE.Vector3(-1, -10, -3))
scene.add(light2)

// animation loop
scene.animate()

