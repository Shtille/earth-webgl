/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module extends standart Math.
 */

'use strict';

/**
 * Checks if value is power of two.
 *
 * @param {Number} value  The value.
 * @return {Boolean} True if success and false otherwise.
 */
Math.isPowerOfTwo = function(value) {
	return (value & (value - 1)) == 0;
}