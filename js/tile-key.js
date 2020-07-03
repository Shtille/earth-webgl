/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { Mercator } from './mercator.js';

/**
 * Defines simple class that holds quadkey.
 *
 * @param {Number} x   The tile X coordinate.
 * @param {Number} y   The tile Y coordinate.
 * @param {Number} lod The level of detail.
 */
function TileKey(x, y, lod) {
	this.quadKey = Mercator.tileXYToQuadKey(x, y, lod);
	this.x = x;
	this.y = y;
	this.lod = lod;
}

export { TileKey };