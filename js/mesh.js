/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

'use strict';

/**
 * Defines mesh class.
 *
 * @param {WebGLRenderingContext} gl              Rendering context.
 * @param {VertexFormat}          vertexFormat    Vertex format.
 */
function Mesh(gl, vertexFormat) {
	var gl = gl;
	var vertexFormat = vertexFormat;

	this._mode = gl.TRIANGLE_STRIP;
	this._verticesArray = null;
	this._indicesArray = null;
	this._vertices = null;
	this._indices = null;
	this._numVertices = 0;
	this._numIndices = 0;
	this._vertexBuffer = null;
	this._indexBuffer = null;

	/**
	 * Destroys object.
	 */
	this.destroy = function() {
		if (this._vertexBuffer) {
			gl.deleteBuffer(this._vertexBuffer);
			this._vertexBuffer = null;
		}
		if (this._indexBuffer) {
			gl.deleteBuffer(this._indexBuffer);
			this._indexBuffer = null;
		}
		gl = null;
		vertexFormat = null;
	};

	var transformArrays = function() {
		// Vertices
		if (this._vertices) {
			this._numVertices = this._vertices.length;
			this._verticesArray = new Array();
			for (var i = 0; i < this._vertices.length; i++) {
				for (var j = 0; j < vertexFormat.attributes.length; j++) {
					var attribute = vertexFormat.attributes[j];
					this._verticesArray = this._verticesArray.concat(this._vertices[i][attribute.type]);
				}
			}
		}
		// Indices
		if (this._indices) {
			this._numIndices = this._indices.length;
			this._indicesArray = this._indices;
		}
	};
	var freeArrays = function() {
		this._vertices = null;
		this._indices = null;
		this._verticesArray = null;
		this._indicesArray = null;
	};

	/**
	 * Creates WebGL buffers.
	 */
	this.makeRenderable = function() {
		// Transform vertices
		transformArrays.call(this);
		// Create vertex buffer
		if (this._verticesArray) {
			this._vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._verticesArray), gl.STATIC_DRAW);
		}
		// Create index buffer
		if (this._indicesArray) {
			this._indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indicesArray), gl.STATIC_DRAW);
		}
		// Release arrays
		freeArrays.call(this);
	};
	/**
	 * Draws primitives.
	 */
	this.draw = function() {
		if (this._vertexBuffer === null)
			return;
		// Bind buffers for rendering
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
		for (var i = 0; i < vertexFormat.attributes.length; i++) {
			var attribute = vertexFormat.attributes[i];
			gl.vertexAttribPointer(
				i,
				attribute.count,
				attribute.dataType,
				false, // normalize
				vertexFormat.getStride(), // stride
				attribute.offset); // offset
			gl.enableVertexAttribArray(i);
		}
		// Draw
		if (this._indexBuffer) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
			gl.drawElements(this._mode, this._numIndices, gl.UNSIGNED_SHORT, 0);
		} else
			gl.drawArrays(this._mode, 0, this._numVertices);
		// Unbind
		for (var i = 0; i < vertexFormat.attributes.length; i++) {
			gl.disableVertexAttribArray(i);
		}
	};
	/**
	 * Creates from object.
	 *
	 * @param {Object} object The object.
	 */
	this.createFromObject = function(object) {
		if (object.mode) {
			switch (object.mode) {
			case "triangles":
				this._mode = gl.TRIANGLES;
				break;
			case "triangle_strip":
				this._mode = gl.TRIANGLE_STRIP;
				break;
			}
		}
		if (object.numVertices)
			this._numVertices = object.numVertices;
		if (object.numIndices)
			this._numIndices = object.numIndices;
		if (object.verticesArray)
			this._verticesArray = object.verticesArray;
		if (object.indicesArray)
			this._indicesArray = object.indicesArray;
	};
	/**
	 * Loads data from JSON.
	 *
	 * @param {String}   url              The url to json.
	 * @param {Function} successCallback  The success callback. (function(mesh){})
	 * @param {Function} errorCallback    The error callback. (function(error){})
	 * @param {Object}   context          The callbacks context.
	 */
	this.loadFromJson = function(url, successCallback, errorCallback, context) {
		$.ajax({
			dataType: "text",
			url: url,
			context: this,
			success: function(data){
				this.createFromObject(JSON.parse(data));
				successCallback.call(context, this);
			},
			error: function(jqXhr, textStatus, errorThrown){
				var errorMessage = 'Failed to load json file: ' + errorThrown + '<br>';
				errorCallback.call(context, errorMessage);
			}
		});
	};
	/**
	 * Creates cube mesh.
	 */
	this.createCube = function() {
		this._mode = gl.TRIANGLES;
		this._numVertices = 24;
		this._verticesArray = [
			// Front face
			-1.0, -1.0,  1.0,
			 1.0, -1.0,  1.0,
			 1.0,  1.0,  1.0,
			-1.0,  1.0,  1.0,

			// Back face
			-1.0, -1.0, -1.0,
			-1.0,  1.0, -1.0,
			 1.0,  1.0, -1.0,
			 1.0, -1.0, -1.0,

			// Top face
			-1.0,  1.0, -1.0,
			-1.0,  1.0,  1.0,
			 1.0,  1.0,  1.0,
			 1.0,  1.0, -1.0,

			// Bottom face
			-1.0, -1.0, -1.0,
			 1.0, -1.0, -1.0,
			 1.0, -1.0,  1.0,
			-1.0, -1.0,  1.0,

			// Right face
			 1.0, -1.0, -1.0,
			 1.0,  1.0, -1.0,
			 1.0,  1.0,  1.0,
			 1.0, -1.0,  1.0,

			// Left face
			-1.0, -1.0, -1.0,
			-1.0, -1.0,  1.0,
			-1.0,  1.0,  1.0,
			-1.0,  1.0, -1.0,
		];
		this._numIndices = 36;
		this._indicesArray = [
			0,  1,  2,      0,  2,  3,    // front
			4,  5,  6,      4,  6,  7,    // back
			8,  9,  10,     8,  10, 11,   // top
			12, 13, 14,     12, 14, 15,   // bottom
			16, 17, 18,     16, 18, 19,   // right
			20, 21, 22,     20, 22, 23,   // left
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
		this._vertices = new Array((slices + 1)*(loops));
		var index = 0;
		for (var j = 0; j < loops; j++) {
			var part_j = j / (loops-1);
			var aj = (Math.PI / (loops-1)) * j;
			var sin_aj = Math.sin(aj);
			var cos_aj = Math.cos(aj);
			for (var i = 0; i <= slices; i++) {
				var part_i = i / slices;
				var ai = (2*Math.PI / slices) * i;
				var sin_ai = Math.sin(ai);
				var cos_ai = Math.cos(ai);
				this._vertices[index] = {
					normal: [sin_aj*cos_ai, -cos_aj, -sin_aj*sin_ai],
					position: [sin_aj*cos_ai * radius, -cos_aj * radius, -sin_aj*sin_ai * radius],
					texcoord: [part_i, part_j]
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