/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { PlanetMapTile } from './planet-map-tile.js';

/**
 * Defines planet map class.
 */
function PlanetMap() {
	// TODO:

	/**
	 * Resets tile.
	 */
	this.resetTile = function() {
		//
	};

	/**
	 * Prepares tile.
	 *
	 * @param {PlanetTreeNode} node The node.
	 * @return {Boolean} True if success and false otherwise.
	 */
	this.prepareTile = function(node) {
		//
	};

	/**
	 * Finalizes tile.
	 *
	 * @param {PlanetTreeNode} node The node.
	 * @return {PlanetMapTile} The finalized map tile.
	 */
	this.finalizeTile = function(node) {
		step_ = 0;
		var mapTile = new PlanetMapTile(this, node, albedo_texture_);
		mapTile.create();
		return mapTile;
	};
};

export { PlanetMap };