/**
 * Smooth noise generator. Adapted from https://gist.github.com/alksily/7a85a1898e65c936f861ee93516e397d
 */
class PerlinNoiseGenerator {
	/**
	 * @param {number} seed
	 */
	constructor(seed) {
		this.seed = seed;
		this.default_size = 35;
		/** * @type {number[]} */
		this.p = [];
		/** * @type {number[]} */
		this.permutation = [];
		this.init();
	}
	init() {
		// Initialize the permutation array.
		this.p = [];
		this.permutation = [ 151, 160, 137, 91, 90, 15, 131, 13, 201,
				95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99,
				37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26,
				197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88,
				237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74,
				165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111,
				229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40,
				244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76,
				132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159,
				86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
				124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207,
				206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170,
				213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155,
				167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113,
				224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242,
				193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235,
				249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184,
				84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236,
				205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66,
				215, 61, 156, 180 ];

		// Populate it
		for (var i = 0; i < 256; i++) {
			this.p[256 + i] = this.p[i] = this.permutation[i];
		}
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {number} size
	 */
	noiseXYZS(x, y, z, size) {
		var value = 0.0;
		var initialSize = size;
		while (size >= 1) {
			value += this.smoothNoise((x / size), (y / size), (z / size)) * size;
			size /= 2.0;
		}
		return value / initialSize;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	noiseXYZ(x, y, z) {
		return this.noiseXYZS(x, y, z, this.default_size)
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	noiseXY(x, y) {
		return this.noiseXYZS(x, y, 0, this.default_size)
	}

    /**
	 * @param {number} x
	 */
    noiseX(x) {
        return this.noiseXYZS(x, 0, 0, this.default_size)
    }

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	smoothNoise(x, y, z) {
		// Offset each coordinate by the seed value
		x += this.seed;
		y += this.seed;
		x += this.seed;

		var X = Math.floor(x) & 255; // FIND UNIT CUBE THAT
		var Y = Math.floor(y) & 255; // CONTAINS POINT.
		var Z = Math.floor(z) & 255;

		x -= Math.floor(x); // FIND RELATIVE X,Y,Z
		y -= Math.floor(y); // OF POINT IN CUBE.
		z -= Math.floor(z);

		var u = this.fade(x); // COMPUTE FADE CURVES
		var v = this.fade(y); // FOR EACH OF X,Y,Z.
		var w = this.fade(z);

		var A = this.p[X] + Y;
		var AA = this.p[A] + Z;
		var AB = this.p[A + 1] + Z; // HASH COORDINATES OF
		var B = this.p[X + 1] + Y;
		var BA = this.p[B] + Z;
		var BB = this.p[B + 1] + Z; // THE 8 CUBE CORNERS,

        var lerp = this.lerp, grad = this.grad, p = this.p;
		return lerp(w, lerp(v, lerp(u, grad(p[AA], 		x, 		y, 		z		), 	// AND ADD
										grad(p[BA],		x - 1, 	y, 		z		)), // BLENDED
								lerp(u, grad(p[AB], 	x, 		y - 1, 	z		), 	// RESULTS
										grad(p[BB], 	x - 1, 	y - 1, 	z		))),// FROM 8
						lerp(v, lerp(u, grad(p[AA + 1], x, 		y, 		z - 1	), 	// CORNERS
										grad(p[BA + 1], x - 1, 	y, 		z - 1	)), // OF CUBE
								lerp(u, grad(p[AB + 1], x, 		y - 1,	z - 1	),
										grad(p[BB + 1], x - 1, 	y - 1, 	z - 1	))));
	}

	/**
	 * @param {number} t
	 */
	fade(t) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}

	/**
	 * @param {number} t
	 * @param {number} a
	 * @param {number} b
	 */
	lerp(t, a, b) {
		return a + t * (b - a);
	}

	/**
	 * @param {number} hash
	 * @param {any} x
	 * @param {any} y
	 * @param {any} z
	 */
	grad(hash, x, y, z) {
		var h = hash & 15; // CONVERT LO 4 BITS OF HASH CODE
		var u = h < 8 ? x : y, // INTO 12 GRADIENT DIRECTIONS.
		    v = h < 4 ? y : h == 12 || h == 14 ? x : z;
		return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
	}
}

/** @extends {ChunkGenerator<{ }>} */
class NoiseTerrainChunkGenerator extends ChunkGenerator {
	/**
	 * @param {World<{ }>} world
	 */
	constructor(world) {
		super(world)
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	generateChunk(x, y, z) {
		var chunk = this.world.getChunk(x, y, z)
		// Go through all the blocks
		for (var cx = 0; cx < 16; cx++) {
			for (var cz = 0; cz < 16; cz++) {
				var columnHeight = this.world.noise.noiseXYZ(
					((16*x)+cx) / 4,
					((16*z)+cz) / 4,
				0) * 20
				for (var cy = 0; cy < 16; cy++) {
					if ((16*y)+cy <= columnHeight) chunk.setBlock(cx, cy, cz, new Block.Grass())
					if ((16*y)+cy <= columnHeight - 1) chunk.setBlock(cx, cy, cz, new Block.Dirt())
					if ((16*y)+cy <= columnHeight - 5) chunk.setBlock(cx, cy, cz, new Block.Stone())
				}
			}
		}
		// Mark as generated
		chunk.dimensionData = {}
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	isChunkGenerated(x, y, z) {
		var chunk = this.world.getChunk(x, y, z)
		return chunk.dimensionData != null
	}
}

