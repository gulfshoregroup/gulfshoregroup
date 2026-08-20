"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { ChevronRight } from "lucide-react";
import PaymentVisualization from "@/components/payment-visualization";
import AmortizationSchedule from "@/components/amortization-schedule";
import Footer from "@/components/global/footer";

export default function MortgageCalculator() {
	const [homePrice, setHomePrice] = useState(100000);
	const [downPayment, setDownPayment] = useState(20000);
	const [downPaymentPercent, setDownPaymentPercent] = useState(20);

	const [loanProgram, setLoanProgram] = useState("30-year");
	const [interestRate, setInterestRate] = useState(6.0);
	const [activeTab, setActiveTab] = useState("breakdown");

	// Handle down payment input changes
	const handleDownPaymentChange = (value: number) => {
		setDownPayment(value);
		const percent = Math.round((value / homePrice) * 100);
		setDownPaymentPercent(percent);
	};

	const handleDownPaymentPercentChange = (percent: number) => {
		const amount = Math.round((homePrice * percent) / 100);
		setDownPayment(amount);
		setDownPaymentPercent(percent);
	};

	const handleHomePriceChange = (value: number) => {
		setHomePrice(value);
		const amount = Math.round((value * downPaymentPercent) / 100);
		setDownPayment(amount);
	};

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

	// Calculate mortgage details
	const loanAmount = homePrice - downPayment;
	const monthlyRate = interestRate / 100 / 12;
	const numberOfPayments = getLoanTermYears(loanProgram) * 12;

	let monthlyPayment = 0;
	if (monthlyRate !== 0) {
		monthlyPayment =
			(loanAmount *
				(monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
			(Math.pow(1 + monthlyRate, numberOfPayments) - 1);
	}

	const totalMonthlyPayment = Math.round(monthlyPayment);

	return (
		<div className="min-h-screen bg-background">
			<div className="container mb-10 mx-auto px-4 py-12">
				{/* Header */}
				<div className="mb-12">
					<h1 className="text-4xl font-bold mb-4">
						Mortgage Calculator
					</h1>
					<p className="text-muted-foreground max-w-2xl">
						Use Zillow's home loan calculator to quickly estimate your
						total mortgage payment including principal and interest,
						plus estimates for PMI, property taxes, home insurance and
						HOA fees. Enter the price of a home and down payment
						amount to calculate your estimated mortgage payment with
						an itemized breakdown and schedule. Adjust the loan
						details to fit your scenario more accurately.
					</p>
				</div>

				{/* Main Content */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column - Inputs */}
					<div className="lg:col-span-1">
						<div className="space-y-6">
							{/* Home Price */}
							<div>
								<label className="block text-sm font-semibold mb-2">
									Home price{" "}
									<span className="text-destructive">*</span>
								</label>
								<div className="flex items-center border rounded-lg overflow-hidden">
									<span className="px-3 text-muted-foreground">
										$
									</span>
									<Input
										type="number"
										value={homePrice}
										onChange={(e) =>
											handleHomePriceChange(Number(e.target.value))
										}
										className="border-0 font-medium"
									/>
								</div>
							</div>

							{/* Down Payment */}
							<div>
								<label className="block text-sm font-semibold mb-2">
									Down payment{" "}
									<span className="text-destructive">*</span>
								</label>
								<div className="flex gap-2">
									<div className="flex items-center border rounded-lg overflow-hidden flex-1">
										<span className="px-3 text-muted-foreground">
											$
										</span>
										<Input
											type="number"
											value={downPayment}
											onChange={(e) =>
												handleDownPaymentChange(
													Number(e.target.value)
												)
											}
											className="border-0 font-medium"
										/>
									</div>
									<div className="flex items-center border rounded-lg overflow-hidden w-24">
										<Input
											type="number"
											value={downPaymentPercent}
											onChange={(e) =>
												handleDownPaymentPercentChange(
													Number(e.target.value)
												)
											}
											className="border-0 font-medium text-center"
										/>
										<span className="px-2 text-muted-foreground">
											%
										</span>
									</div>
								</div>
							</div>

							{/* Loan Program */}
							<div>
								<label className="block text-sm font-semibold mb-2">
									Loan program
								</label>
								<select
									//                         	"5 Year ARM": 5,
									// "7 Year ARM": 7,
									// "30 Fixed": 30,
									// "30 Fixed FHA": 30,
									// "5 Fixed": 5,
									// "10 Fixed": 10,
									// "15 Fixed": 15,
									value={loanProgram}
									onChange={(e) => setLoanProgram(e.target.value)}
									className="w-full px-3 py-2 border rounded-lg bg-background font-medium">
									{[
										"5 Year ARM",
										"7 Year ARM",
										"30 Fixed",
										"30 Fixed FHA",
										"5 Fixed",
										"10 Fixed",
										"15 Fixed",
									].map((term) => (
										<option key={term} value={term}>
											{term}
										</option>
									))}
								</select>
							</div>

							{/* Interest Rate */}
							<div>
								<div className="flex items-center justify-between mb-2">
									<label className="block text-sm font-semibold">
										Interest rate{" "}
										<span className="text-destructive">*</span>
									</label>
								</div>
								<div className="flex items-center border rounded-lg overflow-hidden">
									<Input
										type="number"
										value={interestRate}
										onChange={(e) =>
											setInterestRate(Number(e.target.value))
										}
										step="0.01"
										className="border-0 font-medium"
									/>
									<span className="px-3 text-muted-foreground">
										%
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column - Results */}
					<div className="lg:col-span-2">
						<Card className="p-8">
							<Tabs value={activeTab} onValueChange={setActiveTab}>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="breakdown">
										Breakdown
									</TabsTrigger>
									<TabsTrigger value="schedule">Schedule</TabsTrigger>
								</TabsList>

								<TabsContent value="breakdown" className="mt-8">
									<PaymentVisualization
										totalPayment={totalMonthlyPayment}
										principalAndInterest={Math.round(monthlyPayment)}
									/>
								</TabsContent>

								<TabsContent value="schedule" className="mt-8">
									<AmortizationSchedule
										loanAmount={loanAmount}
										monthlyRate={monthlyRate}
										numberOfPayments={numberOfPayments}
										monthlyPayment={Math.round(monthlyPayment)}
									/>
								</TabsContent>
							</Tabs>
						</Card>
					</div>
				</div>
			</div>
			<hr className="mb-10" />
			<Footer />
		</div>
	);
}
