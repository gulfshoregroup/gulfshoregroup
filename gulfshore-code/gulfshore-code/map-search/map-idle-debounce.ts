// Map fix 1f — fetch pins only when the map is idle, debounce 250ms, cancel stale requests.
let ctrl: AbortController | undefined;
const onIdle = debounce(async () => {
  ctrl?.abort();
  ctrl = new AbortController();
  const b = map.getBounds()!;
  const params = new URLSearchParams({
    n: b.getNorthEast().lat().toFixed(3), s: b.getSouthWest().lat().toFixed(3),
    e: b.getNorthEast().lng().toFixed(3), w: b.getSouthWest().lng().toFixed(3),
    z: String(map.getZoom()), ...filters,
  });
  const res = await fetch(`/api/v2/map-pins?${params}`, { signal: ctrl.signal });
  renderPins(await res.json());
}, 250);
map.addListener('idle', onIdle);
