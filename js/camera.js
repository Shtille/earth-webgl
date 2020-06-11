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
 */
function Camera(target, distance) {
	var target = target;
	var distance = distance;
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

	this.getAlpha = function() {
		return alpha;
	};
	this.getTheta = function() {
		return theta;
	};
	this.setAlpha = function(value) {
		alpha = value;
	};
	this.increaseAlpha = function(value) {
		alpha += value;
	};
	this.setTheta = function(value) {
		theta = value;
		clampTheta.call(this);
	};
	this.increaseTheta = function(value) {
		theta += value;
		clampTheta.call(this);
	};
	this.getViewMatrix = function() {
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
		// eye = target - f * distance
		var eye = vec3.fromValues(
			target[0] - f[0] * distance,
			target[1] - f[1] * distance,
			target[2] - f[2] * distance);
		var sde = vec3.dot(s, eye);
		var ude = vec3.dot(u, eye);
		var fde = vec3.dot(f, eye);
		var m = mat4.fromValues(
			s[0], u[0], -f[0], 0,
			s[1], u[1], -f[1], 0,
			s[2], u[2], -f[2], 0,
			-sde, -ude,   fde, 1);
		return m;
	};
}