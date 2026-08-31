import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

const campaigns = [
  {
    name: 'Day 1: Welcome to GULFSHORE Group',
    daysAfterSignup: 1,
    channel: 'email',
    messageTemplate: `Welcome to GULFSHORE Group

Welcome to GULFSHORE Group, your trusted source for Southwest Florida real estate.
Whether you’re looking to buy, sell, or invest, our experienced team is here to help you navigate the market with confidence. We specialize in properties throughout Naples, Bonita Springs, Estero, Fort Myers, and surrounding Southwest Florida communities.
With decades of experience and a deep understanding of the local market, we provide personalized service, local expertise, and the tools you need to make informed real estate decisions.
Explore Southwest Florida. Discover your next home. Let GULFSHORE Group help you get there.`
  },
  {
    name: 'Day 3: Exploring Communities',
    daysAfterSignup: 3,
    channel: 'email',
    messageTemplate: `Hi! 👋 Just checking in from GULFSHORE Group.

Have you had a chance to explore some of the communities and homes in Southwest Florida?
Whether you’re actively looking to buy or simply keeping an eye on the market, we’re here to help you find the right area and the right property for your needs.
🏡 Explore homes, communities, and local market information anytime.
If there’s a particular city, community, price range, or type of home you’re interested in, let us know—we’d be happy to point you in the right direction.

GULFSHORE Group — Your Southwest Florida Real Estate Experts`
  },
  {
    name: 'Day 5: Financing Follow-Up',
    daysAfterSignup: 5,
    channel: 'email',
    messageTemplate: `Day 5 – Financing Follow-Up

Hi! 👋 Just following up from GULFSHORE Group.
As you continue exploring homes and communities in Southwest Florida, have you already secured financing or been pre-approved for a mortgage?
If you haven’t, no problem. Getting pre-approved can help you understand your budget and make your home search much easier.
If you’d like, we can help connect you with a trusted local lender to discuss your options—whether you’re a first-time buyer, moving to Florida, or looking for an investment property.
🏡 Once you know your buying power, we can help you find the right property to match it.

Let us know where you are in the process, and we’ll be happy to help!
GULFSHORE Group — Your Southwest Florida Real Estate Experts`
  },
  {
    name: 'Day 7: Just Checking In',
    daysAfterSignup: 7,
    channel: 'email',
    messageTemplate: `Day 7 – Just Checking In

Hi! 👋 It’s GULFSHORE Group, just checking in.
By now, you’ve had a chance to explore some homes and communities in Southwest Florida. Have you found anything that caught your eye? 🏡
If you’re still searching, we can help narrow things down based on what matters most to you—location, price, community, or type of home.
And if your plans have changed, that’s okay too. Just let us know what you’re looking for, and we’ll make sure you’re getting the right information.

What area or type of property are you most interested in right now?
— GULFSHORE Group
Your Southwest Florida Real Estate Experts`
  },
  {
    name: 'Day 14: Let’s Narrow It Down',
    daysAfterSignup: 14,
    channel: 'email',
    messageTemplate: `Day 14 – Let’s Narrow It Down

Hi! 👋 It’s GULFSHORE Group checking in.
You’ve had a couple of weeks to explore Southwest Florida real estate. By now, you may have a better idea of what you like—and what you don’t.
🏡 Are you getting closer to finding the right home or community?
If you tell us your preferred area, price range, and type of property, we can help narrow your search and make it easier to find properties that fit what you’re looking for.
And if you’re not ready to buy yet, that’s perfectly fine. We’re happy to keep you informed about the market and new opportunities.

What are you looking for right now?
— GULFSHORE Group
Your Southwest Florida Real Estate Experts`
  },
  {
    name: 'Day 30: One Month Check-In',
    daysAfterSignup: 30,
    channel: 'email',
    messageTemplate: `Day 30 – One Month Check-In

Hi! 👋 It’s GULFSHORE Group checking in.
It’s been about a month since you started exploring Southwest Florida real estate with us. 🏡
We wanted to see where things stand. Are you still considering a move or investment in Southwest Florida?
If you’re still looking, we can help you:
 • Find the right community
 • Narrow down homes that fit your budget
 • Keep you updated on new listings and opportunities
 • Connect you with the right professionals when you’re ready

If your plans have changed, just let us know—we’re here whenever the timing is right.

What’s your biggest priority right now: finding the right home, finding the right community, or getting the best price?
— GULFSHORE Group
Your Southwest Florida Real Estate Experts`
  },
  {
    name: 'Day 60: Still Looking?',
    daysAfterSignup: 60,
    channel: 'email',
    messageTemplate: `Day 60 – Still Looking?

Hi! 👋 It’s GULFSHORE Group checking in.
It’s been about 60 days since you started exploring Southwest Florida real estate with us. We wanted to see if your plans are still moving forward. 🏡
Are you still considering buying or investing in Southwest Florida?
The market changes every day, and new homes and opportunities become available regularly. If you’re still looking, we can help you focus on the areas and properties that make the most sense for you.

If your plans have been delayed, that’s completely okay—we can stay in touch and keep you informed until the timing is right.

Just reply and let us know where you are in your search. We’re here when you’re ready.
— GULFSHORE Group
Your Southwest Florida Real Estate Experts`
  }
];

export async function GET(req: Request) {
  try {
    let createdCount = 0;
    let updatedCount = 0;

    for (const campaign of campaigns) {
      const existing = await prisma.dripCampaign.findFirst({
        where: { daysAfterSignup: campaign.daysAfterSignup }
      });

      if (existing) {
        await prisma.dripCampaign.update({
          where: { id: existing.id },
          data: {
            name: campaign.name,
            messageTemplate: campaign.messageTemplate,
            channel: campaign.channel
          }
        });
        updatedCount++;
      } else {
        await prisma.dripCampaign.create({
          data: {
            id: uuidv4(),
            name: campaign.name,
            channel: campaign.channel,
            daysAfterSignup: campaign.daysAfterSignup,
            messageTemplate: campaign.messageTemplate,
            status: 'active'
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: \`Successfully seeded drip campaigns! Created: \${createdCount}, Updated: \${updatedCount}\`
    });
  } catch (error: any) {
    console.error("Error seeding drip campaigns:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
