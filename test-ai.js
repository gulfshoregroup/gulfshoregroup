require('dotenv').config();
const { generateText, tool } = require('ai');
const { openai } = require('@ai-sdk/openai');
const { z } = require('zod');

async function test() {
  const currentUrl = 'https://gulfshore-fullcode-next-production.up.railway.app/Florida-Real-Estate-Listings/Naples/Port-Royal/100-&-104-Bay-RD/226008829';
  const system = `You are an expert AI Real Estate Concierge.
CRITICAL CONTEXT: The user is currently viewing the following URL on the website: ${currentUrl}
If the user refers to "this", "this property", "here", or asks a question about distance without specifying an origin address, they are talking about the property located at ${currentUrl}. You should extract the address from the URL (e.g. from /Florida-Real-Estate-Listings/Cape-Coral/Community/123-Main-St/MLS) and use it for tools like 'calculateDistance'.

CRITICAL INSTRUCTION: When you use a tool, you MUST generate a conversational text response summarizing the result of the tool to the user. Do not just return the tool result.`;
  
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    maxSteps: 5,
    system,
    messages: [{ role: 'user', content: 'how far is this from the beach' }],
    tools: {
      calculateDistance: tool({
        description: 'Calculate driving distance and time between two locations',
        inputSchema: z.object({
          origin: z.string(),
          destination: z.string()
        }),
        execute: async (args) => {
          console.log('Tool called with args:', args);
          return { distance_miles: '1.2 miles', duration_traffic: '5 mins' };
        }
      })
    }
  });
  console.log('Response text:', result.text);
}
test().catch(console.error);
