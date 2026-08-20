"use client";

import Link from "next/link";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
	_id: string;
	clerkId?: string;
	email: string;
	name: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	profileImage?: string;
	isActive?: boolean;
	status?: string;
}

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	// Modals State
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editFormData, setEditFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		isActive: true,
	});

	const [deletingUser, setDeletingUser] = useState<User | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const res = await axios.get("/api/admin/users");
			if (res.data && res.data.users) {
				setUsers(res.data.users);
			}
		} catch (error: any) {
			console.error("Error fetching users:", error);
			toast.error("Failed to load users");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	// Handle Edit Modal Open
	const handleOpenEdit = (user: User) => {
		setEditingUser(user);
		const names = (user.name || "").split(" ");
		setEditFormData({
			firstName: user.firstName || names[0] || "",
			lastName: user.lastName || names.slice(1).join(" ") || "",
			email: user.email || "",
			phone: user.phone || "",
			isActive: user.isActive ?? true,
		});
		setIsEditOpen(true);
	};

	// Handle Submit Edit
	const handleSaveUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingUser) return;

		try {
			const res = await fetch(`/api/leads/${editingUser._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					firstName: editFormData.firstName,
					lastName: editFormData.lastName,
					email: editFormData.email,
					phone: editFormData.phone,
				}),
			});

			if (!res.ok) throw new Error("Failed to update user");

			const updatedName = `${editFormData.firstName} ${editFormData.lastName}`.trim() || editingUser.name;
			
			setUsers((prev) =>
				prev.map((u) =>
					u._id === editingUser._id
						? {
								...u,
								firstName: editFormData.firstName,
								lastName: editFormData.lastName,
								name: updatedName,
								email: editFormData.email,
								phone: editFormData.phone,
								isActive: editFormData.isActive,
						  }
						: u
				)
			);

			toast.success("User details updated successfully!");
			setIsEditOpen(false);
			setEditingUser(null);
		} catch (err: any) {
			toast.error(err.message || "Failed to update user");
		}
	};

	// Handle Delete
	const handleOpenDelete = (user: User) => {
		setDeletingUser(user);
		setIsDeleteOpen(true);
	};

	const ConfirmDelete = async () => {
		if (!deletingUser) return;
		try {
			setIsDeleting(true);
			const res = await fetch(`/api/leads/${deletingUser._id}`, {
				method: "DELETE",
			});

			if (!res.ok) throw new Error("Failed to delete user");

			setUsers((prev) => prev.filter((u) => u._id !== deletingUser._id));
			toast.success("User deleted successfully!");
			setIsDeleteOpen(false);
			setDeletingUser(null);
		} catch (err: any) {
			toast.error(err.message || "Failed to delete user");
		} finally {
			setIsDeleting(false);
		}
	};

	// Search Filter
	const filteredUsers = users.filter((user) => {
		const term = searchTerm.toLowerCase();
		return (
			user.name?.toLowerCase().includes(term) ||
			user.email?.toLowerCase().includes(term) ||
			user.phone?.toLowerCase().includes(term)
		);
	});

	return (
		<div className="space-y-6 px-4 my-5">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Users</h1>
			</div>

			{/* Search */}
			<div className="flex items-center gap-2">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search users by name, email or phone..."
						className="pl-8"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
									Loading users...
								</TableCell>
							</TableRow>
						) : filteredUsers.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
									No users found.
								</TableCell>
							</TableRow>
						) : (
							filteredUsers.map((user) => (
								<TableRow key={user._id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={user.profileImage}
													alt={user.name}
												/>
												<AvatarFallback>
													{user.name.charAt(0)}
													{user.name.split(" ")[1]?.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div>
												<div className="font-medium">{user.name}</div>
												<div className="text-xs text-muted-foreground">
													{user.email}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={user.isActive ? "default" : "secondary"}>
											{user.isActive ? "Active" : "Inactive"}
										</Badge>
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>{user.phone || "N/A"}</TableCell>

									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											{/* View */}
											<Button variant="ghost" size="icon" asChild title="View Details">
												<Link href={`/admin/users/${user._id}`}>
													<Eye className="h-4 w-4 text-blue-600" />
												</Link>
											</Button>

											{/* Edit */}
											<Button
												variant="ghost"
												size="icon"
												title="Edit User"
												onClick={() => handleOpenEdit(user)}
											>
												<Edit className="h-4 w-4 text-amber-600" />
											</Button>

											{/* Delete */}
											<Button
												variant="ghost"
												size="icon"
												title="Delete User"
												onClick={() => handleOpenDelete(user)}
											>
												<Trash2 className="h-4 w-4 text-red-600" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* EDIT USER DIALOG */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="sm:max-w-[450px]">
					<form onSubmit={handleSaveUser}>
						<DialogHeader>
							<DialogTitle>Edit User Details</DialogTitle>
							<DialogDescription>
								Update user profile information below.
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="editFirstName" className="text-right">
									First Name
								</Label>
								<Input
									id="editFirstName"
									value={editFormData.firstName}
									onChange={(e) =>
										setEditFormData((prev) => ({
											...prev,
											firstName: e.target.value,
										}))
									}
									className="col-span-3"
									required
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="editLastName" className="text-right">
									Last Name
								</Label>
								<Input
									id="editLastName"
									value={editFormData.lastName}
									onChange={(e) =>
										setEditFormData((prev) => ({
											...prev,
											lastName: e.target.value,
										}))
									}
									className="col-span-3"
									required
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="editEmail" className="text-right">
									Email
								</Label>
								<Input
									id="editEmail"
									type="email"
									value={editFormData.email}
									onChange={(e) =>
										setEditFormData((prev) => ({
											...prev,
											email: e.target.value,
										}))
									}
									className="col-span-3"
									required
								/>
							</div>

							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="editPhone" className="text-right">
									Phone
								</Label>
								<Input
									id="editPhone"
									value={editFormData.phone}
									onChange={(e) =>
										setEditFormData((prev) => ({
											...prev,
											phone: e.target.value,
										}))
									}
									className="col-span-3"
								/>
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Save Changes</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* DELETE CONFIRMATION DIALOG */}
			<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<DialogContent className="sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle className="text-red-600">Delete User</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete user{" "}
							<span className="font-semibold text-foreground">
								{deletingUser?.name}
							</span>{" "}
							({deletingUser?.email})? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDeleteOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={ConfirmDelete}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete User"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

