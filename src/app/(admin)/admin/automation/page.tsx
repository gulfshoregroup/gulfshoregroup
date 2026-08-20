"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Play, Pause, AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// Initial automations dataset
const initialAutomations = [
  {
    id: "AUTO001",
    name: "MLS Data Sync",
    description: "Synchronizes property data from MLS feed",
    status: "running",
    lastRun: "2024-01-15 08:30:00",
    nextRun: "2024-01-15 12:30:00",
    frequency: "Every 4 hours",
    successRate: "98.5%",
    lastResult: "success",
    recordsProcessed: 1247,
    type: "mls"
  },
  {
    id: "AUTO002",
    name: "Price Drop Notifications",
    description: "Sends notifications when property prices drop",
    status: "running",
    lastRun: "2024-01-15 09:00:00",
    nextRun: "2024-01-16 09:00:00",
    frequency: "Daily",
    successRate: "99.2%",
    lastResult: "success",
    recordsProcessed: 89,
    type: "mls"
  },
  {
    id: "AUTO003",
    name: "New Listing Alerts",
    description: "Notifies users about new property listings",
    status: "paused",
    lastRun: "2024-01-14 18:00:00",
    nextRun: "Paused",
    frequency: "Every 2 hours",
    successRate: "97.8%",
    lastResult: "error",
    recordsProcessed: 0,
    type: "mls"
  },
  {
    id: "AUTO004",
    name: "User Engagement Tracking",
    description: "Tracks user property views and interactions",
    status: "running",
    lastRun: "2024-01-15 10:15:00",
    nextRun: "2024-01-15 11:15:00",
    frequency: "Hourly",
    successRate: "99.9%",
    lastResult: "success",
    recordsProcessed: 2156,
    type: "mls"
  },
  {
    id: "AUTO005",
    name: "Market Analysis Update",
    description: "Updates market trends and property valuations",
    status: "error",
    lastRun: "2024-01-15 06:00:00",
    nextRun: "Retry in 30 min",
    frequency: "Daily",
    successRate: "94.2%",
    lastResult: "error",
    recordsProcessed: 0,
    type: "mls"
  },
  {
    id: "AUTO006",
    name: "Social Media Auto-Post",
    description: "Automatically shares new properties and price drops on Facebook & Instagram",
    status: "running",
    lastRun: "2024-01-15 10:00:00",
    nextRun: "Upon new listing detection",
    frequency: "Real-time",
    successRate: "100%",
    lastResult: "success",
    recordsProcessed: 432,
    type: "social"
  }
]

function AutomationContent() {
  const [automations, setAutomations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>({
    totalAutomations: 0,
    totalRunning: 0,
    totalIssues: 0,
    successRate: "0%",
  })
  const [runningSync, setRunningSync] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab")

  const fetchAutomations = () => {
    fetch("/api/admin/automation")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAutomations(data.list)
          setSummary({
            totalAutomations: data.totalAutomations,
            totalRunning: data.totalRunning,
            totalIssues: data.totalIssues,
            successRate: data.successRate,
          })
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchAutomations()
  }, [])

  const filteredAutomations = automations.filter((auto) => {
    if (tab === "social") return auto.type === "social";
    if (tab === "mls") return auto.type === "mls";
    return true; // Show all if no tab specified
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Toggle status handler
  const toggleStatus = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) => {
        if (auto.id === id) {
          const newStatus = auto.status === "running" ? "paused" : "running"
          toast.success(`${auto.name} ${newStatus === "running" ? "started" : "paused"} successfully!`)
          return {
            ...auto,
            status: newStatus,
            nextRun: newStatus === "paused" ? "Paused" : "Dynamic schedule active",
          }
        }
        return auto
      })
    )
  }

  // Trigger automation run simulator
  const runNow = (id: string, name: string) => {
    setRunningSync(id)
    toast.info(`Triggering ${name} immediately...`)
    
    fetch("/api/admin/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAutomations((prev) =>
            prev.map((auto) => {
              if (auto.id === id) {
                const addedRecords = Math.floor(Math.random() * 20) + 1
                return {
                  ...auto,
                  lastRun: data.runTimestamp,
                  recordsProcessed: auto.recordsProcessed + addedRecords,
                  lastResult: "success",
                  status: "running"
                }
              }
              return auto
            })
          )
          toast.success(`${name} completed successfully!`)
        } else {
          toast.error(`Failed to run ${name}`)
        }
        setRunningSync(null)
      })
      .catch((err) => {
        console.error(err)
        setRunningSync(null)
      })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse p-6">
        <div className="h-10 w-1/3 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Automation Status</h1>
        <p className="text-muted-foreground">Monitor and manage automated processes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAutomations}</div>
            <p className="text-xs text-muted-foreground">Active processes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRunning}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalIssues}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.successRate}</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Processes</CardTitle>
          <CardDescription>Current status and performance of all automated processes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Result</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{automation.name}</div>
                      <div className="text-sm text-muted-foreground">{automation.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(automation.status)}>{automation.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{automation.lastRun}</TableCell>
                  <TableCell className="text-sm">{automation.nextRun}</TableCell>
                  <TableCell className="text-sm">{automation.frequency}</TableCell>
                  <TableCell className="text-sm font-medium">{automation.successRate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getResultIcon(automation.lastResult)}
                      <span className="text-sm">{automation.lastResult}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{automation.recordsProcessed.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {automation.status === "running" ? (
                        <Button 
                          onClick={() => toggleStatus(automation.id)} 
                          size="sm" 
                          variant="outline"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => toggleStatus(automation.id)} 
                          size="sm" 
                          variant="outline"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      <Button 
                        disabled={runningSync === automation.id}
                        onClick={() => runNow(automation.id, automation.name)} 
                        size="sm" 
                        variant="outline"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${runningSync === automation.id ? "animate-spin" : ""}`} />
                        {runningSync === automation.id ? "Running..." : "Run Now"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AutomationPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground font-medium animate-pulse">Loading automation settings...</div>}>
      <AutomationContent />
    </Suspense>
  )
}
