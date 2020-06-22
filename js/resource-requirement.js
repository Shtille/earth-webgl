/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module describes resource managing classes.
 */

/**
 * Defines resource requirement class.
 *
 * @param {Array}    array       Requirements array. Optional.
 * @param {Function} callback    The pass callback. Optional.
 * @param {Object}   context     The callbacks context.
 */
function ResourceRequirement(array, callback, context) {
	var count = (array) ? array.length : 0;
	var callback = callback;
	var context = context;
	
	/**
	 * Increases requirements counter.
	 */
	this.add = function() {
		count++;
	};
	/**
	 * Decreases requirements counter and calls callback if it's equal to zero.
	 */
	this.remove = function() {
		count--;
		if (count == 0 && callback)
			callback.call(context);
	};
	/**
	 * Checks if all requirements passed.
	 *
	 * @return {Boolean} True if passed and false otherwise.
	 */
	this.passed = function() {
		return count == 0;
	};
}

export { ResourceRequirement };