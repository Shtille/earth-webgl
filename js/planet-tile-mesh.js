/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module describes resource managing classes.
 */

import { GeneratedMesh } from './generated-mesh.js';

/**
 * Defines planet tile mesh class.
 * Provides only position attributes.
 *
 * @param {WebGLRenderingContext} gl              Rendering context.
 * @param {VertexFormat}          vertexFormat    Vertex format.
 * @param {Number}				  gridSize        Grid size (vertices per tile side).
 */
function PlanetTileMesh(gl, vertexFormat, gridSize) {
	// Call base class constructor
	GeneratedMesh.call(this, gl, vertexFormat);

	const gridSize = gridSize;

	/**
	 * Creates mesh.
	 */
	this.create = function() {
		this._mode = gl.TRIANGLES;

		const gridSizeMinusOne = gridSize - 1;

		this._vertices = new Array(gridSize * gridSize + gridSize * 4);
		this._indices = new Array(((gridSize - 1) * (gridSize - 1) + 4 * (gridSize - 1)) * 6);

		var index = 0;
		// Output vertex data for regular grid.
		for (var j = 0; j < gridSize; ++j)
		{
			for (var i = 0; i < gridSize; ++i)
			{
				var x = i / gridSizeMinusOne;
				var y = j / gridSizeMinusOne;
				var position = [x, y, 0];

				this._vertices[index] = {
					position: position
				};
				++index;
			}
		}
		// Output vertex data for x skirts.
		for (var j = 0; j < gridSize; j += gridSizeMinusOne)
		{
			for (var i = 0; i < gridSize; ++i)
			{
				var x = i / gridSizeMinusOne;
				var y = j / gridSizeMinusOne;
				var position = [x, y, -1];

				this._vertices[index] = {
					position: position
				};
				++index;
			}
		}
		// Output vertex data for y skirts.
		for (var i = 0; i < gridSize; i += gridSizeMinusOne)
		{
			for (var j = 0; j < gridSize; ++j)
			{
				var x = i / gridSizeMinusOne;
				var y = j / gridSizeMinusOne;
				var position = [x, y, -1];

				this._vertices[index] = {
					position: position
				};
				++index;
			}
		}

		index = 0;
		var ind = 0;
		var skirt_index = 0;
		// Output indices for regular surface.
		for (var j = 0; j < gridSizeMinusOne; ++j)
		{
			for (var i = 0; i < gridSizeMinusOne; ++i)
			{
				this._indices[ind++] = index;
				this._indices[ind++] = index + gridSize;
				this._indices[ind++] = index + 1;

				this._indices[ind++] = index + gridSize;
				this._indices[ind++] = index + gridSize + 1;
				this._indices[ind++] = index + 1;

				++index;
			}
			++index;
		}
		// Output indices for x skirts.
		index = 0;
		skirt_index = gridSize * gridSize;
		for (var i = 0; i < gridSizeMinusOne; ++i)
		{
			this._indices[ind++] = index;
			this._indices[ind++] = index + 1;
			this._indices[ind++] = skirt_index;

			this._indices[ind++] = skirt_index;
			this._indices[ind++] = index + 1;
			this._indices[ind++] = skirt_index + 1;

			index++;
			skirt_index++;
		}
		index = gridSize * (gridSize - 1);
		skirt_index = gridSize * (gridSize + 1);
		for (var i = 0; i < gridSizeMinusOne; ++i)
		{
			this._indices[ind++] = index;
			this._indices[ind++] = skirt_index;
			this._indices[ind++] = index + 1;

			this._indices[ind++] = skirt_index;
			this._indices[ind++] = skirt_index + 1;
			this._indices[ind++] = index + 1;

			index++;
			skirt_index++;
		}
		// Output indices for y skirts.
		index = 0;
		skirt_index = gridSize * (gridSize + 2);
		for (var i = 0; i < gridSizeMinusOne; ++i)
		{
			this._indices[ind++] = index;
			this._indices[ind++] = skirt_index;
			this._indices[ind++] = index + gridSize;

			this._indices[ind++] = skirt_index;
			this._indices[ind++] = skirt_index + 1;
			this._indices[ind++] = index + gridSize;

			index += gridSize;
			skirt_index++;
		}
		index = (gridSize - 1);
		skirt_index = gridSize * (gridSize + 3);
		for (var i = 0; i < gridSizeMinusOne; ++i)
		{
			this._indices[ind++] = index;
			this._indices[ind++] = index + gridSize;
			this._indices[ind++] = skirt_index;

			this._indices[ind++] = skirt_index;
			this._indices[ind++] = index + gridSize;
			this._indices[ind++] = skirt_index + 1;

			index += gridSize;
			skirt_index++;
		}
	};
}

export { PlanetTileMesh };