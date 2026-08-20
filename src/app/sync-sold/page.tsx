"use client";
import { useState } from "react";

export default function SyncSold() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  async function startSync() {
    setIsRunning(true);
    // User requested starting from Aug 8, 2025 for 1 year worth of data
    let cursor = "2025-08-08T00:00:00.000Z"; 
    setLogs(prev => [...prev, "🚀 Auto-Sync Started for SOLD (Closed) properties (Last 1 Year)..."]);
    
    while(true) {
      try {
        let url = '/api/v2/sync/full?status=Closed' + (cursor ? '&cursor=' + cursor : '');
        setLogs(prev => [...prev, "Fetching: " + cursor]);
        let res = await fetch(url);
        let data = await res.json();
        
        setLogs(prev => [...prev, "✅ Success! " + data.totalFetched + " properties added."]);
        
        if (data.isComplete || !data.nextCursor) {
          setLogs(prev => [...prev, "🎉 ALL DONE! 1 Year Sold Properties Sync Ho Gayi!"]);
          break;
        }
        cursor = data.nextCursor;
        
      } catch (e) {
        setLogs(prev => [...prev, "Kuch issue aaya, 5 second baad dobara try kar raha hai..."]);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    setIsRunning(false);
  }

  return (
    <div style={{ padding: 50, fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#e91e63" }}>Auto Sync SOLD Properties (1 Year)</h1>
      <p>Click the button below to automatically sync SOLD (Closed) properties starting from August 8, 2025.</p>
      
      <button 
        onClick={startSync} 
        disabled={isRunning}
        style={{ padding: "15px 30px", fontSize: 20, cursor: "pointer", background: isRunning ? "gray" : "#e91e63", color: "white", border: "none", borderRadius: 5 }}
      >
        {isRunning ? "Sync in Progress..." : "Start Auto Sync (Sold - 1 Year)"}
      </button>
      
      <div style={{ marginTop: 30, background: "#111", color: "#0f0", padding: 20, height: 400, overflowY: "auto", borderRadius: 5, fontFamily: "monospace" }}>
        {logs.length === 0 ? "Logs will appear here..." : logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
}
