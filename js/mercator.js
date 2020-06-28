/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

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

export { Mercator };