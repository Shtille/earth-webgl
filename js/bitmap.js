/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module describes bitmap managing classes.
 */

import { TileKey } from './tile-key.js';

/**
 * Defines bitmap class.
 *
 * @param {TileKey} key The tile key.
 */
function Bitmap(key) {
	this.key = key;
	this.image = new Image();
	this.ready = false;
};

/**
 * Defines buffered bitmap info class.
 */
function BufferedBitmapInfo() {
	this.bitmap = null;
	this.level_ascending = 0; // level - low_level, should be 0 or positive

	/**
	 * Clears data.
	 */
	this.clear = function() {
		this.bitmap = null;
		this.level_ascending = 0;
	};
};

/**
 * Defines bitmap buffer class.
 */
function BitmapBuffer() {
	this.data = null; // Array of BufferedBitmapInfo
	this.key_min_x = 0;
	this.key_min_y = 0;
	this.key_max_x = 0;
	this.key_max_y = 0;
	this.width = 0;
	this.level_of_detail = 0;
	this.is_break = false;
	this.has_any_low_detailed_bitmap = false;

	/**
	 * Defines bitmap buffer class.
	 */
	this.initialize = function(key_min_x, key_max_x, key_min_y, key_max_y, level_of_detail, is_break) {
		var width, height, bitmap_height;

		width = key_max_x - key_min_x + 1;
		if (width <= 0)
			width += (1 << level_of_detail);
		height = key_max_y - key_min_y + 1;

		if (this.data) // there was some data
		{
			// Check whether we need to realloc data
			bitmap_height = this.key_max_y - this.key_min_y + 1;
			if (width > this.width || height > bitmap_height)
			{
				this.data = new Array(width * height);
				for (var i = 0; i < this.data.length; i++) {
					this.data[i] = new BufferedBitmapInfo();
				}
			}
			else
			{
				// Otherwise we will just update the data
				for (var i = 0, ii = this.width * bitmap_height; i < ii; i++) {
					this.data[i].clear();
				}
			}
		}
		else
		{
			this.data = new Array(width * height);
			for (var i = 0; i < this.data.length; i++) {
				this.data[i] = new BufferedBitmapInfo();
			}
		}

		// Set new parameters
		this.key_min_x = key_min_x;
		this.width = width;
		this.key_min_y = key_min_y;
		this.key_max_x = key_max_x;
		this.key_max_y = key_max_y;
		this.level_of_detail = level_of_detail;
		this.is_break = is_break;
		this.has_any_low_detailed_bitmap = false;
	};

	/**
	 * Sets bitmap for buffer.
	 */
	this.setBitmap = function(key_x, key_y, bitmap) {
		var x, y, index;
		var data;

		x = key_x - this.key_min_x;
		if (x < 0) // within break
		{
		    x += (1 << this.level_of_detail);
		}
		y = key_y - this.key_min_y;
		index = y * this.width + x;
		data = this.data[index];
		data.bitmap = bitmap;
		data.level_ascending = 0;
	};

	/**
	 * Gets bitmap from buffer.
	 */
	this.getBitmap = function(key_x, key_y) {
		var x, y, index;

		var in_x_range = (this.is_break)
			? (key_x >= this.key_min_x || key_x <= this.key_max_x)
			: (key_x >= this.key_min_x && key_x <= this.key_max_x);
		if (in_x_range && key_y >= this.key_min_y && key_y <= this.key_max_y)
		{
			x = key_x - this.key_min_x;
			if (x < 0) // within break
				x += (1 << this.level_of_detail);
			y = key_y - this.key_min_y;
			index = y * this.width + x;
			return this.data[index];
		}
		else
			return null;
	};
};

export { Bitmap, BufferedBitmapInfo, BitmapBuffer };