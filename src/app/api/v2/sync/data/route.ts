import prisma from "@/lib/prisma";
import capitalizeWords from "@/hooks/capitalize-letter";


export async function GET() {
  try {
   const communities = await prisma.community.findMany({
    include:{
        city:true,
    },   
    
   });
    return Response.json({ success: true, communities });

  } catch (error) {
    console.error("Seed error:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}


// export async function GET() {
    
//     const uniqueCommunities = await prisma.property.findMany({
//         distinct: ["Community"],
//         select:{
//             Community: true,
//             City: true,
//         },
//         where: { Community: { not: "" } },
//         orderBy: { Community: 'asc' },
//     })

//     for (const { Community,City } of uniqueCommunities) {
//         if (!Community) continue;
//         const formattedCommunity = capitalizeWords(Community).replaceAll(
//             /\s+/g,
//             "-"
//         );
//         await prisma.community.upsert({
//           where: { name: Community },
//           update: {},
//           create: {
//             city: { connect: { name: City } },
//             name: capitalizeWords(Community),
//             slug: formattedCommunity,
// 			},
// 		});
// 	}
// 	return Response.json({ success: true });
// }