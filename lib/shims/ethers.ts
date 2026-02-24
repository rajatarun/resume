const MASK_64 = (1n << 64n) - 1n;

const ROTATION_OFFSETS = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14
] as const;

const ROUND_CONSTANTS = [
  0x0000000000000001n,
  0x0000000000008082n,
  0x800000000000808an,
  0x8000000080008000n,
  0x000000000000808bn,
  0x0000000080000001n,
  0x8000000080008081n,
  0x8000000000008009n,
  0x000000000000008an,
  0x0000000000000088n,
  0x0000000080008009n,
  0x000000008000000an,
  0x000000008000808bn,
  0x800000000000008bn,
  0x8000000000008089n,
  0x8000000000008003n,
  0x8000000000008002n,
  0x8000000000000080n,
  0x000000000000800an,
  0x800000008000000an,
  0x8000000080008081n,
  0x8000000000008080n,
  0x0000000080000001n,
  0x8000000080008008n
] as const;

function rotl64(value: bigint, shift: number): bigint {
  if (shift === 0) return value;
  const s = BigInt(shift);
  return ((value << s) | (value >> (64n - s))) & MASK_64;
}

function keccakF1600(state: bigint[]): void {
  for (let round = 0; round < 24; round += 1) {
    const c = new Array<bigint>(5);

    for (let x = 0; x < 5; x += 1) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }

    const d = new Array<bigint>(5);
    for (let x = 0; x < 5; x += 1) {
      d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        state[x + 5 * y] ^= d[x];
      }
    }

    const b = new Array<bigint>(25);
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const index = x + 5 * y;
        const newX = y;
        const newY = (2 * x + 3 * y) % 5;
        b[newX + 5 * newY] = rotl64(state[index], ROTATION_OFFSETS[index]);
      }
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        state[x + 5 * y] = b[x + 5 * y] ^ ((~b[((x + 1) % 5) + 5 * y]) & b[((x + 2) % 5) + 5 * y]);
      }
    }

    state[0] ^= ROUND_CONSTANTS[round];
  }
}

function keccak256Hex(input: string): string {
  const data = new TextEncoder().encode(input);
  const state = new Array<bigint>(25).fill(0n);
  const rateBytes = 136;

  let offset = 0;
  while (offset + rateBytes <= data.length) {
    for (let i = 0; i < rateBytes; i += 1) {
      const lane = Math.floor(i / 8);
      const shift = BigInt((i % 8) * 8);
      state[lane] ^= BigInt(data[offset + i]) << shift;
    }
    keccakF1600(state);
    offset += rateBytes;
  }

  const block = new Uint8Array(rateBytes);
  block.set(data.slice(offset));
  block[data.length - offset] = 0x01;
  block[rateBytes - 1] |= 0x80;

  for (let i = 0; i < rateBytes; i += 1) {
    const lane = Math.floor(i / 8);
    const shift = BigInt((i % 8) * 8);
    state[lane] ^= BigInt(block[i]) << shift;
  }

  keccakF1600(state);

  const output = new Uint8Array(32);
  let outOffset = 0;
  for (let i = 0; i < 4; i += 1) {
    let lane = state[i];
    for (let j = 0; j < 8; j += 1) {
      output[outOffset] = Number(lane & 0xffn);
      lane >>= 8n;
      outOffset += 1;
    }
  }

  return Array.from(output, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getAddress(address: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error("invalid address");
  }

  const hex = address.slice(2).toLowerCase();
  const hash = keccak256Hex(hex);

  let checksum = "0x";
  for (let i = 0; i < hex.length; i += 1) {
    checksum += parseInt(hash[i], 16) >= 8 ? hex[i].toUpperCase() : hex[i];
  }

  return checksum as `0x${string}`;
}
