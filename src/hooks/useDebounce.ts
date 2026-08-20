// hooks/useDebounce.ts
export default function debounce<T extends (...args: any[]) => void>(
	fn: T,
	ms: number
) {
	let t: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...args), ms);
	};
}
