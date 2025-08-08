// Create scene
var scene = new Scene()

scene.camera.position.set(2, 2, 2)
scene.addOrbitControls()

// Generate world
var world = new World(1, (world) => new NoiseTerrainChunkGenerator(world))
world.generateChunk(0, 0, 0).getBoxes().forEach((v) => scene.add(v))
world.generateChunk(0, -1, 0).getBoxes().forEach((v) => scene.add(v))

// Add light to world
var light1 = new AmbientLight(0xFFFFFF, 0.2)
scene.add(light1)
var light2 = new DirectionalLight(0xFFFFFF, 1.0, new THREE.Vector3(-1, -10, -3))
scene.add(light2)

// animation loop
scene.animate()

