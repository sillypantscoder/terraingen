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
		this.velocity.y -= 0.0075
		// Update camera position
		this.camera.position.y += this.velocity.y
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
		// Update camera position
		this.camera.position.x += this.velocity.x
		this.camera.position.z += this.velocity.z
		// Collision with walls
		if (this.world.getBlock(
			Math.floor(this.camera.position.x),
			Math.floor(this.camera.position.y - 1.5),
			Math.floor(this.camera.position.z)
		)?.isOpaque()) {
			this.camera.position.x -= this.velocity.x
			this.camera.position.z -= this.velocity.z
			this.velocity.setX(0)
			this.velocity.setZ(0)
		}
		// WASD
		this.velocity.x *= 0.9
		this.velocity.z *= 0.9
		var accel = this.onGround ? 0.02 : 0.015
		if (this.keysPressed.has("w")) this.velocity.add(new THREE.Vector3().setFromCylindricalCoords(-accel, this.rotation.x, 0))
		if (this.keysPressed.has("a")) this.velocity.add(new THREE.Vector3().setFromCylindricalCoords(-accel, (Math.PI/2)+this.rotation.x, 0))
		if (this.keysPressed.has("s")) this.velocity.add(new THREE.Vector3().setFromCylindricalCoords(accel, this.rotation.x, 0))
		if (this.keysPressed.has("d")) this.velocity.add(new THREE.Vector3().setFromCylindricalCoords(accel, (Math.PI/2)+this.rotation.x, 0))
		// Jump
		if (this.keysPressed.has(" ") && this.onGround) this.velocity.setY(0.15)
	}
}
class PlayerRenderLoader extends TickingSceneObject {
	/**
	 * @param {() => THREE.Vector3} getPosition
	 * @param {World<any>} world
	 * @param {(o: SceneObject) => void} addObject
	 * @param {(o: SceneObject) => void} removeObject
	 */
	constructor(getPosition, world, addObject, removeObject) {
		super()
		this.getPosition = getPosition
		this.world = world
		this.addObject = addObject
		this.removeObject = removeObject
		/** @type {Map<Chunk<any>, SceneObject[]>} */
		this.chunksAdded = new Map()
		this.renderDistance = 4
	}
	tick() {
		var position = this.getPosition()
		var chunkX = Math.floor(position.x / 16)
		var chunkY = Math.floor(position.y / 16)
		var chunkZ = Math.floor(position.z / 16)
		// find chunks to be loaded
		/** @type {Set<Chunk<any>>} */
		var chunksToBeAdded = new Set()
		for (var x = -this.renderDistance; x <= this.renderDistance; x++) {
			for (var y = 1-this.renderDistance; y <= this.renderDistance-1; y++) {
				for (var z = -this.renderDistance; z <= this.renderDistance; z++) {
					chunksToBeAdded.add(this.world.generateChunk(chunkX + x, chunkY + y, chunkZ + z))
				}
			}
		}
		// remove old chunks
		for (var c of [...this.chunksAdded.keys()]) {
			if (! chunksToBeAdded.has(c)) {
				// Unload this chunk
				/** @type {SceneObject[]} */
				var objects = this.chunksAdded.get(c) ?? []
				objects.forEach(this.removeObject)
				this.chunksAdded.delete(c)
				return; // less glitchy to do it on separate frames
			}
		}
		// add new chunks
		var chunksToBeAddedOrdered = [...chunksToBeAdded]
		chunksToBeAddedOrdered.sort((a, b) =>
			new THREE.Vector3(a.chunkPos.x*16, a.chunkPos.y*4, a.chunkPos.z*16).distanceToSquared(position) -
			new THREE.Vector3(b.chunkPos.x*16, b.chunkPos.y*4, b.chunkPos.z*16).distanceToSquared(position) )
		for (var c of chunksToBeAddedOrdered) {
			if (this.chunksAdded.has(c)) continue;
			/** @type {SceneObject[]} */
			var objects = Rendering.getPlanesForChunk(c, false)
			objects.forEach(this.addObject)
			this.chunksAdded.set(c, objects)
			return; // less glitchy to do it on separate frames
		}
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
