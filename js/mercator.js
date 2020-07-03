/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { PlanetMapProvider } from './planet-map-provider.js';

/**
 * Defines Mercator namespace.
 */
function Mercator() {}

/**
 * Converts tile XY coordinates into a QuadKey at a specified level of detail.
 *
 * @param {Number} tileX 			Tile X coordinate.
 * @param {Number} tileY 			Tile Y coordinate.
 * @param {Number} levelOfDetail 	Level of detail, from 1 (lowest detail) to 23 (highest detail).
 * @return {String} The quad key.
 */
Mercator.tileXYToQuadKey = function(tileX, tileY, levelOfDetail) {
	var quadKey = new String();
	for (var i = levelOfDetail; i > 0; i--) {
		var digit = 0;
		var mask = 1 << (i - 1);
		if ((tileX & mask) != 0) {
			digit++;
		}
		if ((tileY & mask) != 0) {
			digit++;
			digit++;
		}  
		quadKey += digit.toString();
	}
	return quadKey;
}

/**
 * Converts a QuadKey into tile XY coordinates.
 *
 * @param {String} quadKey 			QuadKey of the tile.
 * @return {Object} The object containing tile X, tile Y and level of detail.
 */
Mercator.quadKeyToTileXY = function(quadKey) {
	var tileX = 0;
	var tileY = 0
	var levelOfDetail = quadKey.length;
	for (var i = levelOfDetail; i > 0; i--) {
		var mask = 1 << (i - 1);
		switch (quadKey[levelOfDetail - i]) {
			case '0':
				break;
			case '1':
				tileX |= mask;
				break;
			case '2':
				tileY |= mask;
				break;
			case '3':
				tileX |= mask;
				tileY |= mask;
				break;
		}
	}
	return {
		tileX: tileX,
		tileY: tileY,
		levelOfDetail: levelOfDetail
	};
}

/**
 * Returns map size for a given level of detail.
 *
 * @param {Number} level_of_detail Level of detail, from 0 (lowest detail) to 15 (highest detail).
 * @return {Number} The map size.
 */
Mercator.getMapSize = function(level_of_detail) {
	return PlanetMapProvider.BITMAP_WIDTH << level_of_detail;
}

/**
 * Transforms input longitude to [-180; +180] range.
 *
 * @param {Number} longitude Longitude of the point, in degrees.
 * @return {Number} Normalized longitude.
 */
Mercator.normalizedLongitude = function(longitude) {
	var clipped_longitude = longitude;
	while (clipped_longitude < -180.0)
		clipped_longitude += 360.0;
	while (clipped_longitude >= 180.0)
		clipped_longitude -= 360.0;
	return clipped_longitude;
}

/**
 * Clips value to range.
 *
 * @param {Number} value     The value.
 * @param {Number} min_value The minimum value.
 * @param {Number} max_value The maximum value.
 * @return {Number} Clipped value.
 */
Mercator.clip = function(value, min_value, max_value) {
	if (value < min_value)
		return min_value;
	else if (value > max_value)
		return max_value;
	else
		return value;
}

/**
 * Computes optimal level of detail (logically correct method).
 *
 * @param {Number} screen_pixel_size_x  Pixel size in degrees of one pixel in x direction.
 * @return {Number} Optimal level of detail.
 */
Mercator.getOptimalLevelOfDetail = function(screen_pixel_size_x) {
	const kInvLog2 = 1.442695040888963; // 1/ln(2)
	var lod = Math.ceil(Math.log((360.0/PlanetMapProvider.BITMAP_WIDTH)/screen_pixel_size_x) * kInvLog2);
	return Mercator.clip(lod, PlanetMapProvider.MIN_LOD, PlanetMapProvider.MAX_LOD);
}

/**
 * Converts a point longitude in WGS-84 coordinates (in degrees)
 * into pixel X at a specified map size.
 *
 * @param[in] {Number} longitude       Longitude of the point, in degrees.
 * @param[in] {Number} map_size        The map size.
 * @return {Number} The pixel coordinate X.
 */
Mercator.longitudeToPixelX = function(longitude, map_size) {
	longitude = Mercator.clip(longitude, PlanetMapProvider.MIN_LONGITUDE, PlanetMapProvider.MAX_LONGITUDE);
	var x = (longitude + 180.0) / 360.0;
	return Mercator.clip(Math.floor(x * map_size + 0.5), 0, map_size - 1);
}

/**
 * Converts a point latitude in WGS-84 coordinates (in degrees)
 * into pixel Y at a specified map size.
 *
 * @param[in] {Number} latitude        Latitude of the point, in degrees.
 * @param[in] {Number} map_size        The map size.
 * @return {Number} The pixel coordinate Y.
 */
Mercator.latitudeToPixelY = function(latitude, map_size) {
	latitude = Mercator.clip(latitude, PlanetMapProvider.MIN_LATITUDE, PlanetMapProvider.MAX_LATITUDE);
	var sin_latitude = Math.sin(latitude * Math.PI / 180.0);
	var y = 0.5 - Math.log((1.0 + sin_latitude) / (1.0 - sin_latitude)) / (4.0 * Math.PI);
	return Mercator.clip(Math.floor(y * map_size + 0.5), 0, map_size - 1);
}

/**
 * Converts a point from latitude/longitude WGS-84 coordinates (in degrees)
 * into pixel XY at a specified level of detail.
 *
 * @param[in] {Number} latitude        Latitude of the point, in degrees.
 * @param[in] {Number} longitude       Longitude of the point, in degrees.
 * @param[in] {Number} level_of_detail Level of detail, from 0 (lowest detail) to 15 (highest detail).
 * @param[out] {Array} pixel_xy        Output parameter receiving the XY coordinates of pixel.
 */
Mercator.latLongToPixelXY = function(latitude, longitude, level_of_detail, pixel_xy) {
	latitude = Mercator.clip(latitude, PlanetMapProvider.MIN_LATITUDE, PlanetMapProvider.MAX_LATITUDE);
	longitude = Mercator.clip(longitude, PlanetMapProvider.MIN_LONGITUDE, PlanetMapProvider.MAX_LONGITUDE);

	var x = (longitude + 180.0) / 360.0;
	var sin_latitude = Math.sin(latitude * Math.PI / 180.0);
	var y = 0.5 - Math.log((1.0 + sin_latitude) / (1.0 - sin_latitude)) / (4.0 * Math.PI);

	var map_size = Mercator.getMapSize(level_of_detail);
	pixel_xy[0] = Mercator.clip(Math.floor(x * map_size + 0.5), 0, map_size - 1);
	pixel_xy[1] = Mercator.clip(Math.floor(y * map_size + 0.5), 0, map_size - 1);
}

/**
 * Converts a point from latitude/longitude WGS-84 coordinates (in degrees)
 * into tile XY at a specified level of detail.
 *
 * @param[in] {Number} latitude        Latitude of the point, in degrees.
 * @param[in] {Number} longitude       Longitude of the point, in degrees.
 * @param[in] {Number} level_of_detail Level of detail, from 0 (lowest detail) to 15 (highest detail).
 * @param[out] {Array} tile_xy         Output parameter receiving the XY coordinates of tile.
 */
Mercator.latLongToTileXY = function(latitude, longitude, level_of_detail, tile_xy) {
	Mercator.latLongToPixelXY(latitude, longitude, level_of_detail, tile_xy);
	tile_xy[0] = Math.floor(tile_xy[0] / PlanetMapProvider.BITMAP_WIDTH);
	tile_xy[1] = Math.floor(tile_xy[1] / PlanetMapProvider.BITMAP_HEIGHT);
}

/**
 * Projects cube point onto sphere point (geodetic coordinates).
 *
 * @param[in] {Number} face    Index of the face of the cube (from 0 to 5).
 * @param[in] {Number} u       First coordinate of face point.
 * @param[in] {Number} v       Second coordinate of face point.
 * @param[out] {Array} latlon  Output parameter receiving the latitude longitude coordinates of point.
 */
Mercator.cubePointToLatLon = function(face, u, v, latlon) {
	var length;
	var x1, y1, z1;
	var x, y, z;
	// (u, v, 1) -> (x, y, z)
	length = Math.sqrt(u*u + v*v + 1.0);
	x1 = u / length;
	y1 = v / length;
	z1 = 1.0 / length;
	// Transform vector to face
	switch (face)
	{
	case 0:
		x = z1;
		y = y1;
		z = x1;
		break;
	case 1:
		x = -z1;
		y = y1;
		z = -x1;
		break;
	case 2:
		x = x1;
		y = z1;
		z = y1;
		break;
	case 3:
		x = x1;
		y = -z1;
		z = -y1;
		break;
	case 4:
		x = -x1;
		y = y1;
		z = z1;
		break;
	case 5:
		x = x1;
		y = y1;
		z = -z1;
		break;
	default:
		throw new Error("face should be in [0;5]");
		return;
	}
	// Transform sphere point to latitude and longitude
	const kRadToDeg = 180.0 / Math.PI;
	latlon[0] = Math.asin(y) * kRadToDeg;
	latlon[1] = Math.atan2(-z, x) * kRadToDeg;
}

export { Mercator };