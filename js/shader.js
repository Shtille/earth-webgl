/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

'use strict';

function Shader(gl) {
	var gl = gl;
	var uniformLocations = new Object();

	this.program = null;

	/**
	 * Creates a shader of the given type, uploads the source and compiles it.
	 * @private
	 */
	var createShader = function(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	};
	/**
	 * Creates a program and links it.
	 * @private
	 */
	var createProgram = function(vsSource, fsSource, attributes) {
		const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
		const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		for (var i = 0; i < attributes.length; i++) {
			gl.bindAttribLocation(shaderProgram, i, attributes[i]);
		}
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
			return;
		}
		// After linkage shaders may be deleted
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		this.program = shaderProgram;
	};
	/**
	 * Loads shaders and creates program on completion.
	 * @private
	 *
	 * @param {String}   vsFilename       Vertex shader filename.
	 * @param {String}   fsFilename       Fragment shader filename.
	 * @param {Array}    attributes       Attributes array.
	 * @param {Function} successCallback  The success callback. Optional.
	 * @param {Function} errorCallback    The error callback. Optional.
	 * @param {Object}   context          The callbacks context.
	 */
	var loadShaders = function(vsFilename, fsFilename, attributes, successCallback, errorCallback, context) {
		var vertDeferred = $.ajax({
			url: vsFilename,
			dataType: 'text',
			async: true,
			error: (jqXhr, textStatus, errorThrown) => {
				var errorMessage = 'Failed to load the vertex shader: ' + errorThrown + '<br>';
				errorCallback.call(context, errorMessage);
			}
		});
		var fragDeferred = $.ajax({
			url: fsFilename,
			dataType: 'text',
			async: true,
			error: (jqXhr, textStatus, errorThrown) => {
				var errorMessage = 'Failed to load the fragment shader: ' + errorThrown + '<br>';
				errorCallback.call(context, errorMessage);
			}
		});
		$.when(vertDeferred, fragDeferred).then(function(vertSource, fragSource) {
			createProgram.call(this, vertSource[0], fragSource[0], attributes);
			successCallback.call(context);
		}.bind(this));
	};
	/**
	 * Loads shaders from files.
	 *
	 * @param {String}   vsFilename       Vertex shader filename.
	 * @param {String}   fsFilename       Fragment shader filename.
	 * @param {Array}    attributes       Attributes array.
	 * @param {Function} successCallback  The success callback. Optional.
	 * @param {Function} errorCallback    The error callback. Optional.
	 * @param {Object}   context          The callbacks context.
	 */
	this.loadFromFile = function(vsFilename, fsFilename, attributes, successCallback, errorCallback, context) {
		loadShaders.call(this, vsFilename, fsFilename, attributes, successCallback, errorCallback, context);
	};
	/**
	 * Loads shaders from strings.
	 */
	this.loadFromString = function(vsSource, fsSource, attributes) {
		createProgram.call(this, vsSource, fsSource, attributes);
	};
	/**
	 * Destroys object.
	 */
	this.destroy = function() {
		gl.deleteProgram(this.program);
		gl = null;
		uniformLocations = null;
		this.program = null;
	};
	/**
	 * Gets uniform location.
	 *
	 * @param {String} uniformName  The uniform name.
	 */
	this.getUniformLocation = function(uniformName) {
		var location = uniformLocations[uniformName];
		if (!location) {
			location = gl.getUniformLocation(this.program, uniformName);
			uniformLocations[uniformName] = location;
		}
		return location;
	};
}