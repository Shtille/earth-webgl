/**
 * Copyright (c) 2022 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 */

/**
 * Defines tile provider class.
 *
 * @param {Object} options  The options object. Can have following options:
 *      - {String} serverUrl    The server URL.
 */
function TileProvider(options) {
    var serverUrl = options.serverUrl;

    /**
     * Gets tile URL.
     * 
     * @param {Number} face  The cube's face index (0 to 5).
     * @param {Number} lod   The tile's level of detail.
     * @param {Number} x     The tile X coordinate.
     * @param {Number} y     The tile Y coordinate.
     * 
     * @return {String} Returns tile URL.
     */
    this.getTileUrl = function(face, lod, x, y) {
        return serverUrl + "/tile?face=" + String(face) + "&lod=" + String(lod) + "&x=" + String(x) + "&y=" + String(y);
    };
};

export { TileProvider };