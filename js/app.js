/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

'use strict';

function Application(gl) {
	var gl = gl;
	var shader = new Shader(gl);
	var texture = new Texture(gl);
	var vertexFormat = null;
	var mesh = null;
	var camera = null;
	var orbitControls = null;
	var projectionMatrix = mat4.create();
	var viewMatrix = mat4.create();
	var width = gl.canvas.clientWidth;
	var height = gl.canvas.clientHeight;

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
		viewMatrix = camera.getViewMatrix();
	};
	var onError = function(errorMessage) {
		const error = document.getElementById("error");
		error.innerHTML += errorMessage;
	};
	var onShaderLoaded = function() {
	};
	var onTextureLoaded = function() {
	};

	this.load = function() {
		setDefaultStates();

		// Vertex format
		var namedAttributes = ["a_position", "a_normal", "a_texcoord"];
		var attributes = [
			new VertexAttribute(3, gl.FLOAT, "position"),
			new VertexAttribute(3, gl.FLOAT, "normal"),
			new VertexAttribute(2, gl.FLOAT, "texcoord")
		];
		vertexFormat = new VertexFormat(gl, attributes);

		// Load shaders
		shader.loadFromFile("shaders/earth-vert.glsl", "shaders/earth-frag.glsl",
			namedAttributes, onShaderLoaded, onError, this);

		// Load textures
		texture.loadFromFile("textures/CellularTexture.png", onTextureLoaded, onError, this);

		// Create mesh
		mesh = new GeneratedMesh(gl, vertexFormat);
		mesh.createCube();
		//mesh.createSphere(1, 128, 64);
		mesh.makeRenderable();

		// Create camera
		var target = vec3.fromValues(0, 0, 0);
		var distance = 5.0;
		camera = new Camera(target, distance);

		// Create orbit controls
		orbitControls = new OrbitControls(camera, gl.canvas);

		// Finally
		updateProjectionMatrix();
		updateViewMatrix();
	};
	this.unload = function() {
		shader.destroy();
		mesh.destroy();
		orbitControls.destroy();
	};
	this.update = function(seconds) {
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
		gl.uniform1i(shader.getUniformLocation('u_sampler'), 0);
		gl.uniformMatrix4fv(
			shader.getUniformLocation('u_proj_matrix'),
			false,
			projectionMatrix);
		gl.uniformMatrix4fv(
			shader.getUniformLocation('u_view_matrix'),
			false,
			viewMatrix);
		texture.bind(0);
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