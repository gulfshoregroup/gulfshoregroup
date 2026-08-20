import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function PropertySkeletonCard() {
	return (
		<Card className="h-full w-full rounded-2xl shadow shadow-zinc-300 overflow-hidden">
			<CardHeader className="p-0">
				<div className="relative">
					<Skeleton className="object-cover h-56 min-h-56 w-full rounded-t-xl" />
					<div className="absolute top-2.5 left-2.5">
						<Skeleton className="h-5 w-[90px]" />
					</div>
					<div className="absolute top-2.5 right-2.5">
						<div className="flex justify-between gap-2 items-center ">
							<Skeleton className="w-10 h-10 rounded-full" />
							<Skeleton className="w-10 h-10 rounded-full" />
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-2.5 py-1">
				<div className="flex flex-col w-full gap-2 my-2 items-start">
					<div className="flex w-full justify-between gap-2 items-center">
						<Skeleton className="h-5 w-[150px]" />
						<Skeleton className="h-6 w-[100px]" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-[300px]" />
						<Skeleton className="h-4 w-[300px]" />
					</div>
					<div className="flex justify-between gap-2 items-center w-full pb-2">
						<Skeleton className="h-4 w-full" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
