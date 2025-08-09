// Create scene
var scene = new Scene()

var light1 = new AmbientLight(0xFFFFFF, 0.2)
scene.add(light1)
var light2 = new DirectionalLight(0xFFFFFF, 1.0, new THREE.Vector3(-1, -10, -3))
scene.add(light2)

// Generate world
var world = new World(1, (world) => new NoiseTerrainChunkGenerator(world))
for (let cx of [-1, 0, 1]) {
	for (let cy of [-1, 0, 1]) {
		for (let cz of [-1, 0, 1]) {
			world.generateChunk(cx, cy, cz)
		}
	}
}

// Create player
scene.camera.position.set(16, 8, 16)
scene.add(new PlayerCamera(scene.camera, scene.renderer.domElement, world))
scene.add(new PlayerRenderLoader(() => scene.camera.position.clone(), world, (o) => scene.add(o), (o) => scene.remove(o)))

// animation loop
scene.animate()

