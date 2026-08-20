export function mapProperty(raw: any) {
	return {
		// ---- Bridge Identity ----
		ListingKey: raw.ListingKey,
		ListingId: raw.ListingId,
		MLSNumber: raw.ListingId,
		SourceSystemKey: raw.SourceSystemKey ?? null,
		Development: raw.MLSAreaMajor ?? null,
		Community: raw.MLSAreaMajor ?? null,

		// ---- Status & Dates ----
		StandardStatus: raw.StandardStatus,
		MlsStatus: raw.MlsStatus ?? null,
		StatusType: raw.NABOR_StatusType ?? null,

		OnMarketDate: raw.OnMarketDate
			? new Date(raw.OnMarketDate)
			: null,

		OnMarketTimestamp: raw.OnMarketTimestamp
			? new Date(raw.OnMarketTimestamp)
			: null,

		StatusChangeTimestamp: raw.StatusChangeTimestamp
			? new Date(raw.StatusChangeTimestamp)
			: null,

		ModificationTimestamp: raw.ModificationTimestamp
			? new Date(raw.ModificationTimestamp)
			: null,

		BridgeModificationTimestamp: raw.BridgeModificationTimestamp
			? new Date(raw.BridgeModificationTimestamp)
			: null,

		MajorChangeType: raw.MajorChangeType ?? null,

		MajorChangeTimestamp: raw.MajorChangeTimestamp
			? new Date(raw.MajorChangeTimestamp)
			: null,

		// ---- Pricing ----
		ListPrice: raw.ListPrice ? Math.min(Number(raw.ListPrice), 2147483647) : null,
		ClosePrice: raw.ClosePrice ? Math.min(Number(raw.ClosePrice), 2147483647) : null,
		OriginalListPrice: raw.OriginalListPrice
			? Math.min(Number(raw.OriginalListPrice), 2147483647)
			: null,

		PriceChangeTimestamp: raw.PriceChangeTimestamp
			? new Date(raw.PriceChangeTimestamp)
			: null,

		// ---- Address ----
		City: raw.City,
		StateOrProvince: raw.StateOrProvince ?? null,
		PostalCode: raw.PostalCode ?? null,
		CountyOrParish: raw.CountyOrParish ?? null,

		FullAddress:
			raw.UnparsedAddress ??
			raw.FullAddress ??
			`${raw.StreetNumber ?? ""} ${raw.StreetName ?? ""} ${
				raw.StreetSuffix ?? ""
			}`.trim(),

		// ---- Property Info ----
		PropertyType: raw.PropertyType ?? null,
		PropertySubType: raw.PropertySubType ?? null,

		BedroomsTotal: raw.BedroomsTotal
			? Number(raw.BedroomsTotal)
			: null,

		BathroomsFull: raw.BathroomsFull
			? Number(raw.BathroomsFull)
			: null,

		BathroomsHalf: raw.BathroomsHalf
			? Number(raw.BathroomsHalf)
			: null,

		BathroomsTotalInteger: raw.BathroomsTotalInteger
			? Number(raw.BathroomsTotalInteger)
			: null,

		BathroomsTotalDecimal: raw.BathroomsTotalDecimal
			? Number(raw.BathroomsTotalDecimal)
			: null,

		LivingArea: raw.LivingArea ? Number(raw.LivingArea) : null,

		LivingAreaUnits: raw.LivingAreaUnits ?? null,

		BuildingAreaTotal: raw.BuildingAreaTotal
			? Number(raw.BuildingAreaTotal)
			: null,

		BuildingAreaUnits: raw.BuildingAreaUnits ?? null,

		YearBuilt: raw.YearBuilt ? Number(raw.YearBuilt) : null,
		StoriesTotal: raw.StoriesTotal ? Number(raw.StoriesTotal) : null,
		RoomsTotal: raw.RoomsTotal ? Number(raw.RoomsTotal) : null,

		// ---- Lot Info ----
		LotSizeAcres: raw.LotSizeAcres ? Number(raw.LotSizeAcres) : null,

		LotSizeSquareFeet: raw.LotSizeSquareFeet
			? Number(raw.LotSizeSquareFeet)
			: null,

		LotSizeArea: raw.LotSizeArea ? Number(raw.LotSizeArea) : null,

		LotSizeUnits: raw.LotSizeUnits ?? null,

		// ---- Location Details ----
		SubdivisionName: raw.SubdivisionName ?? null,
		MLSAreaMajor: raw.MLSAreaMajor ?? null,
		MLSAreaMinor: raw.MLSAreaMinor ?? null,
		Directions: raw.Directions ?? null,

		// ---- Geo ----
		Latitude: raw.Latitude ? Number(raw.Latitude) : null,
		Longitude: raw.Longitude ? Number(raw.Longitude) : null,
		MapCoordinate:
			raw.Latitude && raw.Longitude
				? `${raw.Latitude},${raw.Longitude}`
				: null,

		// ---- Flags ----
		HeatingYN: raw.HeatingYN === true,
		CoolingYN: raw.CoolingYN === true,

		GarageYN: raw.GarageYN === true,
		GarageSpaces: raw.GarageSpaces ? Number(raw.GarageSpaces) : null,

		AttachedGarageYN: raw.AttachedGarageYN === true,
		CarportYN: raw.CarportYN === true,
		CarportSpaces: raw.CarportSpaces
			? Number(raw.CarportSpaces)
			: null,

		CoveredSpaces: raw.CoveredSpaces
			? Number(raw.CoveredSpaces)
			: null,

		ParkingTotal: raw.ParkingTotal ? Number(raw.ParkingTotal) : null,

		// ---- Water & Outdoor ----
		WaterfrontYN: raw.WaterfrontYN === true,
		ViewYN: raw.ViewYN === true,
		PoolPrivateYN: raw.PoolPrivateYN === true,
		SpaYN: raw.SpaYN === true,

		// ---- Community & Association ----
		AssociationYN: raw.AssociationYN === true,
		AssociationFee: raw.AssociationFee
			? Number(raw.AssociationFee)
			: null,

		AssociationFeeFrequency: raw.AssociationFeeFrequency ?? null,

		AssociationAmenities: raw.AssociationAmenities ?? null,
		CommunityFeatures: raw.CommunityFeatures ?? null,
		DaysOnMarket: raw.DaysOnMarket ? Number(raw.DaysOnMarket) : null,

		// ---- Property Condition ----
		NewConstructionYN: raw.NewConstructionYN === true,
		Furnished: raw.Furnished ?? null,
		PossessionType: raw.PossessionType ?? null,

		Zoning: raw.Zoning ?? null,
		ZoningDescription: raw.ZoningDescription ?? null,
		LandLeaseYN: raw.LandLeaseYN === true,

		// ---- Financial ----
		TaxYear: raw.TaxYear ? Number(raw.TaxYear) : null,

		// ---- Agent ----
		ListAgentFullName: raw.ListAgentFullName ?? null,
		ListAgentKey: raw.ListAgentKey ?? null,
		ListAgentMlsId: raw.ListAgentMlsId ?? null,
		ListAgentEmail: raw.ListAgentEmail ?? null,
		ListAgentDirectPhone: raw.ListAgentDirectPhone ?? null,
		ListAgentCellPhone: raw.ListAgentCellPhone ?? null,
		ListAgentOfficePhone: raw.ListAgentOfficePhone ?? null,
		ListAgentOfficePhoneExt: raw.ListAgentOfficePhoneExt ?? null,

		// ---- Office ----
		ListOfficeName: raw.ListOfficeName ?? null,
		ListOfficeKey: raw.ListOfficeKey ?? null,
		ListOfficeMlsId: raw.ListOfficeMlsId ?? null,
		ListOfficeEmail: raw.ListOfficeEmail ?? null,
		ListOfficePhone: raw.ListOfficePhone ?? null,
		ListOfficePhoneExt: raw.ListOfficePhoneExt ?? null,

		// ---- Media ----
		PhotosCount: raw.PhotosCount ? Number(raw.PhotosCount) : null,

		PhotosChangeTimestamp: raw.PhotosChangeTimestamp
			? new Date(raw.PhotosChangeTimestamp)
			: null,

		VideosCount: raw.VideosCount ? Number(raw.VideosCount) : null,

		VideosChangeTimestamp: raw.VideosChangeTimestamp
			? new Date(raw.VideosChangeTimestamp)
			: null,

		VirtualTourURLUnbranded: raw.VirtualTourURLUnbranded ?? null,

		VirtualTourURLBranded: raw.VirtualTourURLBranded ?? null,

		AllPixDownloaded: false,
		View: raw.View,
		GulfAccessYN: raw.NABOR_GulfAccessYN,
		MasterHOAFee: raw.NABOR_MasterHOAFee,
		HOAFee: raw.NABOR_HOAFee,
		HOAFeeFreq: raw.NABOR_HOAFeeFreq,
		MasterHOAFeeFreq: raw.NABOR_HOAFeeFreq,
		MandatoryHOAYN: raw.NABOR_MandatoryHOAYN,
		Description: raw.PublicRemarks,
		images: raw.Media ?? null,
		// ---- RAW ----
		raw: {
			PublicRemarks: raw.PublicRemarks ?? null,
			ExteriorFeatures: raw.ExteriorFeatures ?? null,
			InteriorFeatures: raw.InteriorFeatures ?? null,
			Appliances: raw.Appliances ?? null,
			Flooring: raw.Flooring ?? null,
			Heating: raw.Heating ?? null,
			Cooling: raw.Cooling ?? null,
			NABOR_MandatoryHOAYN: raw.NABOR_MandatoryHOAYN ?? null,
			NABOR_HOAFee: raw.NABOR_HOAFee ?? null,
			NABOR_HOAFeeFrequency: raw.NABOR_HOAFeeFrequency ?? null,
			NABOR_MasterHOAFee: raw.NABOR_MasterHOAFee ?? null,
			NABOR_MasterHOAFeeFrequency: raw.NABOR_MasterHOAFeeFrequency ?? null,
			TaxAnnualAmount: raw.TaxAnnualAmount ?? null,
			MLSAreaMajor: raw.MLSAreaMajor ?? null,
			ListOfficeName: raw.ListOfficeName ?? null,
			HighSchool: raw.HighSchool ?? null,
			MiddleSchool: raw.MiddleSchool ?? null,
			ElementarySchool: raw.ElementarySchool ?? null,
			VirtualTourThumbnail: raw.VirtualTourThumbnail ?? null,
			ParcelNumber: raw.ParcelNumber ?? null,
			CurrentUse: raw.CurrentUse ?? null,
		},
	};
}

/**
 * Helper function to safely parse dates
 */
function parseDate(
	dateString: string | null | undefined
): Date | null {
	if (!dateString) return null;
	try {
		const date = new Date(dateString);
		return isNaN(date.getTime()) ? null : date;
	} catch {
		return null;
	}
}

/**
 * Type-safe version of mapProperty with validation
 */
export function mapPropertySafe(item: any) {
	try {
		return mapProperty(item);
	} catch (error) {
		console.error("Error mapping property:", error);
		console.error("Item:", JSON.stringify(item, null, 2));
		throw error;
	}
}
