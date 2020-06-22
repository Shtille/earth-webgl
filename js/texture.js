/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

import { isPowerOfTwo } from './extend-math.js';

/**
 * Defines texture class.
 *
 * @param {WebGLRenderingContext} gl  Rendering context.
 */
function Texture(gl) {
	var gl = gl;
	var image = null;

	var internalFormat = gl.RGBA;
	var srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;

	var setGrayscale = function() {
		internalFormat = gl.LUMINANCE;
		srcFormat = gl.LUMINANCE;
	};

	this.id = null; // texture ID

	/**
	 * Destroys texture.
	 */
	this.destroy = function() {
		if (this.id)
			gl.deleteTexture(this.id);
		gl = null;
		if (image) {
			// Cancel loading
			image.src = "";
			image.onload = null;
			image.onerror = null;
		}
	};

	/**
	 * Binds texture for chosen unit.
	 *
	 * @param {Number} unit The texture unit.
	 */
	this.bind = function(unit) {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, this.id);
	};

	/**
	 * Loads texture from file.
	 *
	 * @param {String}   url              The url.
	 * @param {Function} successCallback  The success callback. Optional.
	 * @param {Function} errorCallback    The error callback. Optional.
	 * @param {Object}   context          The callbacks context.
	 * @param {Boolean}  grayscale        Flag if image grayscale. Optional.
	 */
	this.loadFromFile = function(url, successCallback, errorCallback, context, grayscale) {
		this.id = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.id);

		if (grayscale)
			setGrayscale();

		// Because images have to be download over the internet
		// they might take a moment until they are ready.
		// Until then put a single pixel in the texture so we can
		// use it immediately. When the image has finished downloading
		// we'll update the texture with the contents of the image.
		const width = 1;
		const height = 1;
		const pixel = new Uint8Array([255, 255, 255, 255]);
		gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat,
			width, height, 0, srcFormat, srcType,
			pixel);

		image = new Image();
		image.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, this.id);
			gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat,
				srcFormat, srcType, image);

			// WebGL1 has different requirements for power of 2 images
			// vs non power of 2 images so check if the image is a
			// power of 2 in both dimensions.
			if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
				// Yes, it's a power of 2. Generate mips.
				gl.generateMipmap(gl.TEXTURE_2D);
			} else {
				// No, it's not a power of 2. Turn off mips and set
				// wrapping to clamp to edge
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
			if (successCallback)
				successCallback.call(context);
		}.bind(this);
		image.onerror = function(message) {
			var errorMessage = 'Failed to load the texture: ' + message + '<br>';
			if (errorCallback)
				errorCallback.call(context, errorMessage);
		};
		image.src = url;
	};
}

export { Texture };