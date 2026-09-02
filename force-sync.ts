import { syncTodaysActiveProperties } from './src/jobs/syncProperties';

async function main() {
  console.log("Running force sync...");
  await syncTodaysActiveProperties({ count: 1000, forceAll: true });
  console.log("Force sync completed.");
}

main().catch(console.error);
