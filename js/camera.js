/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module defines class for camera.
 */

'use strict';

/**
 * Defines camera around the target class.
 *
 * @param {vec3}   target    The target position.
 * @param {Number} distance  The distance from target to eye.
 * @param {Number} radius    The radius of the object.
 */
function Camera(target, distance, radius) {
	var target = target;
	var distance = distance;
	var radius = radius;
	var position = vec3.create();
	var viewMatrix = mat4.create();
	var alpha = 0.0;
	var theta = 0.0;
	const minTheta = -1.5;
	const maxTheta = 1.5;
	var clampTheta = function() {
		if (theta < minTheta)
			theta = minTheta;
		else if (theta > maxTheta)
			theta = maxTheta;
	};

	/**
	 * Returns alpha (angle around Y axis).
	 */
	this.getAlpha = function() {
		return alpha;
	};
	/**
	 * Sets alpha (angle around Y axis).
	 */
	this.setAlpha = function(value) {
		alpha = value;
	};
	/**
	 * Increases alpha by value (angle around Y axis).
	 *
	 * @param {Number} value The value in radians.
	 */
	this.increaseAlpha = function(value) {
		alpha += value;
	};
	/**
	 * Returns theta (angle around Z axis).
	 */
	this.getTheta = function() {
		return theta;
	};
	/**
	 * Sets theta (angle around Z axis).
	 */
	this.setTheta = function(value) {
		theta = value;
		clampTheta.call(this);
	};
	/**
	 * Increases theta by value (angle around Z axis).
	 *
	 * @param {Number} value The value in radians.
	 */
	this.increaseTheta = function(value) {
		theta += value;
		clampTheta.call(this);
	};
	/**
	 * Returns camera distance from target.
	 */
	this.getDistance = function() {
		return distance;
	};
	/**
	 * Returns camera position.
	 */
	this.getPosition = function() {
		return position;
	};
	/**
	 * Returns view matrix.
	 */
	this.getViewMatrix = function() {
		return viewMatrix;
	};
	/**
	 * Returns object with z near and z far values.
	 */
	this.getZNearZFar = function() {
		var zNear = distance - radius;
		var zFar = distance + radius;
		return {
			zNear: zNear,
			zFar: zFar
		};
	};
	/**
	 * Updates the camera position and view matrix.
	 */
	this.update = function() {
		//      |	s[0]   s[1]   s[2]  -s.e  |
		//      |	u[0]   u[1]   u[2]  -u.e  |
		//  V = |  -f[0]  -f[1]  -f[2]   f.e  |
		//      |	 0	    0      0      1   |
		var f = vec3.fromValues(
			-Math.cos(theta) * Math.cos(alpha),
			-Math.sin(theta),
			-Math.cos(theta) * Math.sin(alpha));
		var s = vec3.fromValues(
			Math.sin(alpha),
			0,
			-Math.cos(alpha));
		var u = vec3.fromValues(
			-Math.sin(theta) * Math.cos(alpha),
			 Math.cos(theta),
			-Math.sin(theta) * Math.sin(alpha));
		var eye = vec3.fromValues(
			target[0] - f[0] * distance,
			target[1] - f[1] * distance,
			target[2] - f[2] * distance);
		var sde = vec3.dot(s, eye);
		var ude = vec3.dot(u, eye);
		var fde = vec3.dot(f, eye);
		viewMatrix = mat4.fromValues(
			s[0], u[0], -f[0], 0,
			s[1], u[1], -f[1], 0,
			s[2], u[2], -f[2], 0,
			-sde, -ude,   fde, 1);
		position = eye;
	};
}