/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines planet map tile class.
 *
 * @param {PlanetMap}      map             The map.
 * @param {PlanetTreeNode} node            The node.
 * @param {Texture}        albedoTexture   The albedo texture.
 */
function PlanetMapTile(map, node, albedoTexture) {
	var map = map;
	var node = node;
	var albedoTexture = albedoTexture;

	/**
	 * Constructor.
	 */
	this.create = function() {
		//
	};

	/**
	 * Destructor.
	 */
	this.destroy = function() {
		map = null;
		node = null;
		albedoTexture = null;
	};

	/**
	 * Returns node.
	 *
	 * @return {PlanetTreeNode} The node.
	 */
	this.getNode = function() {
		return node;
	};

	/**
	 * Binds texture.
	 */
	this.bindTexture = function() {
		albedoTexture.bind(0);
	};
};

export { PlanetMapTile };