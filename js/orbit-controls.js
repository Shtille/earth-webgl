/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module defines class for orbit controls.
 */

import { Camera } from './camera.js';

/**
 * Defines orbit controls class.
 *
 * @param {Camera}      camera   The camera.
 * @param {HTMLElement} element  The element. Optional.
 */
function OrbitControls(camera, element) {
	var camera = camera;
	var element = element || document;
	var rotateStart = vec2.create();
	var zoomStart = vec2.create();
	var zoomEnd = vec2.create();
	var zoomDelta = vec2.create();
	const panSpeed = 0.01;
	const STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, TOUCH_ROTATE: 3, TOUCH_ZOOM: 4 };
	var state = STATE.NONE;

	function pan(x, y) {
		var deltaAlpha = (x - rotateStart[0]) * panSpeed;
		var deltaTheta = (y - rotateStart[1]) * panSpeed;
		camera.increaseAlpha(deltaAlpha);
		camera.increaseTheta(deltaTheta);
	}
	function zoomIn() {
		camera.zoomIn();
	}
	function zoomOut() {
		camera.zoomOut();
	}
	function onMouseDown(event) {
		event.preventDefault();
		if (event.button === 0) {
			state = STATE.ROTATE;
			vec2.set(rotateStart, event.clientX, event.clientY);
		} else if (event.button === 1) {
			state = STATE.ZOOM;
			vec2.set(rotateStart, event.clientX, event.clientY);
		} else if (event.button === 2) {
		}
	}
	function onMouseMove(event) {
		event.preventDefault();
		if (state === STATE.ROTATE) {
			pan(event.clientX, event.clientY);
			vec2.set(rotateStart, event.clientX, event.clientY);
		} else if (state === STATE.ZOOM) {
			vec2.set(zoomEnd, event.clientX, event.clientY);
			vec2.sub(zoomDelta, zoomEnd, zoomStart);
			if (zoomDelta[1] > 0) {
				zoomOut();
			} else {
				zoomIn();
			}
			vec2.copy(zoomStart, zoomEnd);
		}
	}
	function onMouseUp(event) {
		// End pan
		if (state === STATE.ROTATE) {
			pan(event.clientX, event.clientY);
			vec2.set(rotateStart, 0, 0);
			state = STATE.NONE;
		} else if (state === STATE.ZOOM) {
			vec2.set(zoomEnd, event.clientX, event.clientY);
			vec2.sub(zoomDelta, zoomEnd, zoomStart);
			if (zoomDelta[1] > 0) {
				zoomOut();
			} else {
				zoomIn();
			}
			vec2.set(zoomStart, 0, 0);
			state = STATE.NONE;
		}
	}
	function onMouseWheel(event) {
		if (event.deltaY > 0) {
			zoomOut();
		} else {
			zoomIn();
		}
	}
	function onTouchStart(event) {
		switch (event.touches.length) {
		case 1:	// one-fingered touch: rotate
			// Begin pan
			state = STATE.TOUCH_ROTATE;
			vec2.set(rotateStart, event.touches[0].pageX, event.touches[0].pageY);
			break;
		case 2:	// two-fingered touch: dolly
			state = STATE.TOUCH_ZOOM;
			var dx = event.touches[0].pageX - event.touches[1].pageX;
			var dy = event.touches[0].pageY - event.touches[1].pageY;
			var distance = Math.sqrt(dx*dx + dy*dy);
			vec2.set(zoomStart, 0, distance);
			break;
		case 3: // three-fingered touch: pan
			break;
		}
	}
	function onTouchMove(event) {
		event.preventDefault();
		event.stopPropagation();
		switch (event.touches.length) {
		case 1:	// one-fingered touch: rotate
			if (state === STATE.TOUCH_ROTATE) {
				pan(event.touches[0].pageX, event.touches[0].pageY);
				vec2.set(rotateStart, event.touches[0].pageX, event.touches[0].pageY);
			}
			break;
		case 2:	// two-fingered touch: dolly
			if (state === STATE.TOUCH_ZOOM) {
				var dx = event.touches[0].pageX - event.touches[1].pageX;
				var dy = event.touches[0].pageY - event.touches[1].pageY;
				var distance = Math.sqrt(dx*dx + dy*dy);
				vec2.set(zoomEnd, 0, distance);
				vec2.sub(zoomDelta, zoomEnd, zoomStart);
				if (zoomDelta[1] > 0) {
					zoomIn();
				} else {
					zoomOut();
				}
				vec2.copy(zoomStart, zoomEnd);
			}
			break;
		case 3: // three-fingered touch: pan
			break;
		}
	}
	function onTouchEnd(event) {
		switch (event.touches.length) {
		case 1:	// one-fingered touch: rotate
			// End pan
			if (state === STATE.TOUCH_ROTATE) {
				pan(event.touches[0].pageX, event.touches[0].pageY);
				vec2.set(rotateStart, 0, 0);
				state = STATE.NONE;
			}
			break;
		case 2:	// two-fingered touch: dolly
			if (state === STATE.TOUCH_ZOOM) {
				var dx = event.touches[0].pageX - event.touches[1].pageX;
				var dy = event.touches[0].pageY - event.touches[1].pageY;
				var distance = Math.sqrt(dx*dx + dy*dy);
				vec2.set(zoomEnd, 0, distance);
				vec2.sub(zoomDelta, zoomEnd, zoomStart);
				if (zoomDelta[1] > 0) {
					zoomIn();
				} else {
					zoomOut();
				}
				vec2.set(zoomStart, 0, 0);
				state = STATE.NONE;
			}
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
		element.addEventListener('wheel', onMouseWheel, false);
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
		element.removeEventListener('wheel', onMouseWheel, false);
		// Touch events
		element.removeEventListener('touchstart', onTouchStart, false);
		element.removeEventListener('touchmove', onTouchMove, false);
		element.removeEventListener('touchend', onTouchEnd, false);
	};
	
	create.call(this);
}

export { OrbitControls };