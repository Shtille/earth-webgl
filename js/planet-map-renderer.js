/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { PlanetMapProvider } from './planet-map-provider.js';
import { Mercator } from './mercator.js';
import { TileKey } from './tile-key.js';
import { Bitmap, BufferedBitmapInfo, BitmapBuffer } from './bitmap.js';

/**
 * Defines planet map renderer class.
 */
function PlanetMapRenderer() {
	var uvPoints = new Array(8);
	var pair = new Array(2); // pair value for functions output
	var prepareOutput = {
		optimal_lod: 0,
		num_tiles_to_load: 0
	};
	var bitmapBuffer = new BitmapBuffer();
	var requestedKeys = null;
	var bitmaps = null;

	var srcCanvas = null;
	var srcContext = null;

	const targetWidth = 256;
	const targetHeight = 256;
	const kEpsilon = 0.000001;

	/**
	 * Constructor.
	 */
	this.create = function() {
		requestedKeys = new Set();
		bitmaps = new Map();

		// Create source data
		srcCanvas = document.createElement('canvas');
		srcCanvas.width = PlanetMapProvider.BITMAP_WIDTH;
		srcCanvas.height = PlanetMapProvider.BITMAP_HEIGHT;
		srcContext = srcCanvas.getContext('2d');
	};

	/**
	 * Destructor.
	 */
	this.destroy = function() {
		requestedKeys.clear();
		requestedKeys = null;
		bitmaps.clear();
		bitmaps = null;
	};

	/**
	 * Gets bitmap from map.
	 * @private
	 *
	 * @param {TileKey} key           The tile key.
	 * @param {Boolean} use_counter   Whether use counter.
	 * @return {Bitmap} The bitmap.
	 */
	var getBitmap = function(key, use_counter) {
		var bitmap = bitmaps.get(key.quadKey);
		return bitmap;
	};

	/**
	 * Callback on successful image load.
	 * @private
	 *
	 * @param {Bitmap} bitmap The bitmap.
	 */
	var onImageLoad = function(bitmap) {
		bitmap.ready = true;
		requestedKeys.delete(bitmap.key.quadKey);
		bitmap.image.style.display = 'none';
	};

	/**
	 * Callback on error image load.
	 * @private
	 *
	 * @param {Bitmap} bitmap   The bitmap.
	 * @param {String} message  The message.
	 */
	var onImageError = function(bitmap, message) {
		console.log(message);
		// Try again
		loadImage.call(this, bitmap);
	};

	/**
	 * Requests image load.
	 * @private
	 *
	 * @param {Bitmap} bitmap The bitmap.
	 */
	var loadImage = function(bitmap) {
		var key = bitmap.key;
		var url = PlanetMapProvider.getURL(key.x, key.y, key.lod);
		bitmap.image.onload = onImageLoad.bind(this, bitmap);
		bitmap.image.onerror = onImageError.bind(this, bitmap);
		bitmap.image.crossOrigin = "";
		bitmap.image.src = url;
	};

	/**
	 * Pushes image load request and creates bitmap.
	 * @private
	 *
	 * @param {TileKey} key           The tile key.
	 */
	var pushRequest = function(key) {
		if (!requestedKeys.has(key.quadKey)) {
			requestedKeys.add(key.quadKey);

			var bitmap = new Bitmap(key);
			bitmaps.set(key.quadKey, bitmap);

			loadImage.call(this, bitmap);
		}
	};

	/**
	 * Requests tiles to load and processes loaded ones.
	 * Fills prepareOutput value.
	 * @private
	 *
	 * @param {Number} face      The cube face (0 to 5).
	 * @param {Number} lod       The level of detail.
	 * @param {Number} x         The tile X coordinate.
	 * @param {Number} y         The tile Y coordinate.
	 */
	var prepare = function(face, lod, x, y) {
		var left, right, top, bottom;
		var key, key_low;
		var bitmap, bitmap_low;

		var two_power_lod = 1 << lod;
		var screen_pixel_size_x = (90.0 / two_power_lod) / targetWidth;
		var optimal_lod = Mercator.getOptimalLevelOfDetail(screen_pixel_size_x);

		var tiles_per_side = 1 << optimal_lod;

		// Calculate bounding box via two different methods
		if (lod == 0) // bad case
		{
			left = top = 0;
			right = bottom = tiles_per_side - 1;
		}
		else // lod != 0, normal case
		{
			var inv_scale = 2. / two_power_lod;
			var position_x = -1. + inv_scale * x;
			var position_y = -1. + inv_scale * y;

			var u_min = position_x;
			var v_min = position_y;
			var u_max = position_x + inv_scale;
			var v_max = position_y + inv_scale;

			// Calculate bounding box
			uvPoints[0] = u_min;
			uvPoints[1] = v_min;
			uvPoints[2] = u_max;
			uvPoints[3] = v_min;
			uvPoints[4] = u_max;
			uvPoints[5] = v_max;
			uvPoints[6] = u_min;
			uvPoints[7] = v_max;
			var latitude, longitude;
			var max_latitude, min_longitude, min_latitude, max_longitude;
			var index = 0;
			min_latitude = 100.0;
			min_longitude = 200.0;
			max_latitude = -100.0;
			max_longitude = -200.0;
			for (var i = 0; i < 4; ++i)
			{
				var u = uvPoints[index++];
				var v = uvPoints[index++];
				Mercator.cubePointToLatLon(face, u, v, pair);
				latitude = pair[0];
				longitude = pair[1];
				var is_pole = (latitude > 90.0 - kEpsilon) || (latitude < -90.0 + kEpsilon); // latitude == 90.0 or -90.0
				var is_jump = (longitude > 180.0 - kEpsilon) || (longitude < -180.0 + kEpsilon); // longitude == 180.0 or -180.0
				if (is_jump)
				{
					// Correct sign of longitude to the center of the tile
					var center_latitude, center_longitude;
					Mercator.cubePointToLatLon(face, 0.5 * (u_min + u_max), 0.5 * (v_min + v_max), pair);
					center_latitude = pair[0];
					center_longitude = pair[1];
					longitude = (center_longitude > 0.0) ? 180.0 : -180.0;
				}
				if (latitude < min_latitude)
					min_latitude = latitude;
				if (longitude < min_longitude && !is_pole)
					min_longitude = longitude;
				if (latitude > max_latitude)
					max_latitude = latitude;
				if (longitude > max_longitude && !is_pole)
					max_longitude = longitude;
			}

			// Compute tile keys for bound rect
			Mercator.latLongToTileXY(max_latitude, Mercator.normalizedLongitude(min_longitude),
				optimal_lod, pair);
			left = pair[0];
			top = pair[1];
			Mercator.latLongToTileXY(min_latitude, Mercator.normalizedLongitude(max_longitude),
				optimal_lod, pair);
			right = pair[0];
			bottom = pair[1];
		}

		// Calculate number of tiles (bitmaps) in longitude (x) direction
		var num_x = right - left + 1;
		var has_break = (num_x <= 0);
		if (has_break)
			num_x += tiles_per_side;

		bitmapBuffer.initialize(left, right, top, bottom, optimal_lod, has_break);

		// Transform rect to list of keys
		var num_tiles_to_load = 0;

		for (var y = top; y <= bottom; ++y)
		{
			for (var i = 0; i < num_x; ++i)
			{
				var x = (left + i) % tiles_per_side;
				// Add a key to the list
				key = new TileKey(x, y, optimal_lod);
				bitmap = getBitmap.call(this, key, true);

				if (bitmap == null || !bitmap.ready) // not loaded yet
				{
					++num_tiles_to_load;
					pushRequest.call(this, key);
					bitmapBuffer.setBitmap(x, y, null);
				}
				else
				{
					bitmapBuffer.setBitmap(x, y, bitmap);
				}
			} // for i
		} // for y

		// Fill output
		prepareOutput.optimal_lod = optimal_lod;
		prepareOutput.num_tiles_to_load = num_tiles_to_load;
	};

	/**
	 * Renders to the target surface.
	 * @private
	 *
	 * @param {ImageData} imageData    The image data.
	 * @param {Number} face            The cube face.
	 * @param {Number} u_min           The minimum U coordinate.
	 * @param {Number} v_min           The minimum V coordinate.
	 * @param {Number} u_max           The maximum U coordinate.
	 * @param {Number} v_max           The maximum V coordinate.
	 * @param {Number} level_of_detail The level of detail.
	 */
	var render = function(imageData, face, u_min, v_min, u_max, v_max, level_of_detail) {

		// https://developer.mozilla.org/ru/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
		// https://developer.mozilla.org/ru/docs/Web/API/CanvasRenderingContext2D/createImageData

		const screen_width = targetWidth;
		const screen_height = targetHeight;
		const screen_bpp = 4;
		const kBitmapWidth = PlanetMapProvider.BITMAP_WIDTH;
		const kBitmapHeight = PlanetMapProvider.BITMAP_HEIGHT;

		var map_size = kBitmapWidth << level_of_detail;

		// Create destination data
		var dst = imageData.data;

		// Create source data
		var srcImageData;
		var src;

		// Compute pixel sizes
		var screen_pixel_size_u = (u_max - u_min) / screen_width;
		var screen_pixel_size_v = (v_max - v_min) / screen_height;

		// Nothing to bufferize. Pretty sad.
		var x,y,u,v;
		var latitude, longitude;
		var bitmap_x, bitmap_y;
		var key_x, key_y;
		var info;
		var sample_x, sample_y;
		var lastBitmap = null;
		var dst_index = 0, src_index;
		for (y = 0; y < screen_height; ++y) {
			v = v_min + (y + 0.5) * screen_pixel_size_v;
			for (x = 0; x < screen_width; ++x) {
				u = u_min + (x + 0.5) * screen_pixel_size_u;
				Mercator.cubePointToLatLon(face, u, v, pair);
				latitude = pair[0];
				longitude = Mercator.normalizedLongitude(pair[1]);
				bitmap_x = Mercator.longitudeToPixelX(longitude, map_size);
				bitmap_y = Mercator.latitudeToPixelY(latitude, map_size);
				key_x = Math.floor(bitmap_x / kBitmapWidth);
				key_y = Math.floor(bitmap_y / kBitmapHeight);

				info = bitmapBuffer.getBitmap(key_x, key_y);
				if (info.bitmap == null) {
					// Tile hasn't been loaded yet, but it shouldn't happen
					throw new Error("Empty tile in render routine!");
					dst_index += screen_bpp;
					continue;
				}
				if (lastBitmap != info.bitmap) {
					lastBitmap = info.bitmap;

					srcContext.drawImage(info.bitmap.image, 0, 0);
					srcImageData = srcContext.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
					src = srcImageData.data;
				}

				sample_x = bitmap_x % kBitmapWidth;
				sample_y = bitmap_y % kBitmapHeight;

				src_index = sample_y * kBitmapWidth + sample_x;
				src_index *= screen_bpp;

				// Formula for pixel offset is pixel[(y * width + x) * bpp]
				dst[dst_index + 0] = src[src_index + 0];
				dst[dst_index + 1] = src[src_index + 1];
				dst[dst_index + 2] = src[src_index + 2];
				dst[dst_index + 3] = src[src_index + 3];

				dst_index += screen_bpp;
			} // for x
		} // for y
	};

	/**
	 * Requests image for a node.
	 *
	 * @param {ImageData} imageData   The image data.
	 * @param {Number}    face        The cube face (0 to 5).
	 * @param {Number}    lod         The level of detail.
	 * @param {Number}    x           The tile X coordinate.
	 * @param {Number}    y           The tile Y coordinate.
	 * @return {Boolean} True if image has been filled and false otherwise.
	 */
	this.request = function(imageData, face, lod, x, y) {
		// Request tiles to load and process loaded ones
		prepare.call(this, face, lod, x, y);

		var isDone = (prepareOutput.num_tiles_to_load == 0);
		if (!isDone) // loading, no need to render
			return false;

		// Render finally
		var inv_scale = 2. / (1 << lod);
		var position_x = -1. + inv_scale * x;
		var position_y = -1. + inv_scale * y;
		var u_min = position_x;
		var v_min = position_y;
		var u_max = position_x + inv_scale;
		var v_max = position_y + inv_scale;
		render.call(this, imageData, face, u_min, v_min, u_max, v_max, prepareOutput.optimal_lod);

		return true;
	};

	// Finally
	this.create();
};

export { PlanetMapRenderer };