// Map fix 1c — update the URL without a Next.js navigation (no ?_rsc server round trip per pan).
const url = `?view=map&lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&zoom=${zoom}`;
window.history.replaceState(null, '', url);
