/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { VertexAttribute } from './vertex-attribute.js';

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

export { VertexFormat };