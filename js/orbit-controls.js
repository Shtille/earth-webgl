/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module defines class for orbit controls.
 */

'use strict';

/**
 * Defines orbit controls class.
 *
 * @param {Camera}      camera   The camera.
 * @param {HTMLElement} element  The element. Optional.
 */
function OrbitControls(camera, element) {
	var camera = camera;
	var element = element || document;
	var isPanning = false;
	var oldX = 0;
	var oldY = 0;
	const panSpeed = 0.01;

	function pan(x, y) {
		var deltaAlpha = (x - oldX) * panSpeed;
		var deltaTheta = (y - oldY) * panSpeed;
		camera.increaseAlpha(deltaAlpha);
		camera.increaseTheta(deltaTheta);
	}
	function onMouseDown(event) {
		// Begin pan
		oldX = event.offsetX;
		oldY = event.offsetY;
		isPanning = true;
	}
	function onMouseMove(event) {
		// event.offsetX, event.offsetY
		if (isPanning) {
			pan(event.offsetX, event.offsetY);
			oldX = event.offsetX;
			oldY = event.offsetY;
		}
	}
	function onMouseUp(event) {
		// End pan
		if (isPanning) {
			pan(event.offsetX, event.offsetY);
			oldX = 0;
			oldY = 0;
			isPanning = false;
		}
	}

	var create = function() {
		element.addEventListener('mousedown', onMouseDown, false);
		element.addEventListener('mousemove', onMouseMove, false);
		element.addEventListener('mouseup', onMouseUp, false);
	};
	this.destroy = function() {
		element.removeEventListener('mousedown', onMouseDown, false);
		element.removeEventListener('mousemove', onMouseMove, false);
		element.removeEventListener('mouseup', onMouseUp, false);
	};
	
	create.call(this);
}