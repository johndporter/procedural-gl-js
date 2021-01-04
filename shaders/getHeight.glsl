/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
// TODO set these from JS
#define VIRTUAL_TEXTURE_ARRAY_BLOCKS 4.0
#define VIRTUAL_TEXTURE_ARRAY_SIZE 512.0


uniform lowp sampler2D indirectionTexture;
uniform vec2 uGlobalOffset;
uniform float uSceneScale;

#include readTexVirtual.glsl


vec4 readTexHeight(in sampler2D tex, in vec2 tile) {
  const float indirectionSize = 2048.0;
  vec2 indirectionUv = tile/indirectionSize;

  vec4 indirection = texture2D( indirectionTexture, indirectionUv );
  float index = indirection.r;
  float tileSize = indirection.g;
  vec2 tileOrigin = indirection.ba;

  vec2 uv = indirectionUv * tileSize + tileOrigin;

  vec2 offset = vec2(
    mod( float( index ), VIRTUAL_TEXTURE_ARRAY_BLOCKS ),
    floor( float( index ) / VIRTUAL_TEXTURE_ARRAY_BLOCKS )
  );
  vec2 limits = vec2( 0, VIRTUAL_TEXTURE_ARRAY_SIZE);
  vec2 arrayUv = ( clamp( uv, limits.x, limits.y ) + offset ) / VIRTUAL_TEXTURE_ARRAY_BLOCKS;
  vec4 res = texture2D( tex, arrayUv );
  return res;
}

vec4 readInterpHeight(in sampler2D tex, in vec2 tile ){
  const float tileSize = VIRTUAL_TEXTURE_ARRAY_SIZE;
  // x+ve=>move terrain west w.r.t map
  // y+ve=> move terrain north w.r.t map
  vec2 ztexel = tile*tileSize+vec2(-0.5,-0.5);
  vec2 ztexel00 = floor(ztexel);
  vec2 off = vec2(1,0);
  vec2 ztexel10 = ztexel00+off;
  vec2 ztexel01 = ztexel00+off.yx;
  vec2 ztexel11 = ztexel00+off.xx;

  vec2 f = ztexel-ztexel00;
  vec4 h00 = readTexHeight(tex, ztexel00/tileSize);
  vec4 h01 = readTexHeight(tex, ztexel01/tileSize);
  vec4 h10 = readTexHeight(tex, ztexel10/tileSize);
  vec4 h11 = readTexHeight(tex, ztexel11/tileSize);
  vec4 tA = mix( h00, h10, f.x );
  vec4 tB = mix( h01, h11, f.x );
  vec4 res = mix( tA, tB, f.y );

  return res;
}



// Function to scale height such that one unit in the
// horizontal plane is equal to one vertical unit
// Basically comes down to the Mercator projection
// Math.pow(2, 15) / 40075016.686
const float earthScale = 0.0008176665341588574;
float heightScale ( in float y ) {
  const float indirectionSize = 2048.0;
  // PI - 2 * PI * y / pow( 2, 10 ) [ z is fixed to 10 ]
  float n = 3.141592653589793 - 2.0*3.141592653589793*y/indirectionSize;
  //float n = 3.141592653589793 - 0.006135923151542565 * y;
  // cosh( n ) / ( earthScale * uSceneScale)
  float cosh_n = dot( vec2( 0.5 ), exp( vec2( n, -n ) ) );
  return cosh_n / ( earthScale * uSceneScale );
}

// TODO should this be highp? Seems OK on iOS
// From: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
//     If you have a float texture, iOS requires that you use highp sampler2D foo;
//     or it will very painfully give you lowp texture samples!
//     (+/-2.0 max is probably not good enough for you)
// +/-2 seems OK, but should revisit if artifacts present
uniform lowp sampler2D elevationArray;
vec4 getHeightN( in vec2 p ) {

  // Get tile coord (at z = 10), currently we are at z = 15
  //const float indirectionSize = 1024.0;
  //const float zoomScale = 32.0; // pow( 2, 15 - 10 )
  const float zoomScale = 16.0; // pow( 2, 15 - 11 )
  const float indirectionSize = 2048.0;

  // this looks like it converts from x,y coordinates to absolute metres
  vec2 tile = p.xy - uGlobalOffset;
  // scale to zoomscale tile
  // 1 uSceneScale converts tiles to metres at 15 zoom
  // 2 convert from 15 zoom tile to TEXTURE_ZOOM tile
  // (note: base texture zoom=>indirectionSize)
  tile /= ( uSceneScale * zoomScale );
  // and invert y as uv must be indexed the other way round ?
  tile *= vec2( 1.0, -1.0 );
  vec4 res = readInterpHeight(elevationArray,tile);
  res.a *= heightScale( tile.y );
  return res;
}


float getHeight(in vec2 p ){
  return getHeightN(p).a;
}
