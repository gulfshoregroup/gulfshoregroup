"use client";
import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartDataItem {
	name: string;
	value: number;
	fill: string;
	[key: string]: any;
}

interface PieDonutChartProps {
	chartData: ChartDataItem[];
	totalNumber: number;
	chartConfig: ChartConfig;
	title?: string;
	description?: string;
	trendingText?: string;
	footerText?: string;
}

export function ChartComponent({
	chartData,
	totalNumber,
	chartConfig,
	title = "Estimated Monthly Payment",
	description = "",
	trendingText = "Trending up by 5.2% this month",
	footerText = "All calculations are estimates and provided for informational purposes only. Actual amounts may vary.",
}: PieDonutChartProps) {
	return (
		<Card className="flex flex-col py-2">
			<CardHeader className="items-center pb-0">
				<CardTitle className="pt-3">{title}</CardTitle>
				{description && (
					<CardDescription>{description}</CardDescription>
				)}
			</CardHeader>

			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto min-w-[200px] min-h-[200px] aspect-square max-h-[250px]">
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Pie
							data={chartData}
							dataKey="value"
							nameKey="name"
							innerRadius={80}
							strokeWidth={4}>
							<Label
								position="center"
								content={({ viewBox }) => {
									console.log(
										"Rendering Label with viewBox:",
										viewBox
									);
									if (viewBox && "x" in viewBox && "y" in viewBox) {
										return (
											<text
												className="fill-black"
												x={viewBox.x}
												y={viewBox.y}
												textAnchor="middle"
												dominantBaseline="middle"
												fill="black">
												<tspan
													className="fill-black"
													x={viewBox.x + viewBox.width / 2 - 5}
													y={viewBox.y + viewBox.height / 2 - 10}
													fontSize="18"
													fontWeight="bold"
													fill="black">
													{totalNumber.toLocaleString("en-US", {
														style: "currency",
														currency: "USD",
													})}
												</tspan>
												<tspan
													x={viewBox.x + viewBox.width / 2 - 5}
													y={viewBox.y! + viewBox.height / 2 + 10}
													fontSize="12"
													fontWeight="normal">
													Estimate
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>

			<CardFooter className="flex-col gap-2 text-sm">
				<div className="leading-none text-center text-xs text-muted-foreground">
					{footerText}
				</div>
			</CardFooter>
		</Card>
	);
}
