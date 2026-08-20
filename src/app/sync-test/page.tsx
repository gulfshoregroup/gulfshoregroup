"use client";
import { useState } from "react";

export default function SyncTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  async function startSync() {
    setIsRunning(true);
    let cursor = "2026-02-03T21:01:18.997Z"; // Ruka hua cursor
    setLogs(prev => [...prev, "🚀 Auto-Sync Started..."]);
    
    while(true) {
      try {
        let url = '/api/v2/sync/full' + (cursor ? '?cursor=' + cursor : '');
        setLogs(prev => [...prev, "Fetching: " + cursor]);
        let res = await fetch(url);
        let data = await res.json();
        
        setLogs(prev => [...prev, "✅ Success! " + data.totalFetched + " properties added."]);
        
        if (data.isComplete || !data.nextCursor) {
          setLogs(prev => [...prev, "🎉 ALL DONE! Saari Properties Sync Ho Gayi!"]);
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
      <h1>Auto Sync Properties</h1>
      <p>Click the button below to automatically sync all remaining properties. Do not close this tab until it says "ALL DONE!".</p>
      
      <button 
        onClick={startSync} 
        disabled={isRunning}
        style={{ padding: "15px 30px", fontSize: 20, cursor: "pointer", background: isRunning ? "gray" : "blue", color: "white", border: "none", borderRadius: 5 }}
      >
        {isRunning ? "Sync in Progress..." : "Start Auto Sync"}
      </button>
      
      <div style={{ marginTop: 30, background: "#111", color: "#0f0", padding: 20, height: 400, overflowY: "auto", borderRadius: 5, fontFamily: "monospace" }}>
        {logs.length === 0 ? "Logs will appear here..." : logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
}
