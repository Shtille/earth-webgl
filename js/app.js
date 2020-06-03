/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

'use strict';

function Application(gl) {
	var gl = gl;
	var shader = new Shader(gl);
	var vertexFormat = null;
	var mesh = null;
	var projectionMatrix = mat4.create();
	var viewMatrix = mat4.create();
	var width = gl.canvas.clientWidth;
	var height = gl.canvas.clientHeight;
	var cubeRotation = 0.0;

	var showLoading = function() {
		document.getElementById('loadSpinner').style.display = 'block';
	};
	var hideLoading = function() {
		document.getElementById('loadSpinner').style.display = 'none';
	};
	var setDefaultStates = function() {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
		gl.viewport(0, 0, width, height);
	};
	var updateProjectionMatrix = function() {
		const fieldOfView = 45 * Math.PI / 180;   // in radians
		const aspect = width / height;
		const zNear = 0.1;
		const zFar = 100.0;
		mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
	};
	var updateViewMatrix = function() {
		viewMatrix = mat4.create();
		mat4.translate(viewMatrix,     // destination matrix
			viewMatrix,     // matrix to translate
			[-0.0, 0.0, -6.0]);  // amount to translate
		mat4.rotate(viewMatrix,  // destination matrix
			viewMatrix,  // matrix to rotate
			cubeRotation,     // amount to rotate in radians
			[0, 0, 1]);       // axis to rotate around (Z)
		mat4.rotate(viewMatrix,  // destination matrix
			viewMatrix,  // matrix to rotate
			cubeRotation * .7,// amount to rotate in radians
			[0, 1, 0]);       // axis to rotate around (X)
	};
	var onError = function(errorMessage) {
		const error = document.getElementById("error");
		error.innerHTML += errorMessage;
	};
	var onShaderLoaded = function() {
	};

	this.load = function() {
		setDefaultStates();
		updateProjectionMatrix();
		updateViewMatrix();

		// Vertex format
		var attributes = [
			new VertexAttribute(3, gl.FLOAT, "position")
		];
		vertexFormat = new VertexFormat(gl, attributes);

		// Load shaders
		shader.loadFromFile("shaders/earth-vert.glsl", "shaders/earth-frag.glsl", ["a_position"],
			onShaderLoaded, onError, this);

		// Create mesh
		mesh = new Mesh(gl, vertexFormat);
		//mesh.createCube();
		mesh.createSphere(1, 128, 64);
		mesh.makeRenderable();
	};
	this.unload = function() {
		shader.destroy();
		mesh.destroy();
	};
	this.update = function(seconds) {
		cubeRotation += 1.0 * seconds;
		updateViewMatrix();
	};
	this.render = function() {
		// Clear context
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// Bind shader
		if (!shader.program)
			return;
		gl.useProgram(shader.program);
		// Bind uniforms
		gl.uniformMatrix4fv(
			shader.getUniformLocation('u_proj_matrix'),
			false,
			projectionMatrix);
		gl.uniformMatrix4fv(
			shader.getUniformLocation('u_view_matrix'),
			false,
			viewMatrix);
		// Draw mesh
		if (mesh)
			mesh.draw();
	};
	this.onResize = function(newWidth, newHeight) {
		width = newWidth;
		height = newHeight;
		gl.viewport(0, 0, width, height);
		updateProjectionMatrix();
	};
}