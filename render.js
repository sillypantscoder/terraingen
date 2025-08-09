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
		var planes = []
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
						let blockOnThisFace = chunk.getBlock(blockOrigin.x + face.x, blockOrigin.y + face.y, blockOrigin.z + face.z)
						if (! blockOnThisFace?.isOpaque()) {
							let faceGeometry = allFaces[`${face.x},${face.y},${face.z}`]
							planes.push(new Geometry(faceGeometry, state.getColor()))
						}
					}
					if (topOnly) break;
				}
			}
		}
		return planes
	}
}
