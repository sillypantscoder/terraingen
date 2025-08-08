class SceneObject {
	constructor() {
		/** @type {THREE.Object3D[]} */
		this.three_objects = []
	}
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
		/** @type {THREE.Controls | null} */
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