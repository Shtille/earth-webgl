/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { PlanetTreeNode } from './planet-tree-node.js';

/**
 * Defines planet tree class.
 * It holds a quad tree.
 *
 * @param {PlanetCube} cube The planet cube instance.
 * @param {Number}     face The face number (0 to 5).
 */
function PlanetTree(cube, face) {
	var cube = cube;
	var face = face;
	var root = null;

	/**
	 * Constructor.
	 */
	this.create = function() {
		root = new PlanetTreeNode(this);
		root.create();
	};

	/**
	 * Destructor.
	 */
	this.destroy = function() {
		root.destroy();
		root = null;
	};

	/**
	 * Renders entire tree.
	 */
	this.render = function() {
		if (root.willRender())
			root.render();
	};

	/**
	 * Gets cube (owner).
	 *
	 * @return {PlanetCube} The cube.
	 */
	this.getCube = function() {
		return cube;
	}

	/**
	 * Gets cube face.
	 *
	 * @return {Number} The cube face (from 0 to 5).
	 */
	this.getFace = function() {
		return face;
	}
}

export { PlanetTree };