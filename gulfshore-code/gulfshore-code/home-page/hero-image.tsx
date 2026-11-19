// Home page fix #6 — correct `sizes` on the hero image (keep `priority`).
// Hero displays ~440px wide on desktop; "100vw" made big screens download 1920–3840px.
<Image
  src={hero}
  alt="..."
  fill
  priority
  sizes="(max-width: 768px) 100vw, 45vw"
/>
