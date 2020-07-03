/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { Texture } from './texture.js';
import { PlanetMapTile } from './planet-map-tile.js';
import { PlanetMapRenderer } from './planet-map-renderer.js';

/**
 * Defines planet map's map value class.
 *
 * @param {WebGLRenderingContext} gl  Rendering context.
 */
function PlanetMapValue(gl) {
	this.texture = new Texture(gl);
	this.imageData = new ImageData(256, 256);
	this.ready = false;
}

/**
 * Defines planet map class.
 *
 * @param {WebGLRenderingContext} gl  Rendering context.
 */
function PlanetMap(gl) {
	var gl = gl;
	var map = null;
	var renderer = null;

	/**
	 * Constructor.
	 */
	this.create = function() {
		map = new Map();
		renderer = new PlanetMapRenderer();
	};

	/**
	 * Destructor.
	 */
	this.destroy = function() {
		map.forEach(function(value, key){
			value.texture.destroy();
			value.texture = null;
		});
		map.clear();
		map = null;
		renderer.destroy();
		renderer = null;
	};

	/**
	 * Delete certain node from map.
	 *
	 * @param {PlanetTreeNode} node The node.
	 */
	this.deleteNode = function(node) {
		var value = map.get(node);
		if (value) {
			value.texture.destroy();
			value.texture = null;
			map.delete(node);
		}
	};

	/**
	 * Requests image loading.
	 * @private
	 *
	 * @param {PlanetTreeNode} node The node.
	 */
	var requestLoad = function(node) {
		var value = map.get(node);
		var face = node.tree.getFace();
		if (renderer.request(value.imageData, face, node.lod, node.x, node.y)) {
			// Image is ready
			value.texture.loadFromImageData(value.imageData);
			value.ready = true;
		}
	};

	/**
	 * Prepares tile's texture.
	 *
	 * @param {PlanetTreeNode} node The node.
	 * @return {Boolean} True if success and false otherwise.
	 */
	this.prepareTile = function(node) {
		var value = map.get(node);
		if (value) { // exists
			if (value.ready)
				return true;
		} else { // doesn't exist
			// Add key value pair
			map.set(node, new PlanetMapValue(gl));
			value = map.get(node);
		}
		// Add request
		requestLoad.call(this, node);
		return value.ready;
	};

	/**
	 * Finalizes tile.
	 *
	 * @param {PlanetTreeNode} node The node.
	 * @return {PlanetMapTile} The finalized map tile.
	 */
	this.finalizeTile = function(node) {
		var value = map.get(node);
		var mapTile = new PlanetMapTile(this, node, value.texture);
		mapTile.create();
		return mapTile;
	};

	// Finally
	this.create();
};

export { PlanetMap };