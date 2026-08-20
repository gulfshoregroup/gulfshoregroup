import React from "react";

const Pagination = ({
	total,
	page,
	limit,
	onPageChange,
}: {
	total: number;
	page: number;
	limit: number;
	onPageChange: any;
}) => {
	const totalPages = Math.ceil(total / limit);

	// Create a dynamic range of pages to display around the current page
	const pages = Array.from(
		{ length: totalPages },
		(_, i) => i + 1
	).slice(Math.max(0, page - 3), Math.min(totalPages, page + 1));

	return (
		<div className="flex flex-nowrap w-full gap-1 items-center justify-center">
			<button
				className="bg-blue-600 hover:bg-blue-700 text-white text-sm w-10 h-10 p-2 rounded-full"
				onClick={() => onPageChange(page - 1)}
				disabled={page === 1}>
				{"<"}
			</button>

			{/* Display the first page if it's not included in the dynamic range */}
			{pages[0] > 1 && (
				<>
					<button
						className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full h-9 w-9"
						onClick={() => onPageChange(1)}>
						1
					</button>
					{pages[0] > 2 && <span>...</span>}
				</>
			)}

			{/* Display the range of pages */}
			<div className="flex flex-nowrap gap-1">
				{pages.map((p) => (
					<button
						className={
							p === page
								? "bg-blue-950 hover:bg-blue-700 text-white text-sm font-bold w-9 h-9 rounded-full"
								: "bg-blue-600 hover:bg-blue-700 text-white text-sm w-9 h-9 rounded-full"
						}
						key={p}
						onClick={() => onPageChange(p)}
						disabled={p === page}>
						{p}
					</button>
				))}
			</div>

			{/* Display the last page if it's not included in the dynamic range */}
			{pages[pages.length - 1] < totalPages && (
				<>
					{pages[pages.length - 1] < totalPages - 1 && (
						<span>...</span>
					)}
				</>
			)}

			<button
				className="bg-blue-600 hover:bg-blue-700 text-white text-sm w-10 h-10 p-2 rounded-full"
				onClick={() => onPageChange(page + 1)}
				disabled={page === totalPages}>
				{">"}
			</button>
		</div>
	);
};

export default Pagination;
