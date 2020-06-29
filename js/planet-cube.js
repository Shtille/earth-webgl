/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { LinkedList } from './linked-list.js';
import { PlanetTileMesh } from './planet-tile-mesh.js';
import { PlanetMap } from './planet-map.js';
import { PlanetTree } from './planet-tree.js';
import { PlanetRequest, PlanetRequestType } from './planet-request.js';

/**
 * Defines planet cube class.
 * Contains six quad trees (one per cube side).
 *
 * @param {Object} options The options object. Can have following options:
 *      - {WebGLRenderingContext} gl              Rendering context.
 *      - {VertexFormat}          vertexFormat    Vertex format.
 *      - {Shader}                shader          Shader.
 *      - {Number}                radius          Planet radius.
 *      - {Number}                position        Planet position.
 *      - {Object}                camera          The camera.
 *      - {Object}                frustum         The frustum.
 *      - {Number}                gridSize        Grid size (vertices per tile side). Optional.
 */
function PlanetCube(options) {
	var gl = options.gl;
	var vertexFormat = options.vertexFormat;
	var shader = options.shader;
	var radius = options.radius;
	var position = options.position;
	var camera = options.camera;
	var frustum = options.frustum;
	var gridSize = options.gridSize || 17;

	var faces = null;
	var tileMesh = null;
	var map = null;
	var lodParams = {
		geoFactor: 1,
		texFactor: 1,
		cameraPosition: vec3.create(), //!< position of camera in geocentric coordinate system
		cameraFront: vec3.create(), //!< forward direction vector of camera
		cameraDistance: 0 //!< length of camera_position vector (to not compute per each tile)
	};
	var frameCounter = 0;
	var lodFreeze = false;
	var treeFreeze = false;
	var preprocess = false;

	var modelMatrix = mat4.create();
	var modelViewProjectionMatrix = mat4.create();
	var faceTransform = mat3.create();
	var lastFaceTransformFace = -1; // last face value used to call face transform

	var inlineRequests = new LinkedList();
	var renderRequests = new LinkedList();
	var openNodes = new Set();

	const lodLimit = 12;
	const textureSize = 256;
	// The more detail coefficient is, the less detalization is required
	const kGeoDetail = 6.0;
	const kTexDetail = 3.0;

	/**
	 * Constructor.
	 * @private
	 */
	var create = function() {
		faces = new Array(6);
		for (var i = 0; i < 6; i++) {
			faces[i] = new PlanetTree(this, i);
			faces[i].create();
		}
		tileMesh = new PlanetTileMesh(gl, vertexFormat, gridSize);
		tileMesh.create();
		tileMesh.makeRenderable();
		map = new PlanetMap(gl);
		map.create();
		// For future uses
		mat4.fromTranslation(modelMatrix, position);
	};

	/**
	 * Destructor.
	 */
	this.destroy = function() {
		inlineRequests.destroy();
		renderRequests.destroy();
		for (var i = 0; i < 6; i++) {
			faces[i].destroy();
			faces[i] = null;
		}
		faces = null;
		tileMesh.destroy();
		tileMesh = null;
		map.destroy();
		map = null;
	};

	/**
	 * Sets parameters.
	 *
	 * @param {Number} fovy    The field of view in Y direction in radians.
	 * @param {Number} height  The screen height.
	 */
	this.setParameters = function(fovy, height) {
		var fov = 2.0 * Math.tan(0.5 * fovy);

		var geoDetail = Math.max(1.0, kGeoDetail);
		lodParams.geoFactor = height / (geoDetail * fov);

		var texDetail = Math.max(1.0, kTexDetail);
		lodParams.texFactor = height / (texDetail * fov);
	};

	/**
	 * Updates all data.
	 */
	this.update = function() {
		// Update LOD state.
		if (!lodFreeze) {
			vec3.sub(lodParams.cameraPosition, camera.getPosition(), position);
			lodParams.cameraFront = camera.getForward();
			lodParams.cameraDistance = vec3.length(lodParams.cameraPosition);
		}
		// Handle delayed requests (for rendering new tiles).
		handleRequests.call(this, renderRequests);

		if (!treeFreeze) {
			// Prune the LOD tree
			pruneTree.call(this);

			// Update LOD requests.
			handleRequests.call(this, inlineRequests);
		}
	};

	/**
	 * Renders all trees.
	 */
	this.render = function() {
		var projection_view_matrix = frustum.getMatrix();
		mat4.multiply(modelViewProjectionMatrix, projection_view_matrix, modelMatrix);

		gl.useProgram(shader.program);
		gl.uniformMatrix4fv(shader.getUniformLocation("u_projection_view_model"),
			false,
			modelViewProjectionMatrix);

		for (var i = 0; i < 6; i++) {
			faces[i].render();
		}
		frameCounter++;
	};

	/**
	 * Renders tile mesh.
	 */
	this.renderTileMesh = function() {
		tileMesh.render();
	};

	/**
	 * Gets frame counter.
	 *
	 * @return {Number} The frame counter.
	 */
	this.getFrameCounter = function() {
		return frameCounter;
	};

	/**
	 * Gets grid size.
	 *
	 * @return {Number} The grid size.
	 */
	this.getGridSize = function() {
		return gridSize;
	};

	/**
	 * Gets planet position.
	 *
	 * @return {vec3} The planet position.
	 */
	this.getPosition = function() {
		return position;
	};

	/**
	 * Gets planet radius.
	 *
	 * @return {Number} The planet radius.
	 */
	this.getRadius = function() {
		return radius;
	};

	/**
	 * Gets LOD params.
	 *
	 * @return {Object} LOD params.
	 */
	this.getLODparams = function() {
		return lodParams;
	};

	/**
	 * Gets frustum.
	 *
	 * @return {Frustum} The frustum.
	 */
	this.getFrustum = function() {
		return frustum;
	};

	/**
	 * Gets shader.
	 *
	 * @return {Shader} The shader.
	 */
	this.getShader = function() {
		return shader;
	};

	/**
	 * Gets map.
	 *
	 * @return {PlanetMap} The map.
	 */
	this.getMap = function() {
		return map;
	};

	/**
	 * Gets WebGL context.
	 *
	 * @return {WebGLRenderingContext} The WebGL context.
	 */
	this.getGL = function() {
		return gl;
	};

	/**
	 * Gets face transform for a given face.
	 *
	 * @param {Number} face The face (from 0 to 5).
	 * @return {mat3} The face transform matrix.
	 */
	this.getFaceTransform = function(face) {
		if (lastFaceTransformFace === face) {
			return faceTransform;
		} else {
			lastFaceTransformFace = face;
			switch (face) {
			case 0:
				mat3.set(faceTransform,
					 0, 0, 1,
					 0, 1, 0,
					 1, 0, 0);
				break;
			case 1:
				mat3.set(faceTransform,
					 0, 0,-1,
					 0, 1, 0,
					-1, 0, 0);
				break;
			case 2:
				mat3.set(faceTransform,
					 1, 0, 0,
					 0, 0, 1,
					 0, 1, 0);
				break;
			case 3:
				mat3.set(faceTransform,
					 1, 0, 0,
					 0, 0,-1,
					 0,-1, 0);
				break;
			case 4:
				mat3.set(faceTransform,
					-1, 0, 0,
					 0, 1, 0,
					 0, 0, 1);
				break;
			case 5:
				mat3.set(faceTransform,
					 1, 0, 0,
					 0, 1, 0,
					 0, 0,-1);
				break;
			default:
				alert("Wrong face");
				break;
			}
			return faceTransform;
		}
	};

	/**
	 * Adds request.
	 * @see PlanetRequestType
	 *
	 * @param {PlanetTreeNode}     node      The node.
	 * @param {Number}             type      The request type.
	 * @param {Boolean}            priority  Has priority. False by default.
	 */
	this.request = function(node, type, priority) {
		var newRequest = new PlanetRequest(node, type);
		var requestQueue = (type == PlanetRequestType.REQUEST_MAPTILE) ? renderRequests : inlineRequests;
		if (priority)
			requestQueue.pushFront(newRequest);
		else
			requestQueue.pushBack(newRequest);
	};

	/**
	 * Removes all requests for the node.
	 *
	 * @param {PlanetTreeNode}     node      The node.
	 */
	this.unrequest = function(node) {
		function CompareTreeNode(data, value) {
			return data.node == value;
		}
		renderRequests.remove(node, CompareTreeNode);
		inlineRequests.remove(node, CompareTreeNode);
	};

	/**
	 * Splits quad tree node.
	 * @private
	 *
	 * @param {PlanetTreeNode}     node      The node.
	 */
	var splitQuadTreeNode = function(node) {
		// Parent is no longer an open node, now has at least one child.
		if (node.parent)
			openNodes.delete(node.parent);
		// This node is now open.
		openNodes.add(node);
		// Create children.
		for (var i = 0; i < 4; ++i) {
			var child = new PlanetTreeNode(node.tree);
			child.create();
			node.attachChild(child, i);
		}
	};

	/**
	 * Merges quad tree node.
	 * @private
	 *
	 * @param {PlanetTreeNode}     node      The node.
	 */
	var mergeQuadTreeNode = function(node) {
		// Delete children.
		for (var i = 0; i < 4; ++i) {
			node.detachChild(i);
		}
		// This node is now closed.
		openNodes.delete(node);
		if (node.parent) {
			// Check to see if any siblings are split.
			for (var i = 0; i < 4; ++i) {
				if (node.parent.children[i].isSplit())
					return;
			}
			// If not, the parent is now open.
			openNodes.add(node.parent);
		}
	};

	/**
	 * Handles renderable for a node.
	 * @private
	 *
	 * @param {PlanetTreeNode}     node      The node.
	 */
	var handleRenderable = function(node) {
		// Determine max relative LOD depth between grid and tile
		var maxLODRatio = textureSize / (gridSize - 1);
		var maxLOD = 0;
		while (maxLODRatio > 1) {
			maxLODRatio >>= 1;
			maxLOD++;
		}

		// See if we can find a map tile to derive from.
		var ancestor = node;
		while (ancestor.mapTile === null && ancestor.parent !== null) {
			ancestor = ancestor.parent;
		}

		// See if map tile found is in acceptable LOD range (ie. gridsize <= texturesize).
		if (ancestor.mapTile) {
			var relativeLOD = node.lod - ancestor.lod;
			if (relativeLOD <= maxLOD) {
				// Replace existing renderable.
				node.destroyRenderable();
				// Create renderable relative to the map tile.
				node.createRenderable(ancestor.mapTile);
				node.requestRenderable = false;
			}
		}

		// If no renderable was created, try creating a map tile.
		if (node.requestRenderable && !node.mapTile && !node.requestMapTile)
		{
			// Request a map tile for this node's LOD level.
			node.requestMapTile = true;
			this.request(node, PlanetRequestType.REQUEST_MAPTILE, true);
		}
		return true;
	};

	/**
	 * Refreshes map tile for a node.
	 * @private
	 *
	 * @param {PlanetTreeNode}   node      The node.
	 * @param {PlanetMapTile}    mapTile   The map tile.
	 */
	var refreshMapTile = function(node, mapTile) {
		for (var i = 0; i < 4; ++i) {
			var child = node.children[i];
			if (child && child.renderable && child.renderable.getMapTile() == mapTile) {
				child.requestRenderable = true;
				this.request(child, PlanetRequestType.REQUEST_RENDERABLE, true);

				// Recurse
				refreshMapTile.call(this, child, mapTile);
			}
		}
	};

	/**
	 * Handles map tile for a node.
	 * @private
	 *
	 * @param {PlanetTreeNode}     node      The node.
	 */
	var handleMapTile = function(node) {
		// See if the map tile object for this node is ready yet.
		if (!node.prepareMapTile(map)) {
			// Needs more work.
			this.request(node, PlanetRequestType.REQUEST_MAPTILE, true);
			return false;
		} else {
			// Assemble a map tile object for this node.
			node.createMapTile(map);
			node.requestMapTile = false;

			// Request a new renderable to match.
			node.requestRenderable = true;
			this.request(node, PlanetRequestType.REQUEST_RENDERABLE, true);

			// See if any child renderables use the old maptile.
			if (node.renderable) {
				refreshMapTile.call(this, node, node.renderable.getMapTile());
			}
			return true;
		}
	};

	/**
	 * Handles split for a node.
	 * @private
	 *
	 * @param {PlanetTreeNode}     node      The node.
	 */
	var handleSplit = function(node) {
		if (node.lod < lodLimit) {
			splitQuadTreeNode.call(this, node);
			node.requestSplit = false;
		} else {
			// requestSplit is stuck on, so will not be requested again.
		}
		return true;
	};

	/**
	 * Handles merge for a node.
	 * @private
	 *
	 * @param {PlanetTreeNode}     node      The node.
	 */
	var handleMerge = function(node) {
		mergeQuadTreeNode.call(this, node);
		node.requestMerge = false;
		return true;
	};

	/**
	 * Handlers array for fast processing.
	 */
	var handlers = [
		handleRenderable,
		handleMapTile,
		handleSplit,
		handleMerge];
	/**
	 * Handles requests for a given queue.
	 * @private
	 *
	 * @param {LinkedList}     requestQueue      The queue.
	 */
	var handleRequests = function(requestQueue) {
		// Limit update per frame
		var size = requestQueue.size();
		while (size != 0) {
			var request = requestQueue.popFront();
			handlers[request.type].call(this, request.node);
			size--;
		}
	};

	/**
	 * Prunes tree.
	 * @private
	 */
	var pruneTree = function() {
		// Originally here node heap was used to put nodes in order.
		// But actually we don't need it at all.
		openNodes.forEach(function(node, value2, set){
			if (!node.pageOut &&
				!node.requestMerge &&
				(frameCounter - node.lastOpened > 100)) {
				node.renderable.setFrameOfReference();
				// Make sure node's children are too detailed rather than just invisible.
				if (node.renderable.isFarAway() ||
					(node.renderable.isInLODRange() && node.renderable.isInMIPRange())) {
					node.requestMerge = true;
					this.request(node, PlanetRequestType.REQUEST_MERGE, true);
				} else {
					node.lastOpened = frameCounter;
				}
			}
		});
	};

	create.call(this);
}

export { PlanetCube };