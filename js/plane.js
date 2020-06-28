/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines plane class.
 */
function Plane() {
	var _normal = vec3.create();
	var _distance = 0;

	/**
	 * Returns normal.
	 *
	 * @return {vec3} The normal.
	 */
	this.getNormal = function() {
		return _normal;
	};

	/**
	 * Returns distance.
	 *
	 * @return {Number} The distance.
	 */
	this.getDistance = function() {
		return _distance;
	};

	/**
	 * Sets values.
	 *
	 * @param {vec3} normal The normal.
	 * @param {Number} distance The distance.
	 */
	this.set = function(normal, distance) {
		vec3.copy(_normal, normal);
		_distance = distance;
	};

	/**
	 * Sets values.
	 *
	 * @param {Number} normalX The normal x coordinate.
	 * @param {Number} normalY The normal y coordinate.
	 * @param {Number} normalZ The normal z coordinate.
	 * @param {Number} distance The distance.
	 */
	this.setComponents = function(normalX, normalY, normalZ, distance) {
		_normal[0] = normalX;
		_normal[1] = normalY;
		_normal[2] = normalZ;
		_distance = distance;
	};

	/**
	 * Computes distance from point to plane.
	 *
	 * @param {vec3} point The point.
	 * @return {Number} The distance.
	 */
	this.distance = function(point) {
		return _normal[0] * point[0] + _normal[1] * point[1] + _normal[2] * point[2] + _distance;
	};
}

/**
 * Represents plane intersection constants.
 */
Plane.INTERSECTION = {
	EXISTS: 0,
	FRONT: 1,
	BACK: -1
};

export { Plane };