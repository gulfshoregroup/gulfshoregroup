export function formatPrice(value: number): string {
    value = Number(value);
	if (value >= 1000000) {
		// Convert to Millions (M)
		return `$${(value / 1000000).toFixed(1)} M`;
	} else if (value >= 1000) {
		// Convert to Thousands (K) with commas
		return `$${value.toLocaleString("en-US")}`;
	} else {
		// Standard currency format
		return `$${value}`;
	}
}
