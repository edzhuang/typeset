import { Liveblocks } from "@liveblocks/node";

let _liveblocks: Liveblocks | null = null;

export function getLiveblocks() {
  if (!_liveblocks) {
    _liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY!,
    });
  }
  return _liveblocks;
}
