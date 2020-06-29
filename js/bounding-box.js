/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { Plane } from './plane.js';

/**
 * Defines bounding box class.
 */
function BoundingBox() {
	this.min = vec3.create();
	this.max = vec3.create();

	/**
	 * Sets the bounding box to bounds.
	 *
	 * @param {vec3} min The minimum vector.
	 * @param {vec3} max The maximum vector.
	 */
	this.set = function(min, max) {
		vec3.copy(this.min, min);
		vec3.copy(this.max, max);
	};

	/**
	 * Checks if bounding box intersects the frustum.
	 *
	 * @param {Frustum} frustum The frustum.
	 * @return {Boolean} True if intersects and false otherwise.
	 */
	this.intersectsFrustum = function(frustum) {
		// The box must either intersect or be in the positive half-space of all six planes of the frustum.
		return (this.intersectsPlane(frustum.getNear()) != Plane.INTERSECTION.BACK &&
				this.intersectsPlane(frustum.getFar()) != Plane.INTERSECTION.BACK &&
				this.intersectsPlane(frustum.getLeft()) != Plane.INTERSECTION.BACK &&
				this.intersectsPlane(frustum.getRight()) != Plane.INTERSECTION.BACK &&
				this.intersectsPlane(frustum.getBottom()) != Plane.INTERSECTION.BACK &&
				this.intersectsPlane(frustum.getTop()) != Plane.INTERSECTION.BACK);
	};

	/**
	 * Checks if bounding box intersects the plane.
	 *
	 * @param {Plane} plane The plane.
	 * @return {Boolean} True if intersects and false otherwise.
	 */
	this.intersectsPlane = function(plane) {
		// Calculate the distance from the center of the box to the plane.
		var center = vec3.fromValues(
			(this.min[0] + this.max[0]) * 0.5, 
			(this.min[1] + this.max[1]) * 0.5, 
			(this.min[2] + this.max[2]) * 0.5);
		var distance = plane.pointDistance(center);

		// Get the extents of the box from its center along each axis.
		var extentX = (this.max[0] - this.min[0]) * 0.5;
		var extentY = (this.max[1] - this.min[1]) * 0.5;
		var extentZ = (this.max[2] - this.min[2]) * 0.5;

		var planeNormal = plane.getNormal();
		if (Math.abs(distance) <= (Math.abs(extentX * planeNormal[0]) + 
			                       Math.abs(extentY * planeNormal[1]) + 
			                       Math.abs(extentZ * planeNormal[2])))
		{
			return Plane.INTERSECTION.EXISTS;
		}

		if (distance > 0.0)
			return Plane.INTERSECTION.FRONT;
		else
			return Plane.INTERSECTION.BACK;
	};
}

export { BoundingBox };