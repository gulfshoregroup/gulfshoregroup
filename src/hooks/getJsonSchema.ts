import UrlMaker from "./url-maker";

export default function createHouseJsonLd(listing: any) {
	const baseUrl = "https://gulfshoregroup.com";

	const absoluteImageUrls: string[] = Array.isArray(
		listing.AllPixList
	)
		? listing.AllPixList.map((path: string) =>
				path.startsWith("http") ? path : baseUrl + path
		  )
		: listing.DefaultPic
		? [listing.DefaultPic]
		: [];

	const formatDate = (d: any) => {
		if (!d) return undefined;
		const dt = new Date(d);
		return isNaN(dt.getTime())
			? undefined
			: dt.toISOString().split("T")[0];
	};

	// Base URL for property page
	const propertyUrl =
		baseUrl +
		UrlMaker(
			listing.City,
			listing.Development || listing.DevelopmentName,
			listing.PropertyAddress
		);

	// 🏠 HOUSE OBJECT
	const houseObj: any = {
		"@id": "#theHouse",
		"@type": "House",
		name: listing.PropertyAddress || "Home for Sale",
		description:
			listing.PropertyInformation ||
			listing.BuildingDesc ||
			"Residential property for sale.",
		url: propertyUrl,
		image: absoluteImageUrls.length ? absoluteImageUrls : undefined,
		numberOfRooms: listing.RoomCount
			? Number(listing.RoomCount)
			: listing.BedsTotal
			? Number(listing.BedsTotal)
			: undefined,
		numberOfBathroomsTotal: listing.BathsTotal
			? Number(listing.BathsTotal)
			: undefined,
		floorSize: listing.ApproxLivingArea
			? {
					"@type": "QuantitativeValue",
					value: Number(listing.ApproxLivingArea),
					unitCode: "FTK", // square feet
			  }
			: undefined,
		address: {
			"@type": "PostalAddress",
			streetAddress: listing.PropertyAddress || undefined,
			addressLocality: listing.City || undefined,
			addressRegion: listing.StateOrProvince || undefined,
			postalCode: listing.PostalCode || undefined,
			addressCountry: "US",
		},
		petsAllowed: listing.Pets || undefined,
		telephone: "+1-239-992-9119",
		geo:
			listing?.location?.coordinates?.length === 2
				? {
						"@type": "GeoCoordinates",
						latitude: listing.location.coordinates[1],
						longitude: listing.location.coordinates[0],
				  }
				: undefined,
		amenityFeature: [
			listing.PrivatePoolYN === "Yes" || listing.PrivatePoolYN === "1"
				? {
						"@type": "LocationFeatureSpecification",
						name: "Swimming Pool",
						value: true,
				  }
				: null,
			listing.WaterfrontYN === "Yes" || listing.WaterfrontYN === "1"
				? {
						"@type": "LocationFeatureSpecification",
						name: "Waterfront",
						value: true,
				  }
				: null,
			listing.GulfAccessYN === "Yes" || listing.GulfAccessYN === "1"
				? {
						"@type": "LocationFeatureSpecification",
						name: "Gulf Access",
						value: true,
				  }
				: null,
			listing.PrivateSpaYN === "Yes" || listing.PrivateSpaYN === "1"
				? {
						"@type": "LocationFeatureSpecification",
						name: "Spa",
						value: true,
				  }
				: null,
			listing.FencedYardYN === "Yes" || listing.FencedYardYN === "1"
				? {
						"@type": "LocationFeatureSpecification",
						name: "Fenced Yard",
						value: true,
				  }
				: null,
		].filter(Boolean),
	};

	// 🏡 LISTING NODE (for Houses)
	const PropertyListingNode: any = {
		"@type": "RealEstateListing",
		datePosted: formatDate(listing.DateAdded),
		dateModified: formatDate(listing.LastChangeDate),
		availability: listing.StatusType || listing.Status || "Available",
		price: listing.CurrentPrice
			? Number(listing.CurrentPrice)
			: undefined,
		priceCurrency: "USD",
		provider: {
			"@type": "RealEstateAgent",
			name: "Dimitri Schwarz",
			url: baseUrl,
			telephone: "+1-239-992-9119",
		},
		itemOffered: { "@id": "#theHouse" },
	};

	// 🏞️ LAND OBJECT (for “Lot and Land”)
	const landObj: any = {
		"@id": "#theLand",
		"@type": "Landform",
		name: listing.PropertyAddress || "Land for Sale",
		description:
			listing.PropertyInformation ||
			listing.BuildingDesc ||
			"Vacant lot or land for sale.",
		image: absoluteImageUrls.length ? absoluteImageUrls : undefined,
		url: propertyUrl,
		address: {
			"@type": "PostalAddress",
			streetAddress: listing.PropertyAddress || undefined,
			addressLocality: listing.City || undefined,
			addressRegion: listing.StateOrProvince || "FL",
			postalCode: listing.PostalCode || undefined,
			addressCountry: "US",
		},
		geo:
			listing?.location?.coordinates?.length === 2
				? {
						"@type": "GeoCoordinates",
						latitude: listing.location.coordinates[1],
						longitude: listing.location.coordinates[0],
				  }
				: undefined,
		area:
			listing.LotSizeArea || listing.Acres
				? {
						"@type": "QuantitativeValue",
						value:
							Number(listing.LotSizeArea) ||
							Number(listing.Acres) ||
							undefined,
						unitCode: listing.LotSizeUnit || "ACR",
				  }
				: undefined,
	};

	// 🌱 LISTING NODE (for Land)
	const LandListingNode: any = {
		"@type": "RealEstateListing",
		datePosted: formatDate(listing.DateAdded),
		dateModified: formatDate(listing.LastChangeDate),
		availability: listing.StatusType || listing.Status || "Available",
		price: listing.CurrentPrice
			? Number(listing.CurrentPrice)
			: undefined,
		priceCurrency: "USD",
		provider: {
			"@type": "RealEstateAgent",
			name: "Dimitri Schwarz",
			url: baseUrl,
			telephone: "+1-239-992-9119",
			email: "mailbox@gulfshoregroup.com",
			logo: "https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289211/Dimitri-schwarz_r9ognl.jpg",
		},
		amenityFeature: [
			listing.WaterfrontYN === "Yes" || listing.WaterfrontYN === "1"
				? {
						"@type": "LocationFeatureSpecification",
						name: "Waterfront",
						value: true,
				  }
				: null,
			listing.GulfAccessYN === "Yes" || listing.GulfAccessYN === "1"
				? {
						"@type": "LocationFeatureSpecification",
						name: "Gulf Access",
						value: true,
				  }
				: null,
		].filter(Boolean),
		itemOffered: { "@id": "#theLand" },
	};

	// 🎯 Return the appropriate schema
	if (listing.PropertyType === "Lot and Land") {
		return {
			"@context": "https://schema.org",
			"@graph": [landObj, LandListingNode],
		};
	}

	return {
		"@context": "https://schema.org",
		"@graph": [houseObj, PropertyListingNode],
	};
}
