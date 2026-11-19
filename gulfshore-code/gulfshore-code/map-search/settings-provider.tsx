// Map fix 1a (also listing page item 9) — fetch general-settings ONCE, not 168 times.
// app/layout.tsx
const settings = await getGeneralSettings();   // server-side, cached
return <SettingsProvider value={settings}>{children}</SettingsProvider>;

// in ShareButton / ListingCard: const settings = useSettings();  // no fetch
