"use client";

import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select"; // Import Shadcn Select components

import { ChartConfig } from "../ui/chart";
import { ChartComponent } from "./chart";

export default function MortgageCalculator({
	propertyPrice,
}: {
	propertyPrice: number;
}) {
	const [homePrice, setHomePrice] = useState(propertyPrice);
	const [downPayment, setDownPayment] = useState(propertyPrice * 0.2);
	const [loanTerm, setLoanTerm] = useState("30 Fixed");
	const [interestRate, setInterestRate] = useState(6.0);
	const [homePriceError, setHomePriceError] = useState("");
	const [downPaymentError, setDownPaymentError] = useState("");
	const [interestRateError, setInterestRateError] = useState("");

	// Convert loan term strings to numbers
	const getLoanTermYears = (term: string): number => {
		const terms: { [key: string]: number } = {
			"5 Year ARM": 5,
			"7 Year ARM": 7,
			"30 Fixed": 30,
			"30 Fixed FHA": 30,
			"5 Fixed": 5,
			"10 Fixed": 10,
			"15 Fixed": 15,
		};
		return terms[term] || 30;
	};

	const loanTermYears = getLoanTermYears(loanTerm);
	const loanAmount = homePrice - downPayment;
	const monthlyInterestRate = interestRate / 100 / 12;
	const totalPayments = loanTermYears * 12;
	const monthlyPrincipalInterest =
		loanAmount > 0
			? monthlyInterestRate > 0
				? (loanAmount * monthlyInterestRate) /
				  (1 - Math.pow(1 + monthlyInterestRate, -totalPayments))
				: loanAmount / totalPayments
			: 0;
	const totalMonthlyPayment = monthlyPrincipalInterest;

	const chartConfig = useMemo(() => {
		return {
			"Principal & Interest": {
				label: "Principal & Interest",
				color: "hsl(var(--primary-color))",
			},
		} satisfies ChartConfig;
	}, []);
	// Memoize chart data
	const chartData = useMemo(
		() => [
			{
				name: "Principal & Interest",
				value: monthlyPrincipalInterest,
				fill: "#4F46E5",
			}, // Blue
		],
		[monthlyPrincipalInterest]
	);
	const totalMonthly = useMemo(
		() => chartData.reduce((acc, curr) => acc + curr.value, 0),
		[chartData]
	);

	const handleHomePriceChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const value = e.target.value;
		if (value === "" || /^\d*\.?\d*$/.test(value)) {
			setHomePrice(Number(value));
			setHomePriceError("");
		} else {
			setHomePriceError("Invalid Value");
		}
	};

	const handleDownPaymentChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const value = e.target.value;
		if (value === "" || /^\d*\.?\d*$/.test(value)) {
			setDownPayment(Number(value));
			setDownPaymentError("");
		} else {
			setDownPaymentError("Invalid Value");
		}
	};

	const handleInterestRateChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const value = e.target.value;
		if (value === "" || /^\d*\.?\d*$/.test(value)) {
			setInterestRate(Number(value));
			setInterestRateError("");
		} else {
			setInterestRateError("Invalid Value");
		}
	};

	return (
		<div className="w-full lg:mx-auto flex lg:flex-nowrap my-5  flex-wrap flex-row-reverse justify-center  bg-white rounded-xl">
			<div className="mx-2 rounded-lg">
				<ChartComponent
					chartConfig={chartConfig}
					chartData={chartData}
					totalNumber={Number(totalMonthlyPayment.toFixed(2))}
				/>
			</div>
			<div className="lg:w-[calc(50vw-1.5rem)] w-full">
				<h4 className="text-lg mt-4 lg:text-xl font-medium text-gray-900 mb-4">
					Mortgage Calculator
				</h4>

				<Label className="mb-2">Home Price ($)</Label>
				<Input
					type="text"
					value={homePrice === 0 ? "" : homePrice}
					onChange={handleHomePriceChange}
					className="w-full p-2 border rounded mb-1"
				/>
				{homePriceError && (
					<p className="text-red-500 text-xs mb-2">
						{homePriceError}
					</p>
				)}

				<Label className="mb-2">Down Payment ($)</Label>
				<Input
					type="text"
					value={downPayment === 0 ? "" : downPayment}
					onChange={handleDownPaymentChange}
					className="w-full p-2 border rounded mb-1"
				/>
				{downPaymentError && (
					<p className="text-red-500 text-xs mb-2">
						{downPaymentError}
					</p>
				)}

				<div className="grid grid-cols-2 gap-2">
					<div>
						<Label className="mb-2">Loan Term</Label>
						<Select value={loanTerm} onValueChange={setLoanTerm}>
							<SelectTrigger className="w-full p-2 border rounded mb-4">
								<SelectValue placeholder="Select Loan Term" />
							</SelectTrigger>
							<SelectContent>
								{[
									"5 Year ARM",
									"7 Year ARM",
									"30 Fixed",
									"30 Fixed FHA",
									"5 Fixed",
									"10 Fixed",
									"15 Fixed",
								].map((term) => (
									<SelectItem key={term} value={term}>
										{term}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label className="mb-2">Interest Rate (%)</Label>
						<Input
							type="text"
							value={interestRate === 0 ? "" : interestRate}
							onChange={handleInterestRateChange}
							className="w-full p-2 border rounded mb-1"
						/>
						{interestRateError && (
							<p className="text-red-500 text-xs mb-2">
								{interestRateError}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
