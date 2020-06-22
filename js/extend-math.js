/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module extends standart Math.
 */

/**
 * Checks if value is power of two.
 *
 * @param {Number} value  The value.
 * @return {Boolean} True if success and false otherwise.
 */
export function isPowerOfTwo(value) {
	return (value & (value - 1)) == 0;
}