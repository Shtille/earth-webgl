/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

'use strict';

function Application(gl) {
	var gl = gl;

	const kCameraDistance = kEarthRadius * 5.0;
	const kInnerRadius = kEarthRadius;
	const kOuterRadius = kEarthAtmosphereRadius;
	const kCloudsRadius = kEarthCloudsRadius;
	const kEarthPosition = vec3.fromValues(0.0, 0.0, 0.0);
	const kSunDirection = vec3.fromValues(1.0, 0.0, 0.0);
	const Kr = 0.0030;
	const Km = 0.0015;
	const ESun = 16.0;
	const g = -0.75;
	const kScaleDepth = 0.25;
	const kInvWaveLength = [1.0 / Math.pow(0.650, 4.0), 1.0 / Math.pow(0.570, 4.0), 1.0 / Math.pow(0.475, 4.0)];

	var groundShader = new Shader(gl);
	var cloudsShader = new Shader(gl);
	var skyShader = new Shader(gl);
	var groundTexture = new Texture(gl);
	var cloudsTexture = new Texture(gl);
	var vertexFormat = null;
	var sphereMesh = null;
	var camera = null;
	var orbitControls = null;
	var projectionMatrix = mat4.create();
	var viewMatrix = mat4.create();
	var projectionViewMatrix = mat4.create();
	var groundModelMatrix = mat4.create();
	var cloudsModelMatrix = mat4.create();
	var skyModelMatrix = mat4.create();
	var rotationMatrix = mat4.create();
	var width = gl.canvas.clientWidth;
	var height = gl.canvas.clientHeight;
	var needUpdateProjectionMatrix = true;
	var ready = false;
	var rotationAngle = 0;

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
		if (needUpdateProjectionMatrix) { // || camera.animated()
			needUpdateProjectionMatrix = false;

			const fieldOfView = 45 * Math.PI / 180;   // in radians
			const aspect = width / height;
			const zNear = 0.1;
			const zFar = 100.0;
			mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
		}
	};
	var updateViewMatrix = function() {
		viewMatrix = camera.getViewMatrix();
	};
	var onError = function(errorMessage) {
		const error = document.getElementById("error");
		error.innerHTML += errorMessage;
	};
	var onTextureLoaded = function() {
	};
	var bindShaderVariables = function() {
		const position = camera.getPosition();
		const distance_to_earth = camera.getDistance();
		const from_space = (distance_to_earth > kOuterRadius) ? 1 : 0;

		var shaders = [groundShader, cloudsShader, skyShader];
		shaders.forEach(function(shader){
			gl.useProgram(shader.program);
			gl.uniform3fv(shader.getUniformLocation("u_camera_pos"), position);
			gl.uniform1f(shader.getUniformLocation("u_camera_height"), distance_to_earth);
			gl.uniform1f(shader.getUniformLocation("u_camera_height2"), distance_to_earth * distance_to_earth);
			gl.uniform1i(shader.getUniformLocation("u_from_space"), from_space);
		});
	};
	var onGroundShaderLoaded = function(shader) {
		gl.useProgram(shader.program);

		gl.uniform3fv(shader.getUniformLocation("u_to_light"), kSunDirection);
		gl.uniform3fv(shader.getUniformLocation("u_inv_wave_length"), kInvWaveLength);
		gl.uniform1f(shader.getUniformLocation("u_inner_radius"), kInnerRadius);
		gl.uniform1f(shader.getUniformLocation("u_outer_radius"), kOuterRadius);
		gl.uniform1f(shader.getUniformLocation("u_outer_radius2"), kOuterRadius * kOuterRadius);
		gl.uniform1f(shader.getUniformLocation("u_kr_esun"), Kr * ESun);
		gl.uniform1f(shader.getUniformLocation("u_km_esun"), Km * ESun);
		gl.uniform1f(shader.getUniformLocation("u_kr_4_pi"), Kr * 4.0 * Math.PI);
		gl.uniform1f(shader.getUniformLocation("u_km_4_pi"), Km * 4.0 * Math.PI);
		gl.uniform1f(shader.getUniformLocation("u_scale"), 1.0 / (kOuterRadius - kInnerRadius));
		gl.uniform1f(shader.getUniformLocation("u_scale_depth"), kScaleDepth);
		gl.uniform1f(shader.getUniformLocation("u_scale_over_scale_depth"), 1.0 / (kOuterRadius - kInnerRadius) / kScaleDepth);
		gl.uniform1i(shader.getUniformLocation("u_samples"), 4);
		gl.uniform1i(shader.getUniformLocation("u_earth_texture"), 0);
	};
	var onCloudsShaderLoaded = function(shader) {
		gl.useProgram(shader.program);

		gl.uniform3fv(shader.getUniformLocation("u_to_light"), kSunDirection);
		gl.uniform3fv(shader.getUniformLocation("u_inv_wave_length"), kInvWaveLength);
		gl.uniform1f(shader.getUniformLocation("u_inner_radius"), kCloudsRadius);
		gl.uniform1f(shader.getUniformLocation("u_outer_radius"), kOuterRadius);
		gl.uniform1f(shader.getUniformLocation("u_outer_radius2"), kOuterRadius * kOuterRadius);
		gl.uniform1f(shader.getUniformLocation("u_kr_esun"), Kr * ESun);
		gl.uniform1f(shader.getUniformLocation("u_km_esun"), Km * ESun);
		gl.uniform1f(shader.getUniformLocation("u_kr_4_pi"), Kr * 4.0 * Math.PI);
		gl.uniform1f(shader.getUniformLocation("u_km_4_pi"), Km * 4.0 * Math.PI);
		gl.uniform1f(shader.getUniformLocation("u_scale"), 1.0 / (kOuterRadius - kCloudsRadius));
		gl.uniform1f(shader.getUniformLocation("u_scale_depth"), kScaleDepth);
		gl.uniform1f(shader.getUniformLocation("u_scale_over_scale_depth"), 1.0 / (kOuterRadius - kCloudsRadius) / kScaleDepth);
		gl.uniform1i(shader.getUniformLocation("u_samples"), 4);
		gl.uniform1i(shader.getUniformLocation("u_clouds_texture"), 0);
	};
	var onSkyShaderLoaded = function(shader) {
		gl.useProgram(shader.program);
		
		gl.uniform3fv(shader.getUniformLocation("u_to_light"), kSunDirection);
		gl.uniform3fv(shader.getUniformLocation("u_inv_wave_length"), kInvWaveLength);
		gl.uniform1f(shader.getUniformLocation("u_inner_radius"), kInnerRadius);
		gl.uniform1f(shader.getUniformLocation("u_outer_radius"), kOuterRadius);
		gl.uniform1f(shader.getUniformLocation("u_outer_radius2"), kOuterRadius * kOuterRadius);
		gl.uniform1f(shader.getUniformLocation("u_kr_esun"), Kr * ESun);
		gl.uniform1f(shader.getUniformLocation("u_km_esun"), Km * ESun);
		gl.uniform1f(shader.getUniformLocation("u_kr_4_pi"), Kr * 4.0 * Math.PI);
		gl.uniform1f(shader.getUniformLocation("u_km_4_pi"), Km * 4.0 * Math.PI);
		gl.uniform1f(shader.getUniformLocation("u_scale"), 1.0 / (kOuterRadius - kInnerRadius));
		gl.uniform1f(shader.getUniformLocation("u_scale_depth"), kScaleDepth);
		gl.uniform1f(shader.getUniformLocation("u_scale_over_scale_depth"), 1.0 / (kOuterRadius - kInnerRadius) / kScaleDepth);
		gl.uniform1i(shader.getUniformLocation("u_samples"), 4);
		gl.uniform1f(shader.getUniformLocation("u_g"), g);
		gl.uniform1f(shader.getUniformLocation("u_g2"), g * g);
	};
	var renderGround = function() {
		gl.useProgram(groundShader.program);
		gl.uniformMatrix4fv(
			groundShader.getUniformLocation('u_projection_view'),
			false,
			projectionViewMatrix);
		gl.uniformMatrix4fv(
			groundShader.getUniformLocation('u_model'),
			false,
			groundModelMatrix);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, groundTexture.id);

		sphereMesh.render();

		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	var renderClouds = function() {
		gl.useProgram(cloudsShader.program);
		gl.uniformMatrix4fv(
			cloudsShader.getUniformLocation('u_projection_view'),
			false,
			projectionViewMatrix);
		gl.uniformMatrix4fv(
			cloudsShader.getUniformLocation('u_model'),
			false,
			cloudsModelMatrix);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, cloudsTexture.id);

		sphereMesh.render();

		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	var renderSky = function() {
		gl.cullFace(gl.FRONT);

		gl.useProgram(skyShader.program);
		gl.uniformMatrix4fv(
			skyShader.getUniformLocation('u_projection_view'),
			false,
			projectionViewMatrix);
		gl.uniformMatrix4fv(
			skyShader.getUniformLocation('u_model'),
			false,
			skyModelMatrix);

		sphereMesh.render();

		gl.cullFace(gl.BACK);
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
		groundShader.loadFromFile("shaders/ground-vert.glsl", "shaders/ground-frag.glsl",
			namedAttributes, onGroundShaderLoaded, onError, this);
		cloudsShader.loadFromFile("shaders/clouds-vert.glsl", "shaders/clouds-frag.glsl",
			namedAttributes, onCloudsShaderLoaded, onError, this);
		skyShader.loadFromFile("shaders/sky-vert.glsl", "shaders/sky-frag.glsl",
			namedAttributes, onSkyShaderLoaded, onError, this);

		// Load textures
		groundTexture.loadFromFile("textures/earth.jpg", onTextureLoaded, onError, this);
		cloudsTexture.loadFromFile("textures/clouds.jpg", onTextureLoaded, onError, this);

		// Create sphere mesh
		sphereMesh = new GeneratedMesh(gl, vertexFormat);
		sphereMesh.createSphere(1, 128, 64);
		sphereMesh.makeRenderable();

		// Create camera
		var target = vec3.fromValues(0, 0, 0);
		var distance = 5.0;
		camera = new Camera(target, distance);

		// Create orbit controls
		orbitControls = new OrbitControls(camera, gl.canvas);

		// Create model matrices
		mat4.fromScaling(groundModelMatrix, [kInnerRadius, kInnerRadius, kInnerRadius]);
	};
	this.unload = function() {
		groundShader.destroy();
		cloudsShader.destroy();
		skyShader.destroy();
		groundTexture.destroy();
		cloudsTexture.destroy();
		sphereMesh.destroy();
		orbitControls.destroy();
	};
	this.update = function(seconds) {
		camera.update();

		updateProjectionMatrix();
		updateViewMatrix();
		mat4.multiply(projectionViewMatrix, projectionMatrix, viewMatrix);

		// Update model matrices
		rotationAngle += 0.005 * seconds;
		mat4.fromYRotation(rotationMatrix, rotationAngle);

		mat4.fromScaling(cloudsModelMatrix, [kCloudsRadius, kCloudsRadius, kCloudsRadius]);
		mat4.multiply(cloudsModelMatrix, cloudsModelMatrix, rotationMatrix);

		mat4.fromScaling(skyModelMatrix, [kOuterRadius, kOuterRadius, kOuterRadius]);
		mat4.multiply(skyModelMatrix, skyModelMatrix, rotationMatrix);

		bindShaderVariables();
	};
	this.render = function() {
		// Clear context
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		if (!ready)
			return;

		renderGround();
		renderSky();
		renderClouds();
	};
	this.onResize = function(newWidth, newHeight) {
		width = newWidth;
		height = newHeight;
		gl.viewport(0, 0, width, height);
		needUpdateProjectionMatrix = true;
	};
}