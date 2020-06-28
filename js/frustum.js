/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { Plane } from './plane.js';

/**
 * Defines frustum class.
 */
function Frustum() {
	var _matrix = mat4.create();
	var _near = new Plane();
	var _far = new Plane();
	var _bottom = new Plane();
	var _top = new Plane();
	var _left = new Plane();
	var _right = new Plane();

	/**
	 * Gets view projection matrix.
	 *
	 * @return {mat4} The view projection matrix.
	 */
	this.getMatrix = function() {
		return _matrix;
	};

	/**
	 * Gets near plane.
	 *
	 * @return {Plane} The near plane.
	 */
	this.getNear = function() {
		return _near;
	};

	/**
	 * Gets far plane.
	 *
	 * @return {Plane} The far plane.
	 */
	this.getFar = function() {
		return _far;
	};

	/**
	 * Gets bottom plane.
	 *
	 * @return {Plane} The bottom plane.
	 */
	this.getBottom = function() {
		return _bottom;
	};

	/**
	 * Gets top plane.
	 *
	 * @return {Plane} The top plane.
	 */
	this.getTop = function() {
		return _top;
	};

	/**
	 * Gets left plane.
	 *
	 * @return {Plane} The left plane.
	 */
	this.getLeft = function() {
		return _left;
	};

	/**
	 * Gets right plane.
	 *
	 * @return {Plane} The right plane.
	 */
	this.getRight = function() {
		return _right;
	};

	/**
	 * Updates planes to the matrix.
	 */
	var updatePlanes = function() {
		_near.setComponents(_matrix[3] + _matrix[2], _matrix[7] + _matrix[6], _matrix[11] + _matrix[10], _matrix[15] + _matrix[14]);
		_far.setComponents(_matrix[3] - _matrix[2], _matrix[7] - _matrix[6], _matrix[11] - _matrix[10], _matrix[15] - _matrix[14]);
		_bottom.setComponents(_matrix[3] + _matrix[1], _matrix[7] + _matrix[5], _matrix[11] + _matrix[9], _matrix[15] + _matrix[13]);
		_top.setComponents(_matrix[3] - _matrix[1], _matrix[7] - _matrix[5], _matrix[11] - _matrix[9], _matrix[15] - _matrix[13]);
		_left.setComponents(_matrix[3] + _matrix[0], _matrix[7] + _matrix[4], _matrix[11] + _matrix[8], _matrix[15] + _matrix[12]);
		_right.setComponents(_matrix[3] - _matrix[0], _matrix[7] - _matrix[4], _matrix[11] - _matrix[8], _matrix[15] - _matrix[12]);
	};

	/**
	 * Sets the frustum to the frustum corresponding to the specified view projection matrix.
	 *
	 * @param {mat4} matrix The view projection matrix.
	 */
	this.set = function(matrix) {
		mat4.copy(_matrix, matrix);
		updatePlanes.call(this);
	};

	/**
	 * Checks if frustum intersects the bounding box.
	 *
	 * @param {BoundingBox} boundingBox The bounding box.
	 * @return {Boolean} True if intersects and false otherwise.
	 */
	this.intersectsBoundingBox = function(boundingBox) {
		return boundingBox.intersectsFrustum(this);
	};
}

export { Frustum };