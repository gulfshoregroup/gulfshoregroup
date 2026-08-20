"use client";

import * as React from "react";
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconCircleCheckFilled,
	IconDotsVertical,
	IconGripVertical,
	IconLayoutColumns,
	IconLoader,
	IconPlus,
} from "@tabler/icons-react";
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	Row,
	SortingState,
	useReactTable,
	VisibilityState,
} from "@tanstack/react-table";

import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";

export const schema = z.object({
		id: z.number(),
		type: z.string(),
		status: z.string(),
		header: z.string(),
		target: z.number(),
		limit: z.number(),
		reviewer: z.string(),
		property_id: z.string(),
		PropertyClass: z.string(),
		Acres: z.string(),
		AdditionalRooms: z.string(),
		Amenities: z.string(),
		ApproxLivingArea: z.string(),
		BathsFull: z.string(),
		BathsHalf: z.string(),
		BathsTotal: z.string(),
		BedroomDesc: z.string(),
		Bedrooms: z.string(),
		BedsTotal: z.string(),
		BuildingDesc: z.string(),
		BuildingDesign: z.string(),
		CableAvailableYN: z.string(),
		City: z.string(),
		CloseDate: z.date(),
		ClosePrice: z.number(),
		CommunityType: z.string(),
		ConditionalDate: z.string(),
		Construction: z.string(),
		Cooling: z.string(),
		CoolingRemarks: z.string(),
		CoolingYN: z.string(),
		CountyOrParish: z.string(),
		CreatedDate: z.date(),
		CurrentPrice: z.number(),
		DOM: z.string(),
		DateRented: z.string(),
		Development: z.string(),
		DevelopmentName: z.string(),
		Electric: z.string(),
		Elevator: z.string(),
		Equipment: z.string(),
		ExteriorFeatures: z.string(),
		FencedYardYN: z.string(),
		Flooring: z.string(),
		ForeclosedREOYN: z.string(),
		FullAddress: z.string(),
		FurnishedDesc: z.string(),
		GarageDesc: z.string(),
		GarageSpaces: z.string(),
		GuestHouseDesc: z.string(),
		GulfAccessYN: z.string(),
		Heat: z.string(),
		HeatingRemarks: z.string(),
		HeatingYN: z.string(),
		HighSchool: z.string(),
		InteriorFeatures: z.string(),
		LandLeaseYN: z.string(),
		LandSqFt: z.string(),
		LeasePrice: z.string(),
		LeaseRailYN: z.string(),
		LeaseRateDesc: z.string(),
		ListPrice: z.number(),
		ListPriceDesc: z.string(),
		LotType: z.string(),
		LotUnit: z.string(),
		matrix_unique_id: z.string(),
		MLS: z.string(),
		MLSAreaMajor: z.string(),
		MLSNumber: z.string(),
		MatrixModifiedDT: z.date(),
		MiddleSchool: z.string(),
		NumUnitFloor: z.string(),
		NumberDockHighDoors: z.string(),
		NumberOfBays: z.string(),
		NumberOfParcelsLots: z.string(),
		NumberOfSpacesUnits: z.string(),
		NumberofLoadingDoors: z.string(),
		ParcelNumber: z.string(),
		Parking: z.string(),
		Pets: z.string(),
		PetsLimitMaxNumber: z.string(),
		PetsLimitMaxWeight: z.string(),
		PetsLimitOther: z.string(),
		PhotoCount: z.string(),
		PostalCode: z.string(),
		PostalCodePlus4: z.string(),
		PotentialShortSaleYN: z.string(),
		PricePerAcre: z.string(),
		PrivatePoolDesc: z.string(),
		PrivatePoolYN: z.string(),
		PrivateSpaDesc: z.string(),
		PrivateSpaYN: z.string(),
		PropertyAddress: z.string(),
		PropertySearchSlug: z.string(),
		PropertyAddressonInternetYN: z.string(),
		PropertyInformation: z.string(),
		PropertyLocation: z.string(),
		PropertyName: z.string(),
		PropertyType: z.string(),
		PropertyUseType: z.string(),
		Ranges: z.string(),
		RoomCount: z.string(),
		SlipNumber: z.string(),
		SlipType: z.string(),
		StateOrProvince: z.string(),
		Status: z.string(),
		StatusType: z.string(),
		StreetDirPrefix: z.string(),
		StreetDirSuffix: z.string(),
		StreetName: z.string(),
		StreetNumber: z.string(),
		StreetNumberModifier: z.string(),
		StreetSuffix: z.string(),
		SubCondoName: z.string(),
		SubjectPropertySqFt: z.string(),
		Terms: z.string(),
		TotalArea: z.string(),
		TotalBuildingSqFt: z.string(),
		TotalFloors: z.string(),
		Township: z.string(),
		UnitCount: z.string(),
		UnitFloor: z.string(),
		UnitNumber: z.string(),
		UnitsinBuilding: z.string(),
		UnitsinComplex: z.string(),
		UtilitiesAvailable: z.string(),
		Water: z.string(),
		WaterfrontDesc: z.string(),
		WaterfrontYN: z.string(),
		YearBuilt: z.string(),
		DefaultPic: z.string(),
		AllPixDownloaded: z.string(),
		AllPixList: z.array(z.string()),
		PixVerified: z.string(),
		last_image_query: z.string(),
		Longitude: z.string(),
		Latitude: z.string(),
		GeoLocFetched: z.string(),
		other_fields_json: z.string(),
		PostToFbWall: z.string(),
		SendAlerts: z.string(),
		PriceChangeType: z.string(),
		PreviousPptyPrice: z.string(),
		LastChangeDate: z.date(),
		DateAdded: z.date(),
	},
);

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
	const { attributes, listeners } = useSortable({
		id,
	});

	return (
		<Button
			{...attributes}
			{...listeners}
			variant="ghost"
			size="icon"
			className="text-muted-foreground size-7 hover:bg-transparent">
			<IconGripVertical className="text-muted-foreground size-3" />
			<span className="sr-only">Drag to reorder</span>
		</Button>
	);
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
	
	{
		accessorKey: "FullAddress",
		header: "Address",
		cell: ({ row }) => {
			return (
				<Badge
					variant="outline"
					className="text-muted-foreground px-1.5">
					{row.original.FullAddress}
				</Badge>
			);
		},
		enableHiding: false,
	},
	{
		accessorKey: "type",
		header: "Section Type",
		cell: ({ row }) => (
			<div className="w-32">
				<Badge
					variant="outline"
					className="text-muted-foreground px-1.5">
					{row.original.type}
				</Badge>
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<Badge
				variant="outline"
				className="text-muted-foreground px-1.5">
				{row.original.status === "Done" ? (
					<IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
				) : (
					<IconLoader />
				)}
				{row.original.status}
			</Badge>
		),
	},
	{
		accessorKey: "target",
		header: () => <div className="w-full text-right">Target</div>,
		cell: ({ row }) => (
			<form
				onSubmit={(e) => {
					e.preventDefault();
					toast.promise(
						new Promise((resolve) => setTimeout(resolve, 1000)),
						{
							loading: `Saving ${row.original.header}`,
							success: "Done",
							error: "Error",
						}
					);
				}}>
				<Label
					htmlFor={`${row.original.id}-target`}
					className="sr-only">
					Target
				</Label>
				<Input
					className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
					defaultValue={row.original.target}
					id={`${row.original.id}-target`}
				/>
			</form>
		),
	},
	{
		accessorKey: "limit",
		header: () => <div className="w-full text-right">Limit</div>,
		cell: ({ row }) => (
			<form
				onSubmit={(e) => {
					e.preventDefault();
					toast.promise(
						new Promise((resolve) => setTimeout(resolve, 1000)),
						{
							loading: `Saving ${row.original.header}`,
							success: "Done",
							error: "Error",
						}
					);
				}}>
				<Label
					htmlFor={`${row.original.id}-limit`}
					className="sr-only">
					Limit
				</Label>
				<Input
					className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
					defaultValue={row.original.limit}
					id={`${row.original.id}-limit`}
				/>
			</form>
		),
	},
	{
		accessorKey: "reviewer",
		header: "Reviewer",
		cell: ({ row }) => {
			const isAssigned = row.original.reviewer !== "Assign reviewer";

			if (isAssigned) {
				return row.original.reviewer;
			}

			return (
				<>
					<Label
						htmlFor={`${row.original.id}-reviewer`}
						className="sr-only">
						Reviewer
					</Label>
					<Select>
						<SelectTrigger
							className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
							size="sm"
							id={`${row.original.id}-reviewer`}>
							<SelectValue placeholder="Assign reviewer" />
						</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
							<SelectItem value="Jamik Tashpulatov">
								Jamik Tashpulatov
							</SelectItem>
						</SelectContent>
					</Select>
				</>
			);
		},
	},
	{
		id: "actions",
		cell: () => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
						size="icon">
						<IconDotsVertical />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-32">
					<DropdownMenuItem>Edit</DropdownMenuItem>
					<DropdownMenuItem>Make a copy</DropdownMenuItem>
					<DropdownMenuItem>Favorite</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive">
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
];

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
	const { transform, transition, setNodeRef, isDragging } =
		useSortable({
			id: row.original.id,
		});

	return (
		<TableRow
			data-state={row.getIsSelected() && "selected"}
			data-dragging={isDragging}
			ref={setNodeRef}
			className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
			style={{
				transform: CSS.Transform.toString(transform),
				transition: transition,
			}}>
			{row.getVisibleCells().map((cell) => (
				<TableCell key={cell.id}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</TableCell>
			))}
		</TableRow>
	);
}

export function DataTable({
	data: initialData,
}: {
	data: z.infer<typeof schema>[];
}) {
	const [data, setData] = React.useState(() => initialData);
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const sortableId = React.useId();
	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {})
	);

	const dataIds = React.useMemo<UniqueIdentifier[]>(
		() => data?.map(({ id }) => id) || [],
		[data]
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			setData((data) => {
				const oldIndex = dataIds.indexOf(active.id);
				const newIndex = dataIds.indexOf(over.id);
				return arrayMove(data, oldIndex, newIndex);
			});
		}
	}

	return (
		<Tabs
			defaultValue="outline"
			className="w-full flex-col justify-start gap-6">
			<div className="flex items-center justify-between px-4 lg:px-6">
				<Label htmlFor="view-selector" className="sr-only">
					View
				</Label>
				<Select defaultValue="outline">
					<SelectTrigger
						className="flex w-fit @4xl/main:hidden"
						size="sm"
						id="view-selector">
						<SelectValue placeholder="Select a view" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="outline">Outline</SelectItem>
						<SelectItem value="past-performance">
							Past Performance
						</SelectItem>
						<SelectItem value="key-personnel">
							Key Personnel
						</SelectItem>
						<SelectItem value="focus-documents">
							Focus Documents
						</SelectItem>
					</SelectContent>
				</Select>
				<TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
					<TabsTrigger value="outline">Outline</TabsTrigger>
					<TabsTrigger value="past-performance">
						Past Performance <Badge variant="secondary">3</Badge>
					</TabsTrigger>
					<TabsTrigger value="key-personnel">
						Key Personnel <Badge variant="secondary">2</Badge>
					</TabsTrigger>
					<TabsTrigger value="focus-documents">
						Focus Documents
					</TabsTrigger>
				</TabsList>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<IconLayoutColumns />
								<span className="hidden lg:inline">
									Customize Columns
								</span>
								<span className="lg:hidden">Columns</span>
								<IconChevronDown />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{table
								.getAllColumns()
								.filter(
									(column) =>
										typeof column.accessorFn !== "undefined" &&
										column.getCanHide()
								)
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
					<Button variant="outline" size="sm">
						<IconPlus />
						<span className="hidden lg:inline">Add Section</span>
					</Button>
				</div>
			</div>
			<TabsContent
				value="outline"
				className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
				<div className="overflow-hidden rounded-lg border">
					<DndContext
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						onDragEnd={handleDragEnd}
						sensors={sensors}
						id={sortableId}>
						<Table>
							<TableHeader className="bg-muted sticky top-0 z-10">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => {
											return (
												<TableHead
													key={header.id}
													colSpan={header.colSpan}>
													{header.isPlaceholder
														? null
														: flexRender(
																header.column.columnDef.header,
																header.getContext()
														  )}
												</TableHead>
											);
										})}
									</TableRow>
								))}
							</TableHeader>
							<TableBody className="**:data-[slot=table-cell]:first:w-8">
								{table.getRowModel().rows?.length ? (
									<SortableContext
										items={dataIds}
										strategy={verticalListSortingStrategy}>
										{table.getRowModel().rows.map((row) => (
											<DraggableRow key={row.id} row={row} />
										))}
									</SortableContext>
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className="h-24 text-center">
											No results.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</DndContext>
				</div>
				<div className="flex items-center justify-between px-4">
					<div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex w-full items-center gap-8 lg:w-fit">
						<div className="hidden items-center gap-2 lg:flex">
							<Label
								htmlFor="rows-per-page"
								className="text-sm font-medium">
								Rows per page
							</Label>
							<Select
								value={`${table.getState().pagination.pageSize}`}
								onValueChange={(value) => {
									table.setPageSize(Number(value));
								}}>
								<SelectTrigger
									size="sm"
									className="w-20"
									id="rows-per-page">
									<SelectValue
										placeholder={table.getState().pagination.pageSize}
									/>
								</SelectTrigger>
								<SelectContent side="top">
									{[10, 20, 30, 40, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex w-fit items-center justify-center text-sm font-medium">
							Page {table.getState().pagination.pageIndex + 1} of{" "}
							{table.getPageCount()}
						</div>
						<div className="ml-auto flex items-center gap-2 lg:ml-0">
							<Button
								variant="outline"
								className="hidden h-8 w-8 p-0 lg:flex"
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}>
								<span className="sr-only">Go to first page</span>
								<IconChevronsLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}>
								<span className="sr-only">Go to previous page</span>
								<IconChevronLeft />
							</Button>
							<Button
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}>
								<span className="sr-only">Go to next page</span>
								<IconChevronRight />
							</Button>
							<Button
								variant="outline"
								className="hidden size-8 lg:flex"
								size="icon"
								onClick={() =>
									table.setPageIndex(table.getPageCount() - 1)
								}
								disabled={!table.getCanNextPage()}>
								<span className="sr-only">Go to last page</span>
								<IconChevronsRight />
							</Button>
						</div>
					</div>
				</div>
			</TabsContent>
			<TabsContent
				value="past-performance"
				className="flex flex-col px-4 lg:px-6">
				<div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
			</TabsContent>
			<TabsContent
				value="key-personnel"
				className="flex flex-col px-4 lg:px-6">
				<div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
			</TabsContent>
			<TabsContent
				value="focus-documents"
				className="flex flex-col px-4 lg:px-6">
				<div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
			</TabsContent>
		</Tabs>
	);
}
