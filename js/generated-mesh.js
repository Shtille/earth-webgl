/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { Mesh } from './mesh.js';

/**
 * Defines generated mesh class.
 * Extends mesh class with some mesh generating functions.
 * This functionality was separated due to possibility of excluding this module.
 *
 * @param {WebGLRenderingContext} gl              Rendering context.
 * @param {VertexFormat}          vertexFormat    Vertex format.
 */
function GeneratedMesh(gl, vertexFormat) {
	// Call base class constructor
	Mesh.apply(this, arguments);

	/**
	 * Creates cube mesh.
	 */
	this.createCube = function() {
		this._vertices = new Array(24);
		// +X side
		this._vertices[0] = {
			position: [1.0,  1.0,  1.0],
			normal: [1.0,  0.0,  0.0],
			texcoord: [0.0,  1.0],
		};
		this._vertices[1] = {
			position: [1.0, -1.0,  1.0],
			normal: [1.0,  0.0,  0.0],
			texcoord: [0.0,  0.0],
		};
		this._vertices[2] = {
			position: [1.0,  1.0, -1.0],
			normal: [1.0,  0.0,  0.0],
			texcoord: [1.0,  1.0],
		};
		this._vertices[3] = {
			position: [1.0, -1.0, -1.0],
			normal: [1.0,  0.0,  0.0],
			texcoord: [1.0,  0.0],
		};
		// -Z side
		this._vertices[4] = {
			position: [1.0,  1.0, -1.0],
			normal: [0.0,  0.0, -1.0],
			texcoord: [0.0,  1.0],
		};
		this._vertices[5] = {
			position: [1.0, -1.0, -1.0],
			normal: [0.0,  0.0, -1.0],
			texcoord: [0.0,  0.0],
		};
		this._vertices[6] = {
			position: [-1.0,  1.0, -1.0],
			normal: [0.0,  0.0, -1.0],
			texcoord: [1.0,  1.0],
		};
		this._vertices[7] = {
			position: [-1.0, -1.0, -1.0],
			normal: [0.0,  0.0, -1.0],
			texcoord: [1.0,  0.0],
		};
		// -X side
		this._vertices[8] = {
			position: [-1.0,  1.0, -1.0],
			normal: [-1.0,  0.0,  0.0],
			texcoord: [0.0,  1.0],
		};
		this._vertices[9] = {
			position: [-1.0, -1.0, -1.0],
			normal: [-1.0,  0.0,  0.0],
			texcoord: [0.0,  0.0],
		};
		this._vertices[10] = {
			position: [-1.0,  1.0,  1.0],
			normal: [-1.0,  0.0,  0.0],
			texcoord: [1.0,  1.0],
		};
		this._vertices[11] = {
			position: [-1.0, -1.0,  1.0],
			normal: [-1.0,  0.0,  0.0],
			texcoord: [1.0,  0.0],
		};
		// +Z side
		this._vertices[12] = {
			position: [-1.0,  1.0,  1.0],
			normal: [0.0,  0.0,  1.0],
			texcoord: [0.0,  1.0],
		};
		this._vertices[13] = {
			position: [-1.0, -1.0,  1.0],
			normal: [0.0,  0.0,  1.0],
			texcoord: [0.0,  0.0],
		};
		this._vertices[14] = {
			position: [ 1.0,  1.0,  1.0],
			normal: [0.0,  0.0,  1.0],
			texcoord: [1.0,  1.0],
		};
		this._vertices[15] = {
			position: [ 1.0, -1.0,  1.0],
			normal: [0.0,  0.0,  1.0],
			texcoord: [1.0,  0.0],
		};
		// +Y side
		this._vertices[16] = {
			position: [ 1.0,  1.0,  1.0],
			normal: [0.0,  1.0,  0.0],
			texcoord: [1.0,  1.0],
		};
		this._vertices[17] = {
			position: [ 1.0,  1.0, -1.0],
			normal: [0.0,  1.0,  0.0],
			texcoord: [0.0,  1.0],
		};
		this._vertices[18] = {
			position: [-1.0,  1.0,  1.0],
			normal: [0.0,  1.0,  0.0],
			texcoord: [1.0,  0.0],
		};
		this._vertices[19] = {
			position: [-1.0,  1.0, -1.0],
			normal: [0.0,  1.0,  0.0],
			texcoord: [0.0,  0.0],
		};
		// -Y side
		this._vertices[20] = {
			position: [ 1.0, -1.0, -1.0],
			normal: [0.0, -1.0,  0.0],
			texcoord: [1.0,  1.0],
		};
		this._vertices[21] = {
			position: [ 1.0, -1.0,  1.0],
			normal: [0.0, -1.0,  0.0],
			texcoord: [0.0,  1.0],
		};
		this._vertices[22] = {
			position: [-1.0, -1.0, -1.0],
			normal: [0.0, -1.0,  0.0],
			texcoord: [1.0,  0.0],
		};
		this._vertices[23] = {
			position: [-1.0, -1.0,  1.0],
			normal: [0.0, -1.0,  0.0],
			texcoord: [0.0,  0.0],
		};

		this._indices = [
			0,1,2,3, 3,4,
			4,5,6,7, 7,8,
			8,9,10,11, 11,12,
			12,13,14,15, 15,16,
			16,17,18,19, 19,20,
			20,21,22,23
		];
	};

	/**
	 * Creates sphere mesh.
	 *
	 * @param {Number} radius  The radius.
	 * @param {Number} slices  The number of slices.
	 * @param {Number} loops   The number of loops.
	 */
	this.createSphere = function(radius, slices, loops) {
		// Fill sinuses and cosinuses values arrays first
		var array_sin_aj = new Array(loops);
		var array_cos_aj = new Array(loops);
		var array_part_j = new Array(loops);
		var array_sin_ai = new Array(slices + 1);
		var array_cos_ai = new Array(slices + 1);
		var array_part_i = new Array(slices + 1);
		for (var j = 0; j < loops; j++) {
			var part_j = j / (loops-1);
			var aj = (Math.PI / (loops-1)) * j;
			array_sin_aj[j] = Math.sin(aj);
			array_cos_aj[j] = Math.cos(aj);
			array_part_j[j] = part_j;
		}
		for (var i = 0; i <= slices; i++) {
			var part_i = i / slices;
			var ai = (2*Math.PI / slices) * i;
			array_sin_ai[i] = Math.sin(ai);
			array_cos_ai[i] = Math.cos(ai);
			array_part_i[i] = part_i;
		}
		// Then fill the data
		this._vertices = new Array((slices + 1)*(loops));
		var index = 0;
		for (var j = 0; j < loops; j++) {
			var sin_aj = array_sin_aj[j];
			var cos_aj = array_cos_aj[j];
			for (var i = 0; i <= slices; i++) {
				var sin_ai = array_sin_ai[i];
				var cos_ai = array_cos_ai[i];
				var normal = [sin_aj * cos_ai, -cos_aj, -sin_aj * sin_ai];
				var position = [normal[0] * radius, normal[1] * radius, normal[2] * radius];
				var texcoord = [array_part_i[i], array_part_j[j]];
				this._vertices[index] = {
					normal: normal,
					position: position,
					texcoord: texcoord
				};
				index++;
			}
		}
		this._indices = new Array((2 + 2*slices)*(loops - 1) + 2*(loops - 2));
		index = 0;
		var width = slices + 1;
		for (var j = 0; j < loops-1; ++j) {
			var lat_end = (j+2 == loops);
			this._indices[index++] = (j+1)*width;
			this._indices[index++] = (j  )*width;
			for (var i = 0; i < slices; ++i) {
				var next_i = (i+1);
				
				this._indices[index] = (next_i) + (j+1)*width; index++;
				this._indices[index] = (next_i) + (j  )*width; index++;
			}
			// Degenerates
			if (!lat_end) {
				this._indices[index] = this._indices[index - 1]; index++;
				this._indices[index] = (j+2)*width; index++;
			}
		}
	};
}

export { GeneratedMesh };