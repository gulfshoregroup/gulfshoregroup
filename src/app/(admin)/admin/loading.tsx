export default function AdminLoading() {
	return (
		<div className="space-y-6 p-4 animate-pulse">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<div className="h-8 w-48 bg-muted rounded-lg" />
					<div className="h-4 w-72 bg-muted/70 rounded-md" />
				</div>
				<div className="h-10 w-28 bg-muted rounded-lg" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-24 bg-muted/60 rounded-xl border border-border/50" />
				))}
			</div>
			<div className="h-96 bg-muted/40 rounded-xl border border-border/50" />
		</div>
	);
}

