/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines bounding box class.
 */
function BoundingBox() {
	var _min = vec3.create();
	var _max = vec3.create();

	/**
	 * Sets the bounding box to bounds.
	 *
	 * @param {vec3} min The minimum vector.
	 * @param {vec3} max The maximum vector.
	 */
	this.set = function(min, max) {
		vec3.copy(_min, min);
		vec3.copy(_max, max);
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
			(_min[0] + _max[0]) * 0.5, 
			(_min[1] + _max[1]) * 0.5, 
			(_min[2] + _max[2]) * 0.5);
		var distance = plane.distance(center);

		// Get the extents of the box from its center along each axis.
		var extentX = (_max[0] - _min[0]) * 0.5;
		var extentY = (_max[1] - _min[1]) * 0.5;
		var extentZ = (_max[2] - _min[2]) * 0.5;

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