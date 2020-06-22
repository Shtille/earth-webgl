/**
 * Copyright (c) 2020 Vladimir Sviridov.
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 * 
 * Module describes Earth constants.
 */

export const kEarthRadius = 6371000; // 6371 km
const kEarthAtmosphereHeight = 100000; // 100 km
const kEarthCloudsHeight = 12000; // 12 km
export const kEarthAtmosphereRadius = kEarthRadius + kEarthAtmosphereHeight;
export const kEarthCloudsRadius = kEarthRadius + kEarthCloudsHeight;