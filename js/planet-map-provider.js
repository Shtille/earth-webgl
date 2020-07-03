/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines planet map provider namespace.
 */
function PlanetMapProvider() {}

PlanetMapProvider.BITMAP_WIDTH = 256;
PlanetMapProvider.BITMAP_HEIGHT = 256;
PlanetMapProvider.MIN_LOD = 0;
PlanetMapProvider.MAX_LOD = 22;
PlanetMapProvider.MIN_LATITUDE = -85.05112878;
PlanetMapProvider.MAX_LATITUDE =  85.05112878;
PlanetMapProvider.MIN_LONGITUDE = -180.0;
PlanetMapProvider.MAX_LONGITUDE =  180.0;

/**
 * Gets URL.
 *
 * @param {Number} x  Tile X coordinate.
 * @param {Number} y  Tile Y coordinate.
 * @param {Number} z  Tile level of detail.
 */
PlanetMapProvider.getURL = function(x, y, z) {
	return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
};

export { PlanetMapProvider };