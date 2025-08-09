// Create scene
var scene = new Scene()

var light1 = new AmbientLight(0xFFFFFF, 0.2)
scene.add(light1)
var light2 = new DirectionalLight(0xFFFFFF, 1.0, new THREE.Vector3(-1, -10, -3))
scene.add(light2)

// Generate world
var world = new World(1, (world) => new NoiseTerrainChunkGenerator(world))
for (let cx of [-2, -1, 0, 1, 2]) {
	for (let cy of [-2, -1, 0, 1, 2]) {
		for (let cz of [-2, -1, 0, 1, 2]) {
			Rendering.getPlanesForChunk(world.generateChunk(cx, cy, cz), false).forEach((v) => scene.add(v))
		}
	}
}

// Create player
scene.camera.position.set(16, 8, 16)
scene.add(new PlayerCamera(scene.camera, scene.renderer.domElement, world))

// animation loop
scene.animate()

