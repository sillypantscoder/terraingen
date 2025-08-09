// Create scene
var scene = new Scene()

scene.camera.position.set(16, 8, 16)
scene.addOrbitControls()
scene.controls?.target.set(16, 0, 16)
scene.controls?.update()

// Generate world
var world = new World(1, (world) => new NoiseTerrainChunkGenerator(world))
for (let cx of [-1, 0, 1]) {
	for (let cy of [-1, 0, 1]) {
		for (let cz of [-1, 0, 1]) {
			Rendering.getBoxesForChunk(world.generateChunk(cx, cy, cz), false).forEach((v) => scene.add(v))
		}
	}
}
// scene.add(new Geometry(Geometry.createPlaneY(
// 	new THREE.Vector3(0, 0, 0),
// 	new THREE.Vector2(2, 1)
// ), 0xFF0000))

// Add light to world
var light1 = new AmbientLight(0xFFFFFF, 0.2)
scene.add(light1)
var light2 = new DirectionalLight(0xFFFFFF, 1.0, new THREE.Vector3(-1, -10, -3))
scene.add(light2)

// animation loop
scene.animate()

