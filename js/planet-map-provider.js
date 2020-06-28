/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines planet map provider namespace.
 */
function PlanetMapProvider() {}

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