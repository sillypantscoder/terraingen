class SceneObject {
	constructor() {
		/** @type {THREE.Object3D[]} */
		this.three_objects = []
	}
}
class TickingSceneObject extends SceneObject {
	tick() {}
}
class Box extends SceneObject {
	/**
	 * @param {THREE.Vector3} centerPos
	 * @param {THREE.Vector3} size
	 * @param {number} color
	 */
	constructor(centerPos, size, color) {
		super()
		var geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
		geometry.translate(centerPos.x, centerPos.y, centerPos.z);
		var material = new THREE.MeshStandardMaterial({ color });
		var mesh = new THREE.Mesh(geometry, material);
		this.three_objects.push(mesh);
	}
	/**
	 * @param {THREE.Vector3} cornerPos
	 * @param {THREE.Vector3} size
	 * @param {number} color
	 */
	static fromCorner(cornerPos, size, color) {
		return new Box(new THREE.Vector3(
			cornerPos.x + (size.x / 2),
			cornerPos.y + (size.y / 2),
			cornerPos.z + (size.z / 2)
		), size, color)
	}
}
class Geometry extends SceneObject {
	/**
	 * @typedef {{ point1: THREE.Vector3, point2: THREE.Vector3, point3: THREE.Vector3 }} Triangle
	 * @param {Triangle[]} triangles
	 * @param {number} color
	 */
	constructor(triangles, color) {
		super()
		this.triangles = triangles
		// create mesh
		let vertices = new Float32Array(triangles.flatMap((triangle) => [
			...triangle.point1.toArray(),
			...triangle.point2.toArray(),
			...triangle.point3.toArray()
		]));
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		geometry.computeVertexNormals()
		const material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide })
		const mesh = new THREE.Mesh(geometry, material);
		this.three_objects.push(mesh)
	}
	/**
	 * @param {THREE.Vector3} pos
	 * @param {THREE.Vector3} size
	 * @returns {Object<string, Triangle[]>}
	 */
	static createCuboid(pos, size) {
		return {
			"-1,0,0": Geometry.createPlaneX(new THREE.Vector3(pos.x         , pos.y, pos.z), new THREE.Vector2(size.z, size.y)),
			 "1,0,0": Geometry.createPlaneX(new THREE.Vector3(pos.x + size.x, pos.y, pos.z), new THREE.Vector2(size.z, size.y)),
			"0,-1,0": Geometry.createPlaneY(new THREE.Vector3(pos.x, pos.y         , pos.z), new THREE.Vector2(size.x, size.z)),
			 "0,1,0": Geometry.createPlaneY(new THREE.Vector3(pos.x, pos.y + size.y, pos.z), new THREE.Vector2(size.x, size.z)),
			"0,0,-1": Geometry.createPlaneZ(new THREE.Vector3(pos.x, pos.y, pos.z         ), new THREE.Vector2(size.x, size.y)),
			 "0,0,1": Geometry.createPlaneZ(new THREE.Vector3(pos.x, pos.y, pos.z + size.z), new THREE.Vector2(size.x, size.y))
		}
	}
	/**
	 * @param {THREE.Vector3} pos
	 * @param {THREE.Vector2} size
	 */
	static createPlaneX(pos, size) {
		return [
			{
				point1: new THREE.Vector3(pos.x, pos.y, pos.z),
				point2: new THREE.Vector3(pos.x, pos.y + size.y, pos.z),
				point3: new THREE.Vector3(pos.x, pos.y, pos.z + size.x)
			},
			{
				point1: new THREE.Vector3(pos.x, pos.y + size.y, pos.z + size.x),
				point2: new THREE.Vector3(pos.x, pos.y + size.y, pos.z),
				point3: new THREE.Vector3(pos.x, pos.y, pos.z + size.x)
			}
		]
	}
	/**
	 * @param {THREE.Vector3} pos
	 * @param {THREE.Vector2} size
	 */
	static createPlaneY(pos, size) {
		return [
			{
				point1: new THREE.Vector3(pos.x, pos.y, pos.z),
				point2: new THREE.Vector3(pos.x, pos.y, pos.z + size.y),
				point3: new THREE.Vector3(pos.x + size.x, pos.y, pos.z),
			},
			{
				point1: new THREE.Vector3(pos.x + size.x, pos.y, pos.z + size.y),
				point2: new THREE.Vector3(pos.x, pos.y, pos.z + size.y),
				point3: new THREE.Vector3(pos.x + size.x, pos.y, pos.z),
			}
		]
	}
	/**
	 * @param {THREE.Vector3} pos
	 * @param {THREE.Vector2} size
	 */
	static createPlaneZ(pos, size) {
		return [
			{
				point1: new THREE.Vector3(pos.x, pos.y, pos.z),
				point2: new THREE.Vector3(pos.x, pos.y + size.y, pos.z),
				point3: new THREE.Vector3(pos.x + size.x, pos.y, pos.z),
			},
			{
				point1: new THREE.Vector3(pos.x + size.x, pos.y + size.y, pos.z),
				point2: new THREE.Vector3(pos.x, pos.y + size.y, pos.z),
				point3: new THREE.Vector3(pos.x + size.x, pos.y, pos.z),
			}
		]
	}
}
class Light extends SceneObject {
	/**
	 * @param {THREE.Light} light
	 */
	constructor(light) {
		super()
		this.three_objects.push(light)
	}
}
class AmbientLight extends Light {
	/**
	 * @param {number} color
	 * @param {number} intensity
	 */
	constructor(color, intensity) {
		var light = new THREE.AmbientLight(color, intensity)
		super(light)
	}
}
class DirectionalLight extends Light {
	/**
	 * @param {number} color
	 * @param {number} intensity
	 * @param {THREE.Vector3} direction
	 */
	constructor(color, intensity, direction) {
		var light = new THREE.DirectionalLight(color, intensity)
		light.position.copy(direction.clone().multiplyScalar(-5))
		light.target.position.set(0, 0, 0)
		super(light)
	}
}

class Scene {
	constructor() {
		// object list
		/** @type {SceneObject[]} */
		this.objects = []
		/** @type {(THREE.Controls & { target: THREE.Vector3 }) | null} */
		this.controls = null
		// Scene/camera
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
		// Setup the renderer
		this.renderer = new THREE.WebGLRenderer({ alpha: true });
		this.renderer.setClearColor(0x000000, 0);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);
	}
	async animate() {
		while (true) {
			this.renderFrame()
			await new Promise((resolve) => requestAnimationFrame(resolve))
		}
	}
	renderFrame() {
		// Tick objects
		this.objects.forEach((v) => {
			if (v instanceof TickingSceneObject) {
				v.tick()
			}
		})
		// Render
		this.renderer.render(this.scene, this.camera)
	}
	/**
	 * @param {SceneObject} object
	 */
	add(object) {
		this.objects.push(object)
		for (var i = 0; i < object.three_objects.length; i++) {
			this.scene.add(object.three_objects[i])
		}
	}
	addOrbitControls() {
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
	}
}