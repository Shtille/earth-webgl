/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { PlanetRequestType } from './planet-request.js';
import { PlanetRenderable } from './planet-renderable.js';

/**
 * Defines planet tree node class.
 *
 * @param {PlanetTree} tree The planet tree instance.
 */
function PlanetTreeNode(tree) {
	this.tree = tree;

	this.mapTile = null;
	this.renderable = null;

	this.lod = 0;
	this.x = 0;
	this.y = 0;

	this.lastRendered = 0;
	this.lastOpened = 0;

	this.hasChildren = false;
	this.pageOut = false;

	this.requestRenderable = false;
	this.requestMapTile = false;
	this.requestPageOut = false;
	this.requestSplit = false;
	this.requestMerge = false;

	this.parentSlot = -1;
	this.parent = null;
	this.children = new Array(4);

	/**
	 * Constructor.
	 */
	this.create = function() {
		var cube = this.tree.getCube();
		this.lastOpened = this.lastRendered = cube.getFrameCounter();
		for (var i = 0; i < 4; i++) {
			this.children[i] = null;
		}
	};

	/**
	 * Destructor.
	 */
	this.destroy = function() {
		var cube = this.tree.getCube();
		var map = cube.getMap();
		cube.unrequest(this);
		if (this.parent)
			this.parent.children[this.parentSlot] = null;
		map.deleteNode(this);
		this.destroyMapTile();
		this.destroyRenderable();
		for (var i = 0; i < 4; ++i)
			this.detachChild(i);

		this.tree = null;
		this.parent = null;
	};

	/**
	 * Attaches child at given position.
	 *
	 * @param {PlanetTreeNode} child     The child.
	 * @param {Number}         position  The position from 0 to 3.
	 */
	this.attachChild = function(child, position) {
		this.children[position] = child;
		child.parent = this;
		child.parentSlot = position;

		child.lod = this.lod + 1;
		child.x = this.x * 2 + (position % 2);
		child.y = this.y * 2 + Math.floor(position / 2);

		this.hasChildren = true;
	};

	/**
	 * Detaches child at given position.
	 *
	 * @param {Number}         position  The position from 0 to 3.
	 */
	this.detachChild = function(position) {
		if (this.children[position]) {
			this.children[position].destroy();
			this.children[position] = null;

			this.hasChildren = this.children[0] !== null
			                || this.children[1] !== null
			                || this.children[2] !== null
			                || this.children[3] !== null;
		}
	};

	/**
	 * Checks if node split.
	 *
	 * @return {Boolean} True if split and false otherwise.
	 */
	this.isSplit = function() {
		return this.hasChildren;
	};

	/**
	 * Gets priority.
	 *
	 * @return {Number} The priorty.
	 */
	this.getPriority = function() {
		if (this.renderable) {
			return this.renderable.getLodPriority();
		} else {
			if (this.parent)
				return this.parent.getPriority();
			return 0.0;
		}
	};

	/**
	 * Checks if node will be rendered.
	 *
	 * @return {Boolean} True if node will be rendered and false otherwise.
	 */
	this.willRender = function() {
		// Being asked to render ourselves.
		if (!this.renderable) {
			var cube = this.tree.getCube();
			this.lastOpened = this.lastRendered = cube.getFrameCounter();

			if (this.pageOut && this.hasChildren)
				return true;

			if (!this.requestRenderable)
			{
				this.requestRenderable = true;
				cube.request(this, PlanetRequestType.REQUEST_RENDERABLE);
			}
			return false;
		}
		return true;
	};

	/**
	 * Renders self.
	 * @private
	 */
	var renderSelf = function() {
		var cube = this.tree.getCube();

		// if (owner_->cube_->preprocess_)
		// 	return;

		var shader = cube.getShader();
		var face_transform = cube.getFaceTransform(this.tree.getFace());

		// Vertex shader
		gl.uniform4fv(shader.getUniformLocation("u_stuv_scale"), this.renderable.getStuvScale());
		gl.uniform4fv(shader.getUniformLocation("u_stuv_position"), this.renderable.getStuvPosition());
		gl.uniform1f(shader.getUniformLocation("u_skirt_height"), this.renderable.getDistance());
		gl.uniformMatrix3fv(shader.getUniformLocation("u_face_transform"), face_transform);

		// Fragment shader
		gl.uniform4fv(shader.getUniformLocation("u_color"), this.renderable.getColor());

		// Bind texture
		this.renderable.getMapTile().bindTexture();

		// Render tile mesh
		cube.renderTileMesh();
	};

	/**
	 * Renders node recursively.
	 *
	 * @return {Number} The number of rendered nodes.
	 */
	this.render = function() {
		var cube = this.tree.getCube();
		// Determine if this node's children are render-ready.
		var will_render_children = true;
		for (var i = 0; i < 4; ++i) {
			// Note: intentionally call willRender on /all/ children, not just until one fails,
			// to ensure all 4 children are queued in immediately.
			if (!this.children[i] || !this.children[i].willRender())
				will_render_children = false;
		}

		// If node is paged out, always recurse.
		if (this.pageOut) {
			// Recurse down, calculating min recursion level of all children.
			var min_level = this.children[0].render();
			for (var i = 1; i < 4; ++i) {
				var level = this.children[i].render();
				if (level < min_level)
					min_level = level;
			}
			// If we are a shallow node.
			if (!this.requestRenderable && min_level <= 1) {
				this.requestRenderable = true;
				cube.request(this, PlanetRequestType.REQUEST_RENDERABLE);
			}
			return min_level + 1;
		}

		// If we are renderable, check LOD/visibility.
		if (this.renderable) {
			this.renderable.setFrameOfReference();

			// If invisible, return immediately.
			if (this.renderable.isClipped())
				return 1;

			// Whether to recurse down.
			var recurse = false;

			// If the texture is not fine enough...
			if (!this.renderable.isInMIPRange()) {
				// If there is already a native res map-tile...
				if (this.mapTile) {
					// Make sure the renderable is up-to-date.
					if (this.renderable.getMapTile() == this.mapTile) {
						// Split so we can try this again on the child tiles.
						recurse = true;
					}
				} else { // Otherwise try to get native res tile data.
					// Make sure no parents are waiting for tile data update.
					var ancestor = this;
					var parent_request = false;
					while (ancestor && !ancestor.mapTile && !ancestor.pageOut) {
						if (ancestor.requestMapTile || ancestor.requestRenderable) {
							parent_request = true;
							break;
						}
						ancestor = ancestor.parent;
					}

					if (!parent_request) {
						// Request a native res map tile.
						this.requestMapTile = true;
						cube.request(this, PlanetRequestType.REQUEST_MAPTILE);
					}
				}
			}

			// If the geometry is not fine enough...
			if ((this.hasChildren || !this.requestMapTile) && !this.renderable.isInLODRange()) {
				// Go down an LOD level.
				recurse = true;
			}

			// If a recursion was requested...
			if (recurse) {
				// Update recursion counter, used to find least recently used nodes to page out.
				this.lastOpened = cube.getFrameCounter();

				// And children are available and renderable...
				if (this.hasChildren) {
					if (will_render_children) {
						// Recurse down, calculating min recursion level of all children.
						var min_level = this.children[0].render();
						for (var i = 1; i < 4; ++i) {
							var level = this.children[i].render();
							if (level < min_level)
								min_level = level;
						}
						// If we are a shallow node with a tile that is not being rendered or close to being rendered.
						if (min_level > 1 && this.mapTile && false) {
							page_out_ = true;
							this.destroyRenderable();
							this.destroyMapTile();
						}
						return min_level + 1;
					}
				} else if (!this.requestSplit) {
					// If no children exist yet, request them.
					this.requestSplit = true;
					cube.request(this, PlanetRequestType.REQUEST_SPLIT);
				}
			}

			// Last rendered flag, used to find ancestor patches that can be paged out.
			this.lastRendered = cube.getFrameCounter();

			// Otherwise, render ourselves.
			renderSelf.call(this);

			return 1;
		}
		return 0;
	};

	/**
	 * Propagates LOD distances.
	 * @private
	 */
	var propagateLodDistances = function() {
		if (this.renderable) {
			var max_child_distance = 0.0;
			// Get maximum LOD distance of all children.
			for (var i = 0; i < 4; ++i) {
				if (this.children[i] && this.children[i].renderable) {
					// Increase LOD distance w/ centroid distances, to ensure proper LOD nesting.
					var child_distance = this.children[i].renderable.getLodDistance();
					if (max_child_distance < child_distance)
						max_child_distance = child_distance;
				}
			}
			// Store in renderable.
			this.renderable.setChildLodDistance(max_child_distance);
		}
		// Propagate changes to parent.
		if (this.parent)
			this.parent.propagateLodDistances.call(this);
	};

	/**
	 * Prepares map tile.
	 *
	 * @param {PlanetMap} map The map.
	 * @return {Boolean} True if success and false otherwise.
	 */
	this.prepareMapTile = function(map) {
		return map.prepareTile(this);
	};

	/**
	 * Creates map tile.
	 *
	 * @param {PlanetMap} map The map.
	 */
	this.createMapTile = function(map) {
		if (this.mapTile)
			throw new Error("Tile already exists");
		this.mapTile = map.finalizeTile(this);
	};

	/**
	 * Destroys map tile.
	 */
	this.destroyMapTile = function() {
		if (this.mapTile)
			this.mapTile.destroy();
		this.mapTile = null;
	};

	/**
	 * Creates renderable.
	 *
	 * @param {PlanetMapTile} mapTile The map tile.
	 */
	this.createRenderable = function(mapTile) {
		if (this.renderable)
			throw new Error("Creating renderable that already exists.");
		if (this.pageOut)
			this.pageOut = false;
		this.renderable = new PlanetRenderable(this, mapTile);
		this.renderable.create();
		propagateLodDistances.call(this);
	};

	/**
	 * Destroys renderable.
	 */
	this.destroyRenderable = function() {
		if (this.renderable)
			this.renderable.destroy();
		this.renderable = null;
		propagateLodDistances.call(this);
	};
}

/**
 * Nodes compare function in last opened increase order.
 *
 * @param {PlanetTreeNode} first   The first node.
 * @param {PlanetTreeNode} second  The second node.
 */
PlanetTreeNode.compareLastOpened = function(first, second) {
	return first.lastOpened > second.lastOpened;
};

export { PlanetTreeNode };