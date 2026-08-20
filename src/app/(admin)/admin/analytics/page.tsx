"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Search, Eye, Heart, MapPin, TrendingUp, Filter } from "lucide-react"

// Mock user analytics data
const userAnalytics = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    lastSeen: "2024-01-20 14:30",
    totalNotificationsSent: 15,
    lastReceived: "2024-01-20 10:15",
    notificationViewCount: 12,
    wishlistItems: 8,
    tourRequests: 2,
    viewedProperties: 45,
    searchFilters: ["2-bedroom", "downtown", "$1000-2000"],
    activityScore: 85,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    lastSeen: "2024-01-19 16:45",
    totalNotificationsSent: 23,
    lastReceived: "2024-01-19 12:30",
    notificationViewCount: 18,
    wishlistItems: 12,
    tourRequests: 1,
    viewedProperties: 67,
    searchFilters: ["3-bedroom", "suburbs", "$2000-3000"],
    activityScore: 92,
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    lastSeen: "2024-01-15 09:20",
    totalNotificationsSent: 8,
    lastReceived: "2024-01-15 08:45",
    notificationViewCount: 5,
    wishlistItems: 3,
    tourRequests: 0,
    viewedProperties: 23,
    searchFilters: ["1-bedroom", "city center"],
    activityScore: 45,
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    lastSeen: "2024-01-20 11:15",
    totalNotificationsSent: 31,
    lastReceived: "2024-01-20 09:30",
    notificationViewCount: 25,
    wishlistItems: 15,
    tourRequests: 3,
    viewedProperties: 89,
    searchFilters: ["4-bedroom", "family-friendly", "$3000+"],
    activityScore: 98,
  },
]

const activityData = [
  { name: "Mon", views: 120, searches: 45, notifications: 8 },
  { name: "Tue", views: 98, searches: 38, notifications: 12 },
  { name: "Wed", views: 156, searches: 62, notifications: 15 },
  { name: "Thu", views: 89, searches: 34, notifications: 9 },
  { name: "Fri", views: 203, searches: 78, notifications: 18 },
  { name: "Sat", views: 145, searches: 56, notifications: 14 },
  { name: "Sun", views: 167, searches: 43, notifications: 11 },
]

const engagementData = [
  { name: "High Engagement", value: 35, color: "#10b981" },
  { name: "Medium Engagement", value: 45, color: "#f59e0b" },
  { name: "Low Engagement", value: 20, color: "#ef4444" },
]

const topSearchFilters = [
  { filter: "2-bedroom", count: 245, percentage: 28 },
  { filter: "downtown", count: 198, percentage: 23 },
  { filter: "$1000-2000", count: 167, percentage: 19 },
  { filter: "parking", count: 134, percentage: 15 },
  { filter: "pet-friendly", count: 89, percentage: 10 },
  { filter: "furnished", count: 45, percentage: 5 },
]

export default function AnalyticsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("7d")
  const [selectedUser, setSelectedUser] = useState<number | null>(null)

  const filteredUsers = userAnalytics.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getActivityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const totalViews = userAnalytics.reduce((sum, u) => sum + u.viewedProperties, 0)
  const totalWishlist = userAnalytics.reduce((sum, u) => sum + u.wishlistItems, 0)
  const totalTours = userAnalytics.reduce((sum, u) => sum + u.tourRequests, 0)
  const avgActivityScore = userAnalytics.reduce((sum, u) => sum + u.activityScore, 0) / userAnalytics.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Analytics</h1>
          <p className="text-muted-foreground mt-2">Detailed insights into user behavior and engagement</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Advanced Filter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Property Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalViews}</div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +15.2%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalWishlist}</div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +8.7%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Tour Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalTours}</div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +22.1%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Activity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{avgActivityScore.toFixed(0)}</div>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +5.3%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Details</TabsTrigger>
          <TabsTrigger value="search">Search Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>User activity trends over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Property Views" />
                    <Line type="monotone" dataKey="searches" stroke="#10b981" name="Searches" />
                    <Line type="monotone" dataKey="notifications" stroke="#f59e0b" name="Notifications" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Distribution of user engagement levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics Details</CardTitle>
              <CardDescription>Comprehensive user behavior and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Property Views</TableHead>
                    <TableHead className="text-right">Wishlist</TableHead>
                    <TableHead className="text-right">Tours</TableHead>
                    <TableHead className="text-right">Notifications</TableHead>
                    <TableHead className="text-right">Activity Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.lastSeen}</TableCell>
                      <TableCell className="text-right">{user.viewedProperties}</TableCell>
                      <TableCell className="text-right">{user.wishlistItems}</TableCell>
                      <TableCell className="text-right">{user.tourRequests}</TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          <div>Sent: {user.totalNotificationsSent}</div>
                          <div>Viewed: {user.notificationViewCount}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${getActivityColor(user.activityScore)}`}>
                          {user.activityScore}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Filter Analytics</CardTitle>
              <CardDescription>Most popular search filters and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSearchFilters.map((filter, index) => (
                  <div
                    key={filter.filter}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{filter.filter}</div>
                        <div className="text-sm text-muted-foreground">{filter.count} searches</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${filter.percentage}%` }} />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{filter.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
