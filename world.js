class Block {
	constructor() {}
	/**
	 * @abstract
	 * @returns {number}
	 */
	getColor() { throw new Error("Block is an abstract class, getColor must be overridden"); }
	/**
	 * @abstract
	 * @returns {boolean}
	 */
	isOpaque() { throw new Error("Block is an abstract class, isOpaque must be overridden"); }
	// blocks
	static Stone = class Stone extends Block {
		getColor() { return 0x888888; }
		isOpaque() { return true; }
	}
	static Dirt = class Dirt extends Block {
		getColor() { return 0x663300; }
		isOpaque() { return true; }
	}
	static Grass = class Grass extends Block {
		getColor() { return 0x116600; }
		isOpaque() { return true; }
	}
}

/**
 * @template T The chunk information to store in each chunk
 */
class ChunkGenerator {
	/**
	 * @param {World<T>} world
	 */
	constructor(world) {
		this.world = world
	}
	/**
	 * @abstract
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @returns {void}
	 */
	generateChunk(x, y, z) { throw new Error("ChunkGenerator is an abstract class, generateChunk must be overridden"); }
}

/**
 * @template T The chunk information to store
 */
class Chunk {
	/**
	 * @param {number} chunkX
	 * @param {number} chunkY
	 * @param {number} chunkZ
	 */
	constructor(chunkX, chunkY, chunkZ) {
		this.chunkPos = {
			x: chunkX,
			y: chunkY,
			z: chunkZ
		}
		/** @type {T | null} */
		this.dimensionData = null
		/** @type {(Block | null)[][][]} */
		this.blocks = []
		// Fill blocks with air
		for (var x = 0; x < 16; x++) {
			/** @type {(Block | null)[][]} */
			var layer = []
			this.blocks.push(layer)
			for (var y = 0; y < 16; y++) {
				/** @type {null[]} */
				var row = []
				layer.push(row)
				for (var z = 0; z < 16; z++) {
					row.push(null)
				}
			}
		}
	}
	/**
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} cz
	 * @param {Block | null} state
	 */
	setBlock(cx, cy, cz, state) {
		this.blocks[cx][cy][cz] = state
	}
	/**
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} cz
	 * @returns {Block | null}
	 */
	getBlock(cx, cy, cz) {
		return this.blocks[cx][cy][cz]
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	isBlockHidden(x, y, z) {
		if (x <= 0 || y <= 0 || z <= 0) return false;
		if (x >= 15 || y >= 15 || z >= 15) return false;
		if (! this.getBlock(x - 1, y, z)?.isOpaque()) return false;
		if (! this.getBlock(x + 1, y, z)?.isOpaque()) return false;
		if (! this.getBlock(x, y - 1, z)?.isOpaque()) return false;
		if (! this.getBlock(x, y + 1, z)?.isOpaque()) return false;
		if (! this.getBlock(x, y, z - 1)?.isOpaque()) return false;
		if (! this.getBlock(x, y, z + 1)?.isOpaque()) return false;
		return true;
	}
	getBoxes() {
		var boxes = []
		for (var x = 0; x < 16; x++) {
			for (var y = 0; y < 16; y++) {
				for (var z = 0; z < 16; z++) {
					var state = this.getBlock(x, y, z)
					if (state == null) continue;
					if (this.isBlockHidden(x, y, z)) continue;
					boxes.push(Box.fromCorner(
						new THREE.Vector3((this.chunkPos.x * 16) + x, (this.chunkPos.y * 16) + y, (this.chunkPos.z * 16) + z),
						new THREE.Vector3(1, 1, 1),
						state.getColor()
					))
				}
			}
		}
		return boxes
	}
}

/**
 * @template T The chunk information to store in each chunk
 */
class World {
	/**
	 * @param {number} seed
	 * @param {(world: World<T>) => ChunkGenerator<T>} chunkGenerator
	 */
	constructor(seed, chunkGenerator) {
		this.seed = seed
		this.noise = new PerlinNoiseGenerator(seed)
		this.chunkGenerator = chunkGenerator(this)
		/** @type {Object<string, Chunk<T>>}} */
		this.chunks = {}
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	getChunk(x, y, z) {
		var chunk = this.chunks[`${x},${y},${z}`]
		if (chunk == undefined) {
			chunk = new Chunk(x, y, z)
			this.chunks[`${x},${y},${z}`] = chunk
		}
		return chunk
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	generateChunk(x, y, z) {
		this.chunkGenerator.generateChunk(x, y, z)
		return this.getChunk(x, y, z)
	}
}

