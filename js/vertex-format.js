/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

'use strict';

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

/**
 * Defines vertex format class.
 *
 * @param {WebGLRenderingContext} gl Rendering context.
 * @param {Array} attributes Array of attributes.
 */
function VertexFormat(gl, attributes) {
	var stride = 0;

	this.attributes = attributes;
	for (let i = 0; i < this.attributes.length; i++) {
		let attribute = this.attributes[i];
		let size = attribute.getSize(gl);
		attribute.offset = stride;
		stride += size * attribute.count;
	}

	/**
	 * Returns vertex stride in bytes.
	 */
	this.getStride = function() {
		return stride;
	}
}