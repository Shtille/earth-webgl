/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { Texture } from './texture.js';
import { PlanetMapTile } from './planet-map-tile.js';
import { PlanetMapProvider } from './planet-map-provider.js';

/**
 * Defines planet map's map value class.
 *
 * @param {WebGLRenderingContext} gl  Rendering context.
 */
function PlanetMapValue(gl) {
	this.texture = new Texture(gl);
	this.ready = false;
}

/**
 * Defines planet map class.
 *
 * @param {WebGLRenderingContext} gl  Rendering context.
 */
function PlanetMap(gl) {
	var gl = gl;
	var map = new Map();
	var textureToNodeMap = new Map();

	/**
	 * Constructor.
	 */
	this.create = function() {
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
		textureToNodeMap.clear();
		gl = null;
	};

	/**
	 * Delete certain node from map.
	 *
	 * @param {PlanetTreeNode} node The node.
	 */
	this.deleteNode = function(node) {
		var value = map.get(node);
		if (value) {
			textureToNodeMap.delete(value.texture);
			value.texture.destroy();
			value.texture = null;
			map.delete(node);
		}
	};

	/**
	 * Success loading callback.
	 *
	 * @param {Texture} texture The texture object.
	 */
	var onLoadSuccess = function(texture) {
		var node = textureToNodeMap.get(texture);
		var value = map.get(node);
		value.ready = true;
	};

	/**
	 * Error loading callback.
	 *
	 * @param {String}  message  The error message.
	 * @param {Texture} texture  The texture object.
	 */
	var onLoadError = function(message, texture) {
		console.log(message);
		// Clean resources
		var node = textureToNodeMap.get(texture);
		textureToNodeMap.delete(texture);
		texture.destroy();
		// And try again
		var value = map.get(node);
		value.texture = new Texture(gl); // replace texture with a new one
		requestLoad.call(this, node);
	};

	/**
	 * Requests texture loading.
	 * @private
	 *
	 * @param {PlanetTreeNode} node The node.
	 */
	var requestLoad = function(node) {
		var value = map.get(node);
		// Add texture to node mapping at first
		textureToNodeMap.set(value.texture, node);
		// Then request load
		var url = PlanetMapProvider.getURL(node.x, node.y, node.lod);
		value.texture.loadFromFile(url, onLoadSuccess, onLoadError, this);
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
			return value.ready;
		} else { // doesn't exist
			// Add key value pair
			map.set(node, new PlanetMapValue(gl));
			// Add loading request
			requestLoad.call(this, node);
			return false;
		}
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
};

export { PlanetMap };