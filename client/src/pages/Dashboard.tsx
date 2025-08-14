import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  Calendar
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/integrations/api/client";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_name: string;
  category_color: string;
  source: string;
}

interface DashboardData {
  totalIncome: number;
  totalSpending: number;
  netIncome: number;
  savingsRate: number;
  transactions: Transaction[];
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalIncome: 0,
    totalSpending: 0,
    netIncome: 0,
    savingsRate: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const isPositive = type === 'income';
    const formatted = Math.abs(amount).toFixed(2);
    return isPositive ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (type: 'income' | 'expense') => {
    return type === 'income' ? "text-green-600" : "text-red-600";
  };

  const getCategoryColor = (color: string) => {
    return color || '#6B7280';
  };

  const getCategoryIcon = (iconName?: string) => {
    // For now, just return a simple div since we don't need complex icon handling in dashboard
    return () => <div className="w-3 h-3 rounded-full bg-current" />;
  };

  const getMonthRange = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  };

  const fetchDashboardData = async (date: Date) => {
    try {
      setLoading(true);
      const { start, end } = getMonthRange(date);
      
      console.log('Fetching transactions for:', start, 'to', end);
      
      const response = await apiClient.request(`/transactions?start_date=${start}&end_date=${end}&limit=1000`);
      
      console.log('API Response:', response);
      
      if (response.transactions) {
        const transactions = response.transactions || [];
        console.log('Transactions found:', transactions.length);
        
        const totalIncome = transactions.reduce((sum: number, t: Transaction) => 
          sum + (t.type === 'income' ? t.amount : 0), 0);
        const totalSpending = transactions.reduce((sum: number, t: Transaction) => 
          sum + (t.type === 'expense' ? t.amount : 0), 0);
        const netIncome = totalIncome - totalSpending;
        const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

        console.log('Calculated totals:', { totalIncome, totalSpending, netIncome, savingsRate });

        setDashboardData({
          totalIncome,
          totalSpending,
          netIncome,
          savingsRate,
          transactions: transactions // Show all transactions for the month
        });
      } else {
        console.error('API returned error:', response.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback to sample data for demonstration
      console.log('Using fallback sample data');
      setDashboardData({
        totalIncome: 5000,
        totalSpending: 3200,
        netIncome: 1800,
        savingsRate: 36,
        transactions: [
          {
            id: 1,
            date: '2025-08-15',
            description: 'Salary Deposit',
            amount: 5000,
            type: 'income',
            category_name: 'Income',
            category_color: '#10B981',
            source: 'Bank'
          },
          {
            id: 2,
            date: '2025-08-14',
            description: 'Grocery Shopping',
            amount: 150,
            type: 'expense',
            category_name: 'Food',
            category_color: '#EF4444',
            source: 'Bank'
          },
          {
            id: 3,
            date: '2025-08-13',
            description: 'Gas Station',
            amount: 45,
            type: 'expense',
            category_name: 'Transport',
            category_color: '#3B82F6',
            source: 'Bank'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  const handlePreviousMonth = () => {
    setSelectedDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => addMonths(prev, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const summaryCards = [
    {
      title: "Total Income",
      amount: formatCurrency(dashboardData.totalIncome),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Spending",
      amount: formatCurrency(dashboardData.totalSpending),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Net Income",
      amount: formatCurrency(dashboardData.netIncome),
      icon: DollarSign,
      color: dashboardData.netIncome >= 0 ? "text-green-600" : "text-red-600",
      bgColor: dashboardData.netIncome >= 0 ? "bg-green-50" : "bg-red-50"
    },
    {
      title: "Savings Rate",
      amount: formatPercentage(dashboardData.savingsRate),
      icon: PieChart,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your income and expenses
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePreviousMonth}
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCurrentMonth}
            disabled={loading}
            className="min-w-[140px]"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {format(selectedDate, 'MMMM yyyy')}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextMonth}
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((item, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.amount}</div>
              <p className="text-xs text-muted-foreground">
                {format(selectedDate, 'MMMM yyyy')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions for Selected Month */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions - {format(selectedDate, 'MMMM yyyy')} ({dashboardData.transactions.length} transactions)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading transactions...</div>
            </div>
          ) : dashboardData.transactions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No transactions found for this month</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-10">
                  <TableHead className="w-20">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-24 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="min-h-12">
                    <TableCell className="text-muted-foreground text-sm py-2 whitespace-nowrap">
                      {transaction.date}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" 
                          style={{ backgroundColor: getCategoryColor(transaction.category_color) }}
                        />
                        <div className="font-medium text-sm break-words leading-relaxed flex-1">
                          {transaction.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: getCategoryColor(transaction.category_color) }}
                        />
                        <span className="text-xs">
                          {transaction.category_name || 'Uncategorized'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium text-sm py-2 ${getAmountColor(transaction.type)}`}>
                      {formatAmount(transaction.amount, transaction.type)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}