import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/search",
          "/properties/",
        ],
      },
    ],
      sitemap: "https://gulfshoregroup.com/sitemap.xml",
      host:"gulfshoregroup.com"
  };
}
