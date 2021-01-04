/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
let params = new URLSearchParams( window.location.search.slice( 1 ) );

// TODO could support non-square POT textures also
let elevationPoolSize = 8 * 8;
let imageryPoolSize = 16 * 16;
if ( params.has( 'elevationPoolSize' ) ) {
  elevationPoolSize = Number.parseInt( params.get( 'elevationPoolSize' ) );
}

if ( params.has( 'imageryPoolSize' ) ) {
  imageryPoolSize = Number.parseInt( params.get( 'imageryPoolSize' ) );
}

//export const ELEVATION_URL = 'https://www.nasadem.xyz/api/v1/dem/{z}/{x}/{y}.png?key={apiKey}'
//export const ELEVATION_TILE_SIZE = 512;
export const ELEVATION_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/v2/terrarium/{z}/{x}/{y}.png'
export const ELEVATION_TILE_SIZE = 256;
export const ELEVATION_POOL_SIZE = elevationPoolSize;
export const IMAGERY_POOL_SIZE = imageryPoolSize;
export const IMAGERY_TILE_SIZE = 256;
export const INTERPOLATE_FLOAT = params.has( 'interpolateFloat' );
