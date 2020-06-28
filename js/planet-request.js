/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines planet request type enum.
 */
export const PlanetRequestType = {
	REQUEST_RENDERABLE: 0,
	REQUEST_MAPTILE: 1,
	REQUEST_SPLIT: 2,
	REQUEST_MERGE: 3
};

/**
 * Defines planet request class.
 *
 * @param {PlanetTreeNode} node   The node.
 * @param {Number}         type   The request type.
 */
export function PlanetRequest(node, type) {
	this.node = node;
	this.type = type;
};