import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

interface PaymentVisualizationProps {
	totalPayment: number;
	principalAndInterest: number;
}

export default function PaymentVisualization({
	totalPayment,
	principalAndInterest,
}: PaymentVisualizationProps) {
	const data = [
		{
			name: "P & I",
			value: principalAndInterest,
			label: `P & I\n$${principalAndInterest.toLocaleString()}`,
		},
	].filter((item) => item.value > 0);

	const COLORS = ["hsl(var(--primary))"];

	return (
		<div className="flex flex-col items-center space-y-8">
			<div className="w-full h-52">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={80}
							outerRadius={100}
							paddingAngle={2}
							dataKey="value">
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									className="fill-red-300"
								/>
							))}
						</Pie>
						<Tooltip
							formatter={(value) =>
								`$${(value as number).toLocaleString()}`
							}
							contentStyle={{
								backgroundColor: "hsl(var(--card))",
								border: "1px solid hsl(var(--border))",
								borderRadius: "0.5rem",
							}}
						/>
					</PieChart>
				</ResponsiveContainer>
			</div>

			<div className="text-center">
				<p className="text-sm text-muted-foreground mb-1">
					Your payment
				</p>
				<p className="text-4xl font-bold text-primary">
					${totalPayment.toLocaleString()}
				</p>
				<p className="text-xs text-muted-foreground mt-2">/month</p>
			</div>

			<div className="grid grid-cols-2 gap-4 w-full">
				{data.map((item, index) => (
					<div key={item.name} className="p-3 border rounded-lg">
						<p className="text-xs text-muted-foreground mb-1">
							{item.name}
						</p>
						<p className="text-lg font-semibold">
							${item.value.toLocaleString()}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
