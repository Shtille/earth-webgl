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
	function onTouchStart(event) {
		switch (event.touches.length) {
		case 1:	// one-fingered touch: rotate
			// Begin pan
			oldX = event.touches[0].pageX;
			oldY = event.touches[0].pageY;
			isPanning = true;
			break;
		case 2:	// two-fingered touch: dolly
			break;
		case 3: // three-fingered touch: pan
			break;
		}
	}
	function onTouchMove(event) {
		switch (event.touches.length) {
		case 1:	// one-fingered touch: rotate
			if (isPanning) {
				pan(event.touches[0].pageX, event.touches[0].pageY);
				oldX = event.touches[0].pageX;
				oldY = event.touches[0].pageY;
			}
			break;
		case 2:	// two-fingered touch: dolly
			break;
		case 3: // three-fingered touch: pan
			break;
		}
	}
	function onTouchEnd(event) {
		switch (event.touches.length) {
		case 1:	// one-fingered touch: rotate
			// End pan
			if (isPanning) {
				pan(event.touches[0].pageX, event.touches[0].pageY);
				oldX = 0;
				oldY = 0;
				isPanning = false;
			}
			break;
		case 2:	// two-fingered touch: dolly
			break;
		case 3: // three-fingered touch: pan
			break;
		}
	}

	var create = function() {
		// Mouse events
		element.addEventListener('mousedown', onMouseDown, false);
		element.addEventListener('mousemove', onMouseMove, false);
		element.addEventListener('mouseup', onMouseUp, false);
		// Touch events
		element.addEventListener('touchstart', onTouchStart, false);
		element.addEventListener('touchmove', onTouchMove, false);
		element.addEventListener('touchend', onTouchEnd, false);
	};
	this.destroy = function() {
		// Mouse events
		element.removeEventListener('mousedown', onMouseDown, false);
		element.removeEventListener('mousemove', onMouseMove, false);
		element.removeEventListener('mouseup', onMouseUp, false);
		// Touch events
		element.addEventListener('touchstart', onTouchStart, false);
		element.addEventListener('touchmove', onTouchMove, false);
		element.addEventListener('touchend', onTouchEnd, false);
	};
	
	create.call(this);
}