import { z } from "zod";

export const searchFiltersSchema = z
	.object({
		query: z.string().optional(),
		location: z.string().optional(),
		minPrice: z.coerce.number().int().nonnegative().optional(),
		maxPrice: z.coerce.number().int().nonnegative().optional(),
		propertyType: z.string().optional(),
		propertySubType: z.string().optional(),
		bedrooms: z.coerce.number().int().nonnegative().optional(),
		bathrooms: z.coerce.number().nonnegative().optional(),
		city: z.string().optional(),
		community: z.string().optional(),
		postalCode: z.string().optional(),
	})
	.passthrough();

export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;

export const trackViewedPropertySchema = z.object({
	propertyId: z.string().min(1, "propertyId is required"),
});

export const listViewedPropertyQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	sortBy: z
		.enum(["lastViewedAt", "viewedAt", "viewCount"])
		.default("lastViewedAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createSearchHistorySchema = z.object({
	filters: searchFiltersSchema,
	resultCount: z.coerce.number().int().nonnegative().optional(),
});

export const listSearchHistoryQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	sortBy: z.enum(["createdAt", "updatedAt"]).default("updatedAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const wishlistPropertySchema = z.object({
	propertyId: z.string().min(1, "propertyId is required"),
});

export const listWishlistQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	sortBy: z.enum(["createdAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createSavedSearchSchema = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	filters: searchFiltersSchema,
	frequency: z.enum(["Instant", "Daily", "Weekly"]).default("Daily"),
	notify: z.boolean().default(true),
});

export const updateSavedSearchSchema = z
	.object({
		name: z.string().trim().min(1).max(120).optional(),
		filters: searchFiltersSchema.optional(),
		frequency: z.enum(["Instant", "Daily", "Weekly"]).optional(),
		notify: z.boolean().optional(),
	})
	.refine(
		(data) =>
			data.name !== undefined ||
			data.filters !== undefined ||
			data.frequency !== undefined ||
			data.notify !== undefined,
		{ message: "At least one field must be provided for update" }
	);

export const listSavedSearchQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	sortBy: z.enum(["createdAt", "updatedAt"]).default("updatedAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createInquirySchema = z.object({
	type: z.enum(["Contact_Form", "Tour_Request", "General"]),
	message: z.string().trim().max(5000).optional(),
	propertyId: z.string().min(1).optional(),
});
