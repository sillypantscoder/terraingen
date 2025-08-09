class PlayerCamera extends TickingSceneObject {
	/**
	 * @param {THREE.PerspectiveCamera} camera
	 * @param {HTMLElement} elm
	 * @param {World<any>} world
	 */
	constructor(camera, elm, world) {
		super()
		this.camera = camera
		this.elm = elm
		this.world = world
		this.addEventListeners()
		// setup physics
		this.rotation = new THREE.Vector2(0, 0)
		this.velocity = new THREE.Vector3(0, 0, 0)
		this.onGround = false
		/** @type {Set<string>} */
		this.keysPressed = new Set()
	}
	addEventListeners() {
		this.elm.setAttribute("tabindex", "0")
		this.elm.addEventListener("keydown", ((/** @type {KeyboardEvent} */ e) => {
			if (" wasd".includes(e.key)) this.keysPressed.add(e.key)
			else console.log("Key:", e.key)
		}).bind(this))
		this.elm.addEventListener("keyup", ((/** @type {KeyboardEvent} */ e) => {
			this.keysPressed.delete(e.key)
		}).bind(this))
		this.elm.addEventListener("mousemove", ((/** @type {MouseEvent} */ e) => {
			if (e.buttons == 0) return;
			// update rotation
			this.rotation.x += e.movementX / 500
			this.rotation.y += e.movementY / 500
			// set camera rotation
			var quaternion = new THREE.Quaternion()
			quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.x))
			quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.rotation.y))
			this.camera.rotation.setFromQuaternion(quaternion)
		}).bind(this))
	}
	tick() {
		// Gravity
		this.velocity.setY(this.velocity.y - 0.01)
		// Update camera position
		this.camera.position.add(this.velocity)
		// Collision with ground
		if (this.world.getBlock(
			Math.floor(this.camera.position.x),
			Math.floor(this.camera.position.y - 1.5),
			Math.floor(this.camera.position.z)
		)?.isOpaque()) {
			this.camera.position.setY(0.5 + Math.floor(this.camera.position.y))
			this.velocity.setY(0)
			this.onGround = true;
		} else this.onGround = false;
		// WASD
		this.velocity.x *= 0.9
		this.velocity.z *= 0.9
		var accel = this.onGround ? 0.02 : 0.015
		if (this.keysPressed.has("w")) this.velocity.add(new THREE.Vector3().setFromCylindricalCoords(-accel, this.rotation.x, 0))
		if (this.keysPressed.has("a")) this.velocity.add(new THREE.Vector3().setFromCylindricalCoords(-accel, (Math.PI/2)+this.rotation.x, 0))
		if (this.keysPressed.has("s")) this.velocity.add(new THREE.Vector3().setFromCylindricalCoords(accel, this.rotation.x, 0))
		if (this.keysPressed.has("d")) this.velocity.add(new THREE.Vector3().setFromCylindricalCoords(accel, (Math.PI/2)+this.rotation.x, 0))
		// Jump
		if (this.keysPressed.has(" ") && this.onGround) this.velocity.setY(0.3)
	}
}

class Rendering {
	/**
	 * @param {Chunk<any>} chunk
	 * @param {boolean} topOnly
	 */
	static getBoxesForChunk(chunk, topOnly) {
		var boxes = []
		for (var x = 0; x < 16; x++) {
			for (var z = 0; z < 16; z++) {
				for (var y = 15; y >= 0; y--) {
					var state = chunk.getBlock(x, y, z)
					if (state == null) continue;
					if (chunk.isBlockHidden(x, y, z)) continue;
					boxes.push(Box.fromCorner(
						new THREE.Vector3((chunk.chunkPos.x * 16) + x, (chunk.chunkPos.y * 16) + y, (chunk.chunkPos.z * 16) + z),
						new THREE.Vector3(1, 1, 1),
						state.getColor()
					))
					if (topOnly) break;
				}
			}
		}
		return boxes
	}
	/**
	 * @param {Chunk<any>} chunk
	 * @param {boolean} topOnly
	 */
	static getPlanesForChunk(chunk, topOnly) {
		/** @type {Object<string, Triangle[]>} */
		var planes = {}
		for (var x = 0; x < 16; x++) {
			for (var z = 0; z < 16; z++) {
				for (var y = 15; y >= 0; y--) {
					var state = chunk.getBlock(x, y, z)
					if (state == null) continue;
					if (chunk.isBlockHidden(x, y, z)) continue;
					// create block
					var blockOrigin = new THREE.Vector3((chunk.chunkPos.x * 16) + x, (chunk.chunkPos.y * 16) + y, (chunk.chunkPos.z * 16) + z)
					var allFaces = Geometry.createCuboid(blockOrigin, new THREE.Vector3(1, 1, 1))
					for (var face of [
						new THREE.Vector3(-1, 0, 0),
						new THREE.Vector3(1, 0, 0),
						new THREE.Vector3(0, -1, 0),
						new THREE.Vector3(0, 1, 0),
						new THREE.Vector3(0, 0, -1),
						new THREE.Vector3(0, 0, 1)
					]) {
						// Create geometry for this face, unless there is an opaque block there
						let blockOnThisFace = chunk.getBlock(x + face.x, y + face.y, z + face.z)
						if (! blockOnThisFace?.isOpaque()) {
							let faceGeometry = allFaces[`${face.x},${face.y},${face.z}`]
							if (! Object.keys(planes).includes(state.getColor().toString())) planes[state.getColor().toString()] = []
							planes[state.getColor().toString()].push(...faceGeometry)
						}
					}
					if (topOnly) break;
				}
			}
		}
		var meshes = []
		for (var _color of Object.keys(planes)) {
			var triangles = planes[_color]
			var color = Number(_color)
			meshes.push(new Geometry(triangles, color))
		}
		return meshes
	}
}
