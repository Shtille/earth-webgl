/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { BoundingBox } from './bounding-box.js';

/**
 * Defines planet renderable class.
 *
 * @param {PlanetTreeNode}  node     The node.
 * @param {PlanetMapTile}   mapTile  The map tile.
 */
function PlanetRenderable(node, mapTile) {
	var node = node;
	var mapTile = mapTile;

	var stuvScale = vec4.create();
	var stuvPosition = vec4.create();
	var color = vec4.create();
	var distance = 0;

	var boundingBox = new BoundingBox(); //!< bounding box in world coordinates
	var cosSectorAngle = 0;
	var sinSectorAngle = 0;
	var center = vec3.create();
	var surfaceNormal = vec3.create();
	var lodPriority = 0; //!< priority for nodes queue processing
	var childDistance = 0;
	var lodDifference = 0;

	var isInLODRange_ = false;
	var isInMIPRange_ = false;
	var isClipped_ = false;
	var isFarAway_ = false;

	/**
	 * Analyzes terrain.
	 * @private
	 */
	var analizeTerrain = function() {
		var cube = node.tree.getCube();
		var grid_size = cube.getGridSize();
		var planet_position = cube.getPosition();
		var planet_radius = cube.getRadius();
		var face_transform = cube.getFaceTransform(node.tree.getFace());

		// Calculate scales, offsets for tile position on cube face.
		var inv_scale = 2.0 / (1 << node.lod);
		var position_x = -1.0 + inv_scale * node.x;
		var position_y = -1.0 + inv_scale * node.y;

		// Keep track of extents.
		var min = vec3.fromValues(1e8, 1e8, 1e8);
		var max = vec3.fromValues(-1e8, -1e8, -1e8);
		vec3.set(center, 0.0, 0.0, 0.0);

		// Lossy representation of heightmap
		lodDifference = 0.0;

		// Calculate LOD error of sphere.
		var angle = Math.PI / (grid_size << Math.max(0, node.lod - 1));
		var sphere_error = (1 - Math.cos(angle)) * 1.4 * planet_radius;
		distance = sphere_error;

		// Process vertex data for regular grid.
		var sphere_point = vec3.create();
		var i,j,x,y;
		for (j = 0; j < grid_size; j++) {
			y = j / (grid_size - 1);

			for (i = 0; i < grid_size; i++) {
				x = i / (grid_size - 1);

				vec3.set(sphere_point, x * inv_scale + position_x, y * inv_scale + position_y, 1.0);
				vec3.normalize(sphere_point, sphere_point);
				vec3.transformMat3(sphere_point, sphere_point, face_transform);
				vec3.scale(sphere_point, sphere_point, planet_radius);

				vec3.add(center, center, sphere_point);

				vec3.min(min, min, sphere_point);
				vec3.max(max, max, sphere_point);
			}
		}

		// Calculate center.
		vec3.scale(center, center, 1 / (grid_size * grid_size));
		vec3.normalize(surfaceNormal, center);

		// Set bounding box (it should be in global coordinates)
		vec3.add(min, min, planet_position);
		vec3.add(max, max, planet_position);
		boundingBox.set(min, max);

		// Calculate sector angles
		var corner_points = new Array(4);
		corner_points[0] = vec3.fromValues(position_x, position_y, 1.0); // (0,0)
		corner_points[1] = vec3.fromValues(position_x, inv_scale + position_y, 1.0); // (0,1)
		corner_points[2] = vec3.fromValues(inv_scale + position_x, position_y, 1.0); // (1,0)
		corner_points[3] = vec3.fromValues(inv_scale + position_x, inv_scale + position_y, 1.0); // (1,1)
		var cos_angle = 1.0;
		var corner_point = vec3.create();
		var dot;
		for (i = 0; i < 4; ++i)
		{
			vec3.normalize(corner_point, corner_points[i]);
			vec3.transformMat3(corner_point, corner_point, face_transform);
			dot = vec3.dot(corner_point, surfaceNormal);
			if (dot < cos_angle)
				cos_angle = dot;
		}
		// Because angle is always less than Pi/2 thus we may easy compute sin(angle)
		cosSectorAngle = cos_angle;
		sinSectorAngle = Math.sqrt(1.0 - cos_angle * cos_angle);
	};

	/**
	 * Initializes displacement mapping.
	 * @private
	 */
	var initDisplacementMapping = function() {
		// Calculate scales, offsets for tile position on cube face.
		var inv_scale = 2.0 / (1 << node.lod);
		var position_x = -1.0 + inv_scale * node.x;
		var position_y = -1.0 + inv_scale * node.y;

		// Correct for GL texture mapping at borders.
		var uv_correction = 0.0; //.05 / (mMap->getWidth() + 1);

		// Calculate scales, offset for tile position in map tile.
		var relative_lod = node.lod - mapTile.getNode().lod;
		var inv_tex_scale = 1.0 / (1 << relative_lod) * (1.0 - uv_correction);
		var texture_x = inv_tex_scale * (node.x - (mapTile.getNode().x << relative_lod)) + uv_correction;
		var texture_y = inv_tex_scale * (node.y - (mapTile.getNode().y << relative_lod)) + uv_correction;

		// Set shader parameters
		stuvScale[0] = inv_scale;
		stuvScale[1] = inv_scale;
		stuvScale[2] = inv_tex_scale;
		stuvScale[3] = inv_tex_scale;
		stuvPosition[0] = position_x;
		stuvPosition[1] = position_y;
		stuvPosition[2] = texture_x;
		stuvPosition[3] = texture_y;

		// Set color/tint
		//color[0] = Math.cos(mapTile.getNode().lod * 0.70) * 0.35 + 0.85;
		//color[1] = Math.cos(mapTile.getNode().lod * 1.71) * 0.35 + 0.85;
		//color[2] = Math.cos(mapTile.getNode().lod * 2.64) * 0.35 + 0.85;
		//color[3] = 1.0;
		vec4.set(color, 1.0, 1.0, 1.0, 1.0);
	};

	/**
	 * Constructor.
	 */
	this.create = function() {
		childDistance = 0;
		analizeTerrain.call(this);
		initDisplacementMapping.call(this);
	};

	/**
	 * Destructor.
	 */
	this.destroy = function() {
		node = null;
		mapTile = null;
	};

	/**
	 * Returns STUV scale.
	 *
	 * @return {vec4} The STUV scale.
	 */
	this.getStuvScale = function() {
		return stuvScale;
	};

	/**
	 * Returns STUV position.
	 *
	 * @return {vec4} The STUV position.
	 */
	this.getStuvPosition = function() {
		return stuvPosition;
	};

	/**
	 * Returns color.
	 *
	 * @return {vec4} The color.
	 */
	this.getColor = function() {
		return color;
	};

	/**
	 * Returns this LOD distance.
	 *
	 * @return {Number} This LOD distance.
	 */
	this.getDistance = function() {
		return distance;
	};

	/**
	 * Returns map tile.
	 *
	 * @return {PlanetMapTile} The map tile.
	 */
	this.getMapTile = function() {
		return mapTile;
	};

	/**
	 * Checks if tile is in LOD range.
	 *
	 * @return {Boolean} True if tile is in LOD range and false otherwise.
	 */
	this.isInLODRange = function() {
		return isInLODRange_;
	};

	/**
	 * Checks if tile is in MIP range.
	 *
	 * @return {Boolean} True if tile is in MIP range and false otherwise.
	 */
	this.isInMIPRange = function() {
		return isInMIPRange_;
	};

	/**
	 * Checks if tile is clipped.
	 *
	 * @return {Boolean} True if clipped and false otherwise.
	 */
	this.isClipped = function() {
		return isClipped_;
	};

	/**
	 * Checks if tile is far away.
	 *
	 * @return {Boolean} True if far away and false otherwise.
	 */
	this.isFarAway = function() {
		return isFarAway_;
	};

	/**
	 * Returns LOD priority.
	 *
	 * @return {Number} The LOD priority.
	 */
	this.getLodPriority = function() {
		return lodPriority;
	};

	/**
	 * Returns LOD distance.
	 *
	 * @return {Number} The LOD distance.
	 */
	this.getLodDistance = function() {
		if (distance > childDistance)
			return distance;
		else
			return childDistance;
	};

	/**
	 * Sets child LOD distance.
	 *
	 * @param {Number} lodDistance The LOD distance.
	 */
	this.setChildLodDistance = function(lodDistance) {
		childDistance = lodDistance;
	};

	/**
	 * Sets frame of reference.
	 */
	this.setFrameOfReference = function() {
		var cube = node.tree.getCube();
		var planet_radius = cube.getRadius();
		var params = cube.getLODparams();
		var frustum = cube.getFrustum();

		// Bounding box clipping.
		isClipped_ = false;//frustum.intersectsBoundingBox(boundingBox);

		// Spherical distance map clipping.
		var point_dot_n = vec3.dot(params.cameraPosition, surfaceNormal);
		var cos_camera_angle = point_dot_n / params.cameraDistance;
		// We should exclude collinear cases
		if (cos_camera_angle > 0.99)
		{
			// Always visible
			isFarAway_ = false;
		}
		else if (cos_camera_angle < -0.9)
		{
			// Always invisible
			isFarAway_ = true;
		}
		else if (cos_camera_angle > cosSectorAngle)
		{
			// Always visible
			isFarAway_ = false;
		}
		else
		{
			// Normal case, we have to compute visibility
			var side = vec3.create();
			var normal = vec3.create();
			side[0] = params.cameraPosition[0] - point_dot_n * surfaceNormal[0];
			side[1] = params.cameraPosition[1] - point_dot_n * surfaceNormal[1];
			side[2] = params.cameraPosition[2] - point_dot_n * surfaceNormal[2];
			vec3.normalize(side, side);
			normal[0] = surfaceNormal[0] * cosSectorAngle + side[0] * sinSectorAngle;
			normal[1] = surfaceNormal[1] * cosSectorAngle + side[1] * sinSectorAngle;
			normal[2] = surfaceNormal[2] * cosSectorAngle + side[2] * sinSectorAngle;
			isFarAway_ = !(vec3.dot(params.cameraPosition, normal) > planet_radius);
		}
		isClipped_ = isClipped_ || isFarAway_;

		// Get vector from center to camera and normalize it.
		var position_offset = vec3.create();
		vec3.sub(position_offset, params.cameraPosition, center);
		var view_direction = position_offset;

		// Find the offset between the center of the grid and the grid point closest to the camera (rough approx).
		var reference_length = Math.PI * 0.375 * planet_radius / (1 << node.lod);
		var reference_offset = vec3.create();
		vec3.scale(reference_offset, surfaceNormal, vec3.dot(view_direction, surfaceNormal));
		vec3.sub(reference_offset, view_direction, reference_offset);
		if (vec3.squaredLength(reference_offset) > reference_length * reference_length)
		{
			vec3.normalize(reference_offset, reference_offset);
			vec3.scale(reference_offset, reference_offset, reference_length);
		}

		// Find the position offset to the nearest point to the camera (approx).
		var near_position_offset = vec3.create();
		vec3.sub(near_position_offset, position_offset, reference_offset);
		var near_position_distance = vec3.length(near_position_offset);
		var to_camera = vec3.create();
		vec3.scale(to_camera, near_position_offset, 1 / near_position_distance);
		var nearest_point_normal = vec3.create();
		vec3.add(nearest_point_normal, reference_offset, center);
		vec3.normalize(nearest_point_normal, nearest_point_normal);

		// Determine LOD priority.
		lodPriority = -vec3.dot(to_camera, params.cameraFront);

		isInLODRange_ = this.getLodDistance() * params.geoFactor < near_position_distance;

		// Calculate texel resolution relative to near grid-point (approx).
		var cos_angle = vec3.dot(nearest_point_normal, to_camera); // tile incination angle
		var face_size = cos_angle * planet_radius * Math.PI * 0.5; // Curved width/height of texture cube face on the sphere
		var cube_side_pixels = 256 << mapTile.getNode().lod;
		var texel_size = face_size / cube_side_pixels; // Size of a single texel in world units

		isInMIPRange_ = texel_size * params.texFactor < near_position_distance;
	};
}

export { PlanetRenderable };