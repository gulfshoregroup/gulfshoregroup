"use client";
import React, { useEffect, useRef } from "react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import {
	fetchProperties,
	setFilters,
} from "@/state/slices/searchSlice";
import { usePathname, useSearchParams } from "next/navigation";
import {
	buildQueryFromFilters,
	parseFiltersFromSearchParams,
} from "@/lib/search-filters";

export default function PaginationComponent() {
	const { totalPages, filters } = useSelector(
		(state: RootState) => state.search
	);
	const currentPage =
		Number(filters.page) === 0 ? 1 : Number(filters.page) || 1;
	const dispatch = useDispatch<AppDispatch>();

	const handlePrevPage = () => {
		const prevPage = currentPage - 1;
		dispatch(
			setFilters({
				...filters,
				page: prevPage.toString(),
			})
		);

		dispatch(fetchProperties());
	};
	const handleNextPage = () => {
		const nextPage = currentPage + 1;
		dispatch(
			setFilters({
				...filters,
				page: nextPage.toString(),
			})
		);

		dispatch(fetchProperties());
	};

	if (!totalPages || totalPages === 0) {
		return <></>;
	}

	return (
		<div className="py-10 mt-10	">
			<Pagination>
				<PaginationContent>
					{currentPage > 1 && (
						<PaginationItem>
							<PaginationPrevious
								className="bg-white text-black border"
								onClick={() => handlePrevPage()}
							/>
						</PaginationItem>
					)}
					<PaginationItem>
						<span className="px-2 text-gray-700 font-semibold">
							{"Page " + currentPage + " of " + totalPages + " "}
						</span>
					</PaginationItem>
					{currentPage < (totalPages || 0) && (
						<PaginationItem>
							<PaginationNext
								className="bg-white text-black border"
								onClick={() => handleNextPage()}
							/>
						</PaginationItem>
					)}
				</PaginationContent>
			</Pagination>
		</div>
	);
}

export function PaginationComponent2({
	currentPage,
	totalPages,
}: {
	currentPage: number;
	totalPages: number;
}) {
	const path = usePathname();
	const searchParams = useSearchParams();
	const currentFilters = parseFiltersFromSearchParams(searchParams);

	const prevParams = buildQueryFromFilters(
		{
			...currentFilters,
			page: String(Math.max(1, currentPage - 1)),
		},
		searchParams
	);
	const nextParams = buildQueryFromFilters(
		{
			...currentFilters,
			page: String(currentPage + 1),
		},
		searchParams
	);
	const prevurl = `${path}?${prevParams.toString()}`;
	const nexturl = `${path}?${nextParams.toString()}`;

	return (
		<div className="py-10 mt-10	">
			<Pagination>
				<PaginationContent>
					{currentPage > 1 && (
						<PaginationItem>
							<PaginationPrevious
								className="bg-white text-black border"
								href={prevurl}
							/>
						</PaginationItem>
					)}
					<PaginationItem>
						<span className="px-2 text-gray-700 font-semibold">
							{"Page " + currentPage + " of " + totalPages + " "}
						</span>
					</PaginationItem>
					{currentPage < totalPages && (
						<PaginationItem>
							<PaginationNext
								className="bg-white text-black border"
								href={nexturl}
							/>
						</PaginationItem>
					)}
				</PaginationContent>
			</Pagination>
		</div>
	);
}
