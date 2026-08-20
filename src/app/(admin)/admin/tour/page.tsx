"use client";

import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	Calendar,
	Clock,
	MapPin,
	User,
	Phone,
	MessageSquare,
} from "lucide-react";

interface TourRequest {
	id: string;
	propertyName: string;
	propertyAddress: string;
	tourDate: string;
	tourTime: string;
	status: string;
	userName: string;
	userPhone: string;
	userEmail: string;
	message: string;
}

export default function TourRequestsPage() {
	const [selectedRequest, setSelectedRequest] = useState<TourRequest | null>(null);
	const [isViewingDetails, setIsViewingDetails] = useState(false);

	// Mock data - in a real app, you would fetch this from your API
	const tourRequests: TourRequest[] = [];

	const viewRequestDetails = (request: TourRequest) => {
		setSelectedRequest(request);
		setIsViewingDetails(true);
	};

	const closeDetails = () => {
		setIsViewingDetails(false);
		setSelectedRequest(null);
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return <Badge variant="outline">Pending</Badge>;
			case "confirmed":
				return <Badge>Confirmed</Badge>;
			case "completed":
				return <Badge variant="secondary">Completed</Badge>;
			case "cancelled":
				return <Badge variant="destructive">Cancelled</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	return (
		<div className="space-y-6 px-4 my-5">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Tour Requests</h1>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Property</TableHead>
							<TableHead>Requested By</TableHead>
							<TableHead>Tour Date</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-[100px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{tourRequests.map((request) => (
							<TableRow key={request.id}>
								<TableCell>
									<div>
										<div className="font-medium">
											{request.propertyName}
										</div>
										<div className="text-sm text-muted-foreground">
											{request.propertyAddress}
										</div>
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Avatar className="h-8 w-8">
											<AvatarImage
												src={`/avatars/user-${request.id}.png`}
												alt={request.userName}
											/>
											<AvatarFallback>
												{request.userName.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div>{request.userName}</div>
									</div>
								</TableCell>
								<TableCell>
									<div className="flex flex-col">
										<span>{request.tourDate}</span>
										<span className="text-sm text-muted-foreground">
											{request.tourTime}
										</span>
									</div>
								</TableCell>
								<TableCell>
									{getStatusBadge(request.status)}
								</TableCell>
								<TableCell>
									<Button
										variant="ghost"
										onClick={() => viewRequestDetails(request)}>
										View Details
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{isViewingDetails && selectedRequest && (
				<Dialog open={isViewingDetails} onOpenChange={closeDetails}>
					<DialogContent className="sm:max-w-[600px]">
						<DialogHeader>
							<DialogTitle>Tour Request Details</DialogTitle>
						</DialogHeader>
						<div className="grid gap-6">
							<div className="grid grid-cols-2 gap-4">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">
											Property
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="font-medium">
												{selectedRequest.propertyName}
											</div>
											<div className="flex items-center text-sm text-muted-foreground">
												<MapPin className="mr-1 h-4 w-4" />
												{selectedRequest.propertyAddress}
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium">
											Tour Schedule
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="flex items-center text-sm">
												<Calendar className="mr-1 h-4 w-4" />
												{selectedRequest.tourDate}
											</div>
											<div className="flex items-center text-sm">
												<Clock className="mr-1 h-4 w-4" />
												{selectedRequest.tourTime}
											</div>
											<div className="flex items-center text-sm">
												Status:{" "}
												{getStatusBadge(selectedRequest.status)}
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium">
										Requester Information
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex items-center gap-4">
										<Avatar className="h-12 w-12">
											<AvatarImage
												src={`/avatars/user-${selectedRequest.id}.png`}
												alt={selectedRequest.userName}
											/>
											<AvatarFallback>
												{selectedRequest.userName.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div className="space-y-1">
											<div className="flex items-center">
												<User className="mr-1 h-4 w-4" />
												<span className="font-medium">
													{selectedRequest.userName}
												</span>
											</div>
											<div className="flex items-center text-sm">
												<Phone className="mr-1 h-4 w-4" />
												{selectedRequest.userPhone}
											</div>
											<div className="text-sm text-muted-foreground">
												{selectedRequest.userEmail}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium">
										Message
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex items-start gap-2">
										<MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
										<p className="text-sm">
											{selectedRequest.message}
										</p>
									</div>
								</CardContent>
							</Card>

							<div className="flex justify-end gap-2">
								{selectedRequest.status === "pending" && (
									<>
										<Button variant="outline">Reject</Button>
										<Button>Confirm Tour</Button>
									</>
								)}
								{selectedRequest.status === "confirmed" && (
									<>
										<Button variant="outline">Cancel</Button>
										<Button>Mark as Completed</Button>
									</>
								)}
								{(selectedRequest.status === "completed" ||
									selectedRequest.status === "cancelled") && (
									<Button variant="outline" onClick={closeDetails}>
										Close
									</Button>
								)}
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
