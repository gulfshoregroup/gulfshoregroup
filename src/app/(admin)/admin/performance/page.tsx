"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown, MousePointer, Users, Mail, MessageSquare, Phone, Facebook, Instagram, Linkedin, Share2, Building2 } from "lucide-react"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"

// Mock performance data
const performanceData = [
  {
    id: 1,
    title: "Weekly Product Updates",
    type: "New Updates",
    channel: "Email",
    sentAt: "2024-01-15 10:00 AM",
    totalReceivers: 1250,
    clicks: 342,
    clickRate: 27.4,
    openRate: 68.2,
    deliveryRate: 98.5,
  },
  {
    id: 2,
    title: "Welcome to Our Platform",
    type: "Welcome",
    channel: "WhatsApp",
    sentAt: "2024-01-16 09:00 AM",
    totalReceivers: 45,
    clicks: 38,
    clickRate: 84.4,
    openRate: 95.6,
    deliveryRate: 100,
  },
  {
    id: 3,
    title: "Flash Sale Alert",
    type: "Price Drop",
    channel: "Text",
    sentAt: "2024-01-17 02:00 PM",
    totalReceivers: 890,
    clicks: 156,
    clickRate: 17.5,
    openRate: 89.2,
    deliveryRate: 97.8,
  },
  {
    id: 4,
    title: "Monthly Report Due",
    type: "Reminders",
    channel: "Email",
    sentAt: "2024-01-18 08:00 AM",
    totalReceivers: 12,
    clicks: 11,
    clickRate: 91.7,
    openRate: 100,
    deliveryRate: 100,
  },
]

// Mock social media performance data
const socialPerformanceData = [
  {
    id: 1,
    title: "Beautiful New Naples Listing",
    type: "New Listings",
    channel: "Facebook",
    sentAt: "2024-01-15 10:00 AM",
    totalReceivers: 4500, // Reach
    clicks: 684,
    clickRate: 15.2,
    openRate: 45.3, // Engagement Rate
    deliveryRate: 100,
  },
  {
    id: 2,
    title: "Price Drop Alert on Waterfront Villa",
    type: "Price Drop",
    channel: "Instagram",
    sentAt: "2024-01-16 09:00 AM",
    totalReceivers: 8200,
    clicks: 1240,
    clickRate: 15.1,
    openRate: 68.4,
    deliveryRate: 100,
  },
  {
    id: 3,
    title: "Market Report: SW Florida Real Estate",
    type: "Market Trends",
    channel: "LinkedIn",
    sentAt: "2024-01-17 02:00 PM",
    totalReceivers: 1200,
    clicks: 180,
    clickRate: 15.0,
    openRate: 35.5,
    deliveryRate: 100,
  },
]

const chartData = [
  { name: "Mon", clicks: 120, opens: 340 },
  { name: "Tue", clicks: 98, opens: 280 },
  { name: "Wed", clicks: 156, opens: 420 },
  { name: "Thu", clicks: 89, opens: 250 },
  { name: "Fri", clicks: 203, opens: 480 },
  { name: "Sat", clicks: 145, opens: 380 },
  { name: "Sun", clicks: 167, opens: 390 },
]

const channelData = [
  { name: "Email", value: 65, color: "#3b82f6" },
  { name: "WhatsApp", value: 25, color: "#10b981" },
  { name: "Text", value: 10, color: "#f59e0b" },
]

const socialChannelData = [
  { name: "Facebook", value: 55, color: "#1877f2" },
  { name: "Instagram", value: 30, color: "#e1306c" },
  { name: "LinkedIn", value: 15, color: "#0077b5" },
]

const typeData = [
  { name: "New Updates", value: 35, color: "#8b5cf6" },
  { name: "Welcome", value: 20, color: "#10b981" },
  { name: "Price Drop", value: 25, color: "#ef4444" },
  { name: "Reminders", value: 15, color: "#f59e0b" },
  { name: "New User", value: 5, color: "#3b82f6" },
]

function PerformanceContent() {
  const [timeFilter, setTimeFilter] = useState("7d")
  const [channelFilter, setChannelFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)

  const searchParams = useSearchParams()
  const tab = searchParams.get("tab")
  const isSocial = tab === "social"

  useEffect(() => {
    setLoading(true)
    fetch("/api/admin/performance")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "Email":
        return <Mail className="h-4 w-4 text-blue-500" />
      case "WhatsApp":
        return <Phone className="h-4 w-4 text-green-500" />
      case "Text":
        return <MessageSquare className="h-4 w-4 text-amber-500" />
      case "Facebook":
        return <Facebook className="h-4 w-4 text-blue-600" />
      case "Instagram":
        return <Instagram className="h-4 w-4 text-pink-600" />
      case "LinkedIn":
        return <Linkedin className="h-4 w-4 text-blue-700" />
      default:
        return <Share2 className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "New Updates":
      case "New Listings":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "Welcome":
      case "Market Trends":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Price Drop":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "Reminders":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "New User":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
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
        <div className="grid grid-cols-2 gap-6">
          <div className="h-72 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-72 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Extract metrics based on selected tab
  const propMetrics = metrics?.properties
  const socialMetrics = metrics?.social
  const isProperties = tab === "properties" || !isSocial

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            {isSocial ? (
              <>📱 Social Media Campaign Analytics</>
            ) : (
              <>🏠 Property Performance Analytics</>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSocial 
              ? "Track post reach, clicks, and engagement metrics across social networks" 
              : "Track active listing inventory, buyer tour requests, and property performance analytics"}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      {isProperties ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Active Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {propMetrics?.activeProperties?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Live active listings on website</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointer className="h-4 w-4 text-blue-600" />
                Total Tour Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {propMetrics?.totalTours?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Property visits requested by buyers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Total CRM Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {propMetrics?.totalLeads?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Buyers & sellers in database</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Total Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {propMetrics?.totalProperties?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">MLS & custom listings stored</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{(socialMetrics?.totalClicks || 0).toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12.5%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{(socialMetrics?.reach || 0).toLocaleString()}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                +8.2%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Click Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{socialMetrics?.clickRate || 0}%</div>
              <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                <TrendingDown className="h-3 w-3" />
                -2.1%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Avg Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{socialMetrics?.avgEngagement || "0.0%"}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                +5.3%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isProperties ? "Active Property Inventory & Performance" : "Social Media Post Clicks & Reach"}
          </CardTitle>
          <CardDescription>
            {isProperties
              ? "Live property listings in database with price, specs, and status"
              : "Individual social media post clicks and estimated reach logged"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProperties ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">MLS / ID</TableHead>
                  <TableHead>Property Address</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Specs</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(propMetrics?.list || []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        #{String(item.mlsId).slice(-8)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {item.address}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      {item.price}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      🛏️ {item.beds} bd | 🛁 {item.baths} ba | 📐 {item.sqft}
                    </TableCell>
                    <TableCell className="font-medium text-xs">{item.city}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs">
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`/admin/properties?search=${encodeURIComponent(item.mlsId)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        View Listing ↗️
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Last Clicked</TableHead>
                  <TableHead className="text-right">Estimated Reach</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(socialMetrics?.list || []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChannelIcon(item.channel)}
                        {item.channel}
                      </div>
                    </TableCell>
                    <TableCell>{item.sentAt}</TableCell>
                    <TableCell className="text-right">{item.totalReceivers.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">
                      {item.clickRate}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Active
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground font-medium animate-pulse">Loading performance metrics...</div>}>
      <PerformanceContent />
    </Suspense>
  )
}
