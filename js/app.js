/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { kEarthRadius, kEarthAtmosphereRadius, kEarthCloudsRadius } from './constants.js';
import { Texture } from './texture.js';
import { Shader } from './shader.js';
import { Camera } from './camera.js';
import { OrbitControls } from './orbit-controls.js';
import { Frustum } from './frustum.js';
import { VertexAttribute } from './vertex-attribute.js';
import { VertexFormat } from './vertex-format.js';
import { GeneratedMesh } from './generated-mesh.js';
import { ResourceRequirement } from './resource-requirement.js';
import { PlanetCube } from './planet-cube.js';

/**
 * Defines application class.
 *
 * @param {WebGLRenderingContext} gl  Rendering context.
 */
function Application(gl) {
	var gl = gl;

	const useQuadTree = true;

	const fieldOfView = 45 * Math.PI / 180;   // field of view in Y direction in radians
	const kCameraDistance = kEarthRadius * 5.0;
	const kMaxDistance = kEarthRadius * 10.0;
	const kMinDistance = kEarthRadius * 1.5;
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

	var requirements = null;
	var groundShader = new Shader(gl);
	var cloudsShader = new Shader(gl);
	var skyShader = new Shader(gl);
	var planetTileShader = new Shader(gl);
	var groundTexture = new Texture(gl);
	var cloudsTexture = new Texture(gl);
	var vertexFormat = null;
	var sphereMesh = null;
	var camera = null;
	var orbitControls = null;
	var frustum = null;
	var planetCube = null;
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

		gl.cullFace(gl.BACK);
		gl.frontFace(gl.CCW);
		gl.enable(gl.CULL_FACE);

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);

		gl.viewport(0, 0, width, height);
	};
	var updateProjectionMatrix = function() {
		if (needUpdateProjectionMatrix) {
			needUpdateProjectionMatrix = false;

			const aspect = width / height;
			const ranges = camera.getZNearZFar();
			mat4.perspective(projectionMatrix, fieldOfView, aspect, ranges.zNear, ranges.zFar);
		}
	};
	var updateViewMatrix = function() {
		viewMatrix = camera.getViewMatrix();
	};
	var onZoomChanged = function() {
		needUpdateProjectionMatrix = true;
	};
	var onError = function(errorMessage) {
		const error = document.getElementById("error");
		error.innerHTML += errorMessage;
	};
	var onRequirementsPassed = function() {
		hideLoading();
		ready = true;
	};
	var onTextureLoaded = function() {
		requirements.remove();
	};
	var generateMesh = function() {
		sphereMesh.createSphere(1, 128, 64);
		sphereMesh.makeRenderable();
		requirements.remove();
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
		requirements.remove();
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
		gl.uniform1i(shader.getUniformLocation("u_earth_texture"), 0);
	};
	var onCloudsShaderLoaded = function(shader) {
		requirements.remove();
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
		gl.uniform1i(shader.getUniformLocation("u_clouds_texture"), 0);
	};
	var onSkyShaderLoaded = function(shader) {
		requirements.remove();
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
		gl.uniform1f(shader.getUniformLocation("u_g"), g);
		gl.uniform1f(shader.getUniformLocation("u_g2"), g * g);
	};
	var onPlanetTileShaderLoaded = function(shader) {
		requirements.remove();
		gl.useProgram(shader.program);

		gl.uniform1f(shader.getUniformLocation("u_planet_radius"), kInnerRadius);
		gl.uniform1i(shader.getUniformLocation("u_texture"), 0);
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

		showLoading();

		if (useQuadTree) {
			
			// Vertex format
			var namedAttributes = ["a_position"];
			var attributes = [
				new VertexAttribute(3, gl.FLOAT, "position")
			];
			vertexFormat = new VertexFormat(gl, attributes);

			// Load shaders
			planetTileShader.loadFromFile("shaders/planet-tile-vert.glsl", "shaders/planet-tile-frag.glsl",
				namedAttributes, onPlanetTileShaderLoaded, onError, this);

		} else {
			
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
			cloudsTexture.loadFromFile("textures/clouds.jpg", onTextureLoaded, onError, this, true);

			// Create sphere mesh
			// Push mesh generation in the next event cycle 
			// just to make window show loading spinner
			sphereMesh = new GeneratedMesh(gl, vertexFormat);
			window.setTimeout(generateMesh.bind(this));

		}

		// Create camera
		camera = new Camera({
			target: kEarthPosition,
			distance: kCameraDistance,
			minDistance: kMinDistance,
			maxDistance: kMaxDistance,
			innerRadius: kInnerRadius,
			outerRadius: kOuterRadius,
			zoomCallback: onZoomChanged,
			context: this
		});

		// Create orbit controls
		orbitControls = new OrbitControls(camera, gl.canvas);

		// Create frustum
		frustum = new Frustum();

		if (useQuadTree) {

			// Create planet cube
			planetCube = new PlanetCube({
				gl: gl,
				vertexFormat: vertexFormat,
				shader: planetTileShader,
				radius: kInnerRadius,
				position: kEarthPosition,
				camera: camera,
				frustum: frustum
			});
			planetCube.setParameters(fieldOfView, height);

			// Create resource requirements
			requirements = new ResourceRequirement([
				"planetTileShader",
			], onRequirementsPassed, this);

		} else {

			// Create constant model matrices
			mat4.fromScaling(groundModelMatrix, [kInnerRadius, kInnerRadius, kInnerRadius]);

			// Create resource requirements
			requirements = new ResourceRequirement([
				"groundShader",
				"cloudsShader",
				"skyShader",
				"groundTexture",
				"cloudsTexture",
				"sphereMesh",
			], onRequirementsPassed, this);

		}
	};
	this.unload = function() {
		if (useQuadTree) {
			planetCube.destroy();
			planetTileShader.destroy();
		} else {
			groundShader.destroy();
			cloudsShader.destroy();
			skyShader.destroy();
			groundTexture.destroy();
			cloudsTexture.destroy();
			sphereMesh.destroy();
		}
		orbitControls.destroy();
	};
	this.update = function(seconds) {
		if (!ready)
			return;

		camera.update();

		updateProjectionMatrix();
		updateViewMatrix();
		mat4.multiply(projectionViewMatrix, projectionMatrix, viewMatrix);
		frustum.set(projectionViewMatrix);

		if (useQuadTree) {

			planetCube.update();
			
		} else {
			
			// Update model matrices
			rotationAngle += 0.005 * seconds;
			mat4.fromYRotation(rotationMatrix, rotationAngle);

			mat4.fromScaling(cloudsModelMatrix, [kCloudsRadius, kCloudsRadius, kCloudsRadius]);
			mat4.multiply(cloudsModelMatrix, cloudsModelMatrix, rotationMatrix);

			mat4.fromScaling(skyModelMatrix, [kOuterRadius, kOuterRadius, kOuterRadius]);
			mat4.multiply(skyModelMatrix, skyModelMatrix, rotationMatrix);

			bindShaderVariables();

		}
	};
	this.render = function() {
		// Clear context
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		if (!ready)
			return;

		if (useQuadTree) {

			planetCube.render();

		} else {

			renderGround();
			renderSky();
			renderClouds();

		}
	};
	this.onResize = function(newWidth, newHeight) {
		width = newWidth;
		height = newHeight;
		gl.viewport(0, 0, width, height);
		needUpdateProjectionMatrix = true;
	};
}

export { Application };