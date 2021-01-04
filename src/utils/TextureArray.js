/**
 * Copyright 2020 (c) Felix Palmer
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { ELEVATION_TILE_SIZE } from '/constants';
import renderer from '/renderer';

const canvas = document.createElement( 'canvas' );
const width = ELEVATION_TILE_SIZE;
const height = ELEVATION_TILE_SIZE;
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext( '2d' );
const N = width * height;


const avg = (ns) => {
  let s = 0
  if (!ns) return s
  ns.forEach((v) => {
    if (!isNaN(v)) s = s + v
  })
  return s / ns.length
}

const normal = (c, px, py, Sx, Sy, Sz) => {
  //v = px - c
  let Vx = px.x,
    Vy = px.y,
    Vz = px.h - c
  //w = py - c
  let Wx = py.x,
    Wy = py.y,
    Wz = py.h - c
  let Nx = (Vy * Wz) - (Vz * Wy),
    Ny = (Vz * Wx) - (Vx * Wz),
    Nz = (Vx * Wy) - (Vy * Wx)
  let l = Math.sqrt(Nx * Nx + Ny * Ny + Nz * Nz)
  let dot = Nx * Sx + Ny * Sy + Nz * Sz
  return dot / l
}

let normals = new Float32Array(N);
const insertIntoTextureArray = (textureArray, index, image, textureNArray) => {
  const w = textureArray.image.width / textureArray.__blocks;
  const h = textureArray.image.height / textureArray.__blocks;
  const x = w * ( Math.floor( index ) % textureArray.__blocks );
  const y = h * Math.floor( Math.floor( index ) / textureArray.__blocks );

  if ( textureArray.useFloat ) {
    ctx.drawImage( image, 0, 0 );
    let imgData = ctx.getImageData( 0, 0, width, height ).data;

    let data = new Float32Array( N );
    let cdata = new Float32Array(N);
    const baseVal = -32768;
    //const interval = 1 / 256;
    let dataView = new DataView( imgData.buffer );
    for ( let i = 0; i < N; ++i ) {
      //let h = interval * (
      //  256 * 256 * imgData[ 4 * i ] +
      //  256 * imgData[ 4 * i + 1 ] +
      //  imgData[ 4 * i + 2 ]
      //) + baseVal;
      // Read as big-endian data (skipping B channel), equivalent to above
      let h = 256 * imgData[4 * i] + imgData[4 * i + 1] + baseVal
      //let H = dataView.getUint16( 4 * i, false ) + baseVal;
      // Handle NODATA value, clamping to 0
      let H = h
      data[i] = (H === baseVal ? 0 : H * 4);
      cdata[i] = data[i];
    }
    renderer.copyTextureToTexture({ x, y }, {
      image: { data, width, height },
      isDataTexture: true
    }, textureArray);
    try {
      //
      const texelHeight = 10
      const texelWidth = 10
      const get = (data, i, xi, yi) => {
        return { x: xi * texelWidth, y: yi * texelHeight, h: data[i + xi + yi * 256] }
    }

      let Sx = -0.707, Sy = 0, Sz = 0.707

      for (let i = 0; i < N; i++) {
        let xi = i % 256
        let yi = i / 256
        let pxv = xi > 0, nxv = xi < 256, pyv = yi > 0, nyv = yi < 256
        let ns = []
        let c = cdata[i]
        let px, nx, py, ny
        if (pxv) px = get(cdata, i, -1, 0)
        if (nxv) nx = get(cdata, i, 1, 0)
        if (pyv) py = get(cdata, i, 0, - 1)
        if (nyv) ny = get(cdata, i, 0, + 1)
        if (pxv && pyv) {
          ns.push(normal(c, px, py, Sx, Sy, Sz))
        }
        if (pyv && nxv) {
          ns.push(normal(c, py, nx, Sx, Sy, Sz))
        }
        if (nxv && nyv) {
          ns.push(normal(c, nx, ny, Sx, Sy, Sz))
        }
        if (nyv && pxv) {
          ns.push(normal(c, ny, px, Sx, Sy, Sz))
        }
        //data[i] = 1.0
        data[i] = avg(ns)
      }
    } catch (e) {
      console.log("nup", e)
    }
    // Do we need float? Perhaps just converting to data is
    // enough?

    if (textureNArray) {
      console.log("set TextureNArray", textureNArray, normals, data)
    renderer.copyTextureToTexture( { x, y }, {
      image: { data, width, height },
      isDataTexture: true
      }, textureNArray);
    }
  } else {
    renderer.copyTextureToTexture( { x, y }, { image },
      textureArray );
  }
};

export { insertIntoTextureArray };
