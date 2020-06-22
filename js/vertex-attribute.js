/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines vertex attribute class.
 * There are following possible types:
 * - position
 * - normal
 * - texcoord
 *
 * @param {Number} count Number of components.
 * @param {GLenum} dataType The data type of each component in the array.
 * @param {String} type The attribute type.
 */
function VertexAttribute(count, dataType, type) {
	this.count = count;
	this.dataType = dataType;
	this.type = type;
	this.offset = 0;

	/**
	 * Returns attribute size in bytes.
	 *
	 * @param {WebGLRenderingContext} gl Rendering context.
	 */
	this.getSize = function(gl) {
		switch (this.dataType) {
		case gl.FLOAT:
			return 4; // for 32-bit float
		case gl.BYTE:
		case gl.UNSIGNED_BYTE:
			return 1;
		case gl.SHORT:
		case gl.UNSIGNED_SHORT:
			return 2;
		default:
			return 4;
		}
	}
}

export { VertexAttribute };