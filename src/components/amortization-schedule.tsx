"use client";

import { useMemo } from "react";

interface AmortizationScheduleProps {
	loanAmount: number;
	monthlyRate: number;
	numberOfPayments: number;
	monthlyPayment: number;
}

export default function AmortizationSchedule({
	loanAmount,
	monthlyRate,
	numberOfPayments,
	monthlyPayment,
}: AmortizationScheduleProps) {
	const schedule = useMemo(() => {
		const rows = [];
		let balance = loanAmount;

		for (let i = 1; i <= Math.min(numberOfPayments, 12); i++) {
			const interestPayment = Math.round(balance * monthlyRate);
			const principalPayment = monthlyPayment - interestPayment;
			balance -= principalPayment;

			rows.push({
				month: i,
				payment: monthlyPayment,
				principal: principalPayment,
				interest: interestPayment,
				balance: Math.max(0, balance),
			});
		}

		return rows;
	}, [loanAmount, monthlyRate, numberOfPayments, monthlyPayment]);

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b">
						<th className="text-left py-3 px-3 font-semibold">
							Month
						</th>
						<th className="text-right py-3 px-3 font-semibold">
							Payment
						</th>
						<th className="text-right py-3 px-3 font-semibold">
							Principal
						</th>
						<th className="text-right py-3 px-3 font-semibold">
							Interest
						</th>
						<th className="text-right py-3 px-3 font-semibold">
							Balance
						</th>
					</tr>
				</thead>
				<tbody>
					{schedule.map((row) => (
						<tr
							key={row.month}
							className="border-b hover:bg-secondary transition-colors">
							<td className="py-3 px-3">{row.month}</td>
							<td className="text-right py-3 px-3">
								${row.payment.toLocaleString()}
							</td>
							<td className="text-right py-3 px-3">
								${row.principal.toLocaleString()}
							</td>
							<td className="text-right py-3 px-3">
								${row.interest.toLocaleString()}
							</td>
							<td className="text-right py-3 px-3 font-semibold">
								${row.balance.toLocaleString()}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<p className="text-xs text-muted-foreground mt-4">
				Showing first 12 months of {numberOfPayments} total payments
			</p>
		</div>
	);
}
