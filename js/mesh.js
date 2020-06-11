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
}