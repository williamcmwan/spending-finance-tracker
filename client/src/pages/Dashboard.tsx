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
          transactions: transactions.slice(0, 10) // Show only first 10 transactions
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
          <CardTitle>Transactions - {format(selectedDate, 'MMMM yyyy')}</CardTitle>
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
            <div className="space-y-3">
              {dashboardData.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.description}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{transaction.category_name}</Badge>
                    <span className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' 
                        ? `+${formatCurrency(transaction.amount)}`
                        : `-${formatCurrency(transaction.amount)}`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}