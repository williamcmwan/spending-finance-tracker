import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";

const summaryData = [
  {
    title: "Total Income",
    amount: "$5,000.00",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: TrendingUp,
    color: "text-success",
  },
  {
    title: "Total Spending",
    amount: "$2,377.75",
    change: "-8.2%",
    changeType: "positive" as const,
    icon: TrendingDown,
    color: "text-foreground",
  },
  {
    title: "Net Income",
    amount: "$2,622.25",
    change: "+15.3%",
    changeType: "positive" as const,
    icon: DollarSign,
    color: "text-success",
  },
  {
    title: "Savings Rate",
    amount: "52.4%",
    change: "+5.1%",
    changeType: "positive" as const,
    icon: PieChart,
    color: "text-info",
  },
];

export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryData.map((item, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.amount}</div>
            <p className="text-xs text-muted-foreground">
              <span className={item.changeType === 'positive' ? 'text-success' : 'text-destructive'}>
                {item.change}
              </span>{' '}
              from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}