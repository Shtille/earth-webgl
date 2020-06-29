/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines plane class.
 */
function Plane() {
	this.normal = vec3.create();
	this.distance = 0;

	/**
	 * Returns normal.
	 *
	 * @return {vec3} The normal.
	 */
	this.getNormal = function() {
		return this.normal;
	};

	/**
	 * Returns distance.
	 *
	 * @return {Number} The distance.
	 */
	this.getDistance = function() {
		return this.distance;
	};

	/**
	 * Sets values.
	 *
	 * @param {vec3} normal The normal.
	 * @param {Number} distance The distance.
	 */
	this.set = function(normal, distance) {
		vec3.normalize(this.normal, normal);
		this.distance = distance;
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
		vec3.set(this.normal, normalX, normalY, normalZ);
		this.distance = distance;
		vec3.normalize(this.normal, this.normal);
	};

	/**
	 * Computes distance from point to plane.
	 *
	 * @param {vec3} point The point.
	 * @return {Number} The distance.
	 */
	this.pointDistance = function(point) {
		return this.normal[0] * point[0] + 
			   this.normal[1] * point[1] + 
			   this.normal[2] * point[2] + 
			   this.distance;
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