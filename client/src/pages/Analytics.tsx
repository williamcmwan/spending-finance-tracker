import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart,
  BarChart3,
  TrendingUp,
  Calendar,
  Filter
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

// Mock data for charts
const spendingByCategory = [
  { name: "Groceries", value: 1245.50, color: "hsl(var(--category-groceries))" },
  { name: "Transport", value: 340.25, color: "hsl(var(--category-transport))" },
  { name: "Shopping", value: 890.75, color: "hsl(var(--category-shopping))" },
  { name: "Household", value: 567.30, color: "hsl(var(--category-household))" },
  { name: "Entertainment", value: 245.00, color: "hsl(var(--category-entertainment))" },
  { name: "Dining", value: 432.80, color: "hsl(var(--category-dining))" },
];

const monthlyComparison = [
  { month: "Dec 2024", groceries: 980, transport: 420, shopping: 670, dining: 380 },
  { month: "Jan 2025", groceries: 1100, transport: 380, shopping: 720, dining: 420 },
  { month: "Feb 2025", groceries: 1245, transport: 340, shopping: 890, dining: 432 },
];

const trendData = [
  { month: "Oct", income: 4800, spending: 2100, savings: 2700 },
  { month: "Nov", income: 5200, spending: 2300, savings: 2900 },
  { month: "Dec", income: 4900, spending: 2450, savings: 2450 },
  { month: "Jan", income: 5000, spending: 2200, savings: 2800 },
  { month: "Feb", income: 5000, spending: 2377, savings: 2623 },
];

export default function Analytics() {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [timeRange, setTimeRange] = useState("current_month");
  const [compareMode, setCompareMode] = useState(false);

  const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toFixed(2)} ({((data.value / totalSpending) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize your spending patterns and trends
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant={compareMode ? "default" : "outline"} 
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Compare
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold">${totalSpending.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <PieChart className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Largest Category</p>
                <p className="text-2xl font-bold">Groceries</p>
                <p className="text-sm text-muted-foreground">34.7% of spending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg per Day</p>
                <p className="text-2xl font-bold">${(totalSpending / 28).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <h3 className="font-medium">Spending by Category</h3>
            <div className="flex items-center gap-2">
              <Button
                variant={chartType === "pie" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("pie")}
              >
                <PieChart className="w-4 h-4 mr-2" />
                Pie Chart
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Bar Chart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "pie" ? (
                  <RechartsPieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                ) : (
                  <BarChart data={spendingByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spendingByCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${category.value.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {((category.value / totalSpending) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison */}
      {compareMode && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="groceries" fill="hsl(var(--category-groceries))" name="Groceries" />
                  <Bar dataKey="transport" fill="hsl(var(--category-transport))" name="Transport" />
                  <Bar dataKey="shopping" fill="hsl(var(--category-shopping))" name="Shopping" />
                  <Bar dataKey="dining" fill="hsl(var(--category-dining))" name="Dining" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--success))" name="Income" />
                <Bar dataKey="spending" fill="hsl(var(--primary))" name="Spending" />
                <Bar dataKey="savings" fill="hsl(var(--info))" name="Savings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}