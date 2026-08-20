import { runSyncPass } from "../src/jobs/syncProperties";
import { fetchBridgeBatch } from "../src/lib/bridge";

async function main() {
    const lastYear = new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0];
    console.log("Starting backfill for pending since:", lastYear);
    
    await runSyncPass(
        "BridgeModificationTimestamp_Pending",
        fetchBridgeBatch,
        lastYear,
        "Pending"
    );
    
    console.log("Starting backfill for closed since:", lastYear);
    await runSyncPass(
        "BridgeModificationTimestamp_Closed",
        fetchBridgeBatch,
        lastYear,
        "Closed"
    );
    
    console.log("Backfill complete");
    process.exit(0);
}

main().catch(console.error);
