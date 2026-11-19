export interface GeneralSettings {
	siteName: string;
	contactEmail: string;
	siteUrl: string;
	shareSubject: string;
	shareBody: string;
}

const DEFAULT_SETTINGS: GeneralSettings = {
	siteName: "GULFSHORE GROUP",
	contactEmail: "mailbox@gulfshoregroup.com",
	siteUrl: "https://gulfshoregroup.com",
	shareSubject: "Check out this property!",
	shareBody: "Take a look at this property I found:",
};

let cachedSettings: GeneralSettings | null = null;
let pendingPromise: Promise<GeneralSettings> | null = null;

export async function fetchClientGeneralSettings(): Promise<GeneralSettings> {
	if (cachedSettings) return cachedSettings;
	if (pendingPromise) return pendingPromise;

	pendingPromise = fetch("/api/admin/general-settings")
		.then((res) => res.json())
		.then((data) => {
			cachedSettings = {
				siteName: data.siteName ? data.siteName.toUpperCase() : DEFAULT_SETTINGS.siteName,
				contactEmail: data.contactEmail || DEFAULT_SETTINGS.contactEmail,
				siteUrl: data.siteUrl || DEFAULT_SETTINGS.siteUrl,
				shareSubject: data.shareSubject || DEFAULT_SETTINGS.shareSubject,
				shareBody: data.shareBody || DEFAULT_SETTINGS.shareBody,
			};
			return cachedSettings;
		})
		.catch(() => DEFAULT_SETTINGS)
		.finally(() => {
			pendingPromise = null;
		});

	return pendingPromise;
}
