import { SortItems } from "@/lib/constants";
import { SortAsc } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { fetchProperties, setSort } from "@/state/slices/searchSlice";
import { Button } from "../ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	buildQueryFromFilters,
	parseFiltersFromSearchParams,
} from "@/lib/search-filters";

export const SortComponent = ({ classname }: { classname?: string }) => {
	const { filters } = useSelector((state: RootState) => state.search);
	const dispatch = useDispatch<AppDispatch>();
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const onChange = (newValue: string) => {
		const sortItem = SortItems.find(
			(item) => item.id.toString() === newValue
		);
		if (sortItem) {
			const currentFilters = parseFiltersFromSearchParams(searchParams);
			const nextParams = buildQueryFromFilters(
				{
					...currentFilters,
					sort: sortItem.sort,
					order: sortItem.order,
					page: "1",
				},
				searchParams
			);
			dispatch(
				setSort({
					sort: sortItem.sort,
					order: sortItem.order,
				})
			);
			router.replace(`${pathname}?${nextParams.toString()}`, {
				scroll: false,
			});
			window.scrollTo({ top: 0, behavior: "smooth" });
			document.getElementById("container")?.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	const initialValue = SortItems.find(
		(item) =>
			item.sort === filters.sort && item.order === filters.order
	);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						className={`text-center border md:h-10 rounded-md border-gray-200 shadow-none justify-center md:justify-between items-center text-gray-700 hover:text-primary hover:border-primary hover:bg-white data-[state=open]:border-primary data-[state=open]:text-primary data-[state=open]:bg-white ${classname || ""}`}
						variant={"outline"}>
						<SortAsc />
						<span className="font-medium text-sm">Sort</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuLabel className="text-gray-500  font-medium">
						Sort By
					</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={initialValue?.id.toString()}
						onValueChange={onChange}>
						{SortItems.map((item) => (
							<DropdownMenuRadioItem
								key={item.id}
								value={item.id.toString()}>
								{item.label}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};

export default SortComponent;
