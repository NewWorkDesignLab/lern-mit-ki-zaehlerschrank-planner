// ---------------------------------------------------------------------------
// Projekt <-> Link. Kompakt serialisiert, komprimiert (deflate-raw) und als
// base64url im URL-Hash (#p=…) abgelegt – nichts verlässt den Browser.
// Präfix 'z' = komprimiert, 'j' = unkomprimiert (Fallback ohne CompressionStream).
// ---------------------------------------------------------------------------

import { fromCompact, toCompact } from '../domain/serialize';
import type { Project } from '../domain/types';

export const HASH_PREFIX = '#p=';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeProject(project: Project): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(toCompact(project)));
  if (typeof CompressionStream === 'undefined') return 'j' + toBase64Url(json);
  return 'z' + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

export async function decodeProject(token: string): Promise<Project> {
  const kind = token.charAt(0);
  let bytes = fromBase64Url(token.slice(1));
  if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (kind !== 'j') throw new Error('Unbekanntes Link-Format.');
  return fromCompact(JSON.parse(new TextDecoder().decode(bytes)));
}

export async function projectLink(project: Project): Promise<string> {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${HASH_PREFIX}${await encodeProject(project)}`;
}
