import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  Calendar as CalendarIcon,
  Tag,
  Home,
  Car,
  ShoppingBag,
  Film,
  Heart,
  Zap,
  Book,
  Briefcase,
  TrendingUp as TrendingUpIcon,
  Utensils,
  Coffee,
  ShoppingCart,
  Wrench,
  Fuel,
  ParkingCircle,
  Shirt,
  Sofa,
  BookOpen,
  PenTool,
  Gift,
  Plane,
  Stethoscope,
  Pill,
  Shield,
  FileText,
  Building,
  Trees,
  Package,
  Repeat,
  Mail,
  Truck,
  Tv,
  Smartphone,
  Sun,
  GraduationCap,
  Baby,
  CircleDot,
  HelpCircle,
  CreditCard,
  Camera,
  Music,
  Trophy,
  Dumbbell,
  Droplets,
  Flame,
  Thermometer,
  Snowflake,
  Wifi,
  Phone,
  Bitcoin,
  Bed,
  MapPin,
  Monitor,
  Footprints,
  Gem,
  Sparkles,
  Fish,
  Gamepad2,
  Play,
  Scissors,
  Hand,
  Palette,
  Target,
  Scale,
  Megaphone,
  Calculator,
  Server,
  Globe,
  Key,
  Cloud,
  HardDrive,
  Clock,
  Star,
  AlertTriangle,
  Bus,
  Train,
  Settings,
  RotateCcw,
  Cpu,
  MoreHorizontal
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { apiClient } from "@/integrations/api/client";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, subDays, addDays, isWithinInterval, parseISO, startOfYear, endOfYear } from "date-fns";

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_name: string;
  category_color: string;
  category_icon?: string;
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
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalIncome: 0,
    totalSpending: 0,
    netIncome: 0,
    savingsRate: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [transactionPage, setTransactionPage] = useState(1);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTransactionRef = useRef<HTMLTableRowElement | null>(null);

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
    const iconMap: Record<string, any> = {
      // Basic icons
      'tag': Tag,
      'home': Home,
      'car': Car,
      'shopping-bag': ShoppingBag,
      'film': Film,
      'golf': Trophy, // Map 'golf' to 'Trophy' icon since no golf icon exists
      'heart': Heart,
      'zap': Zap,
      'book': Book,
      'dollar-sign': DollarSign,
      'briefcase': Briefcase,
      'trending-up': TrendingUpIcon,
      'more-horizontal': MoreHorizontal,
      
      // Food & Dining
      'utensils': Utensils,
      'coffee': Coffee,
      'shopping-cart': ShoppingCart,
      
      // Transportation
      'wrench': Wrench,
      'fuel': Fuel,
      'parking-circle': ParkingCircle,
      'plane': Plane,
      
      // Shopping & Retail
      'shirt': Shirt,
      'sofa': Sofa,
      'book-open': BookOpen,
      'pen-tool': PenTool,
      'gift': Gift,
      
      // Health & Medical
      'stethoscope': Stethoscope,
      'pill': Pill,
      
      // Home & Utilities
      'shield': Shield,
      'file-text': FileText,
      'building': Building,
      'trees': Trees,
      'tree': Trees, // Map 'tree' to 'Trees' icon
      
      // Business & Work
      'package': Package,
      'repeat': Repeat,
      
      // Services
      'mail': Mail,
      'truck': Truck,
      'tv': Tv,
      
      // Technology & Communication
      'smartphone': Smartphone,
      
      // Energy & Environment
      'sun': Sun,
      
      // Education & Family
      'graduation-cap': GraduationCap,
      'baby': Baby,
      
      // Other
      'circle-dot': CircleDot,
      'help-circle': HelpCircle,
      'credit-card': CreditCard,
      
      // Additional icons for variety
      'camera': Camera,
      'music': Music,
      'trophy': Trophy,
      'dumbbell': Dumbbell,
      'droplets': Droplets,
      'flame': Flame,
      'thermometer': Thermometer,
      'snowflake': Snowflake,
      'wifi': Wifi,
      'phone': Phone,
      'bitcoin': Bitcoin,
      'bed': Bed,
      'map-pin': MapPin,
      'monitor': Monitor,
      'footprints': Footprints,
      'gem': Gem,
      'sparkles': Sparkles,
      'fish': Fish,
      'gamepad-2': Gamepad2,
      'play': Play,
      'scissors': Scissors,
      'hand': Hand,
      'palette': Palette,
      'target': Target,
      'scale': Scale,
      'megaphone': Megaphone,
      'calculator': Calculator,
      'server': Server,
      'globe': Globe,
      'key': Key,
      'cloud': Cloud,
      'hard-drive': HardDrive,
      'clock': Clock,
      'star': Star,
      'alert-triangle': AlertTriangle,
      'bus': Bus,
      'train': Train,
      'settings': Settings,
      'rotate-ccw': RotateCcw,
      'cpu': Cpu
    };
    return iconMap[iconName || 'tag'] || Tag;
  };

  const getDateRange = (range: { from: Date; to: Date }) => {
    return {
      start: format(range.from, 'yyyy-MM-dd'),
      end: format(range.to, 'yyyy-MM-dd')
    };
  };

  const fetchSummaryData = async (range: { from: Date; to: Date }) => {
    try {
      setLoading(true);
      const { start, end } = getDateRange(range);
      
      console.log('Fetching summary data for:', start, 'to', end);
      
      // Fetch all transactions for summary calculations (no pagination needed for summary)
      const response = await apiClient.request(`/transactions?start_date=${start}&end_date=${end}&limit=999999`);
      
      console.log('Summary API Response:', response);
      
      if (response.transactions) {
        const transactions = response.transactions || [];
        console.log('Transactions found for summary:', transactions.length);
        
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
          transactions: [] // Don't store all transactions here, use lazy loading
        });
      } else {
        console.error('API returned error:', response.error);
      }
    } catch (error) {
      console.error('Error fetching summary data:', error);
      
      // Fallback to sample data for demonstration
      console.log('Using fallback sample data');
      setDashboardData({
        totalIncome: 5000,
        totalSpending: 3200,
        netIncome: 1800,
        savingsRate: 36,
        transactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (range: { from: Date; to: Date }, page: number = 1, reset: boolean = false) => {
    try {
      if (page === 1 || reset) {
        setTransactionsLoading(true);
      }
      
      const { start, end } = getDateRange(range);
      const limit = 50; // Load 50 transactions at a time
      
      console.log('Fetching transactions page:', page, 'for:', start, 'to', end);
      
      const response = await apiClient.request(`/transactions?start_date=${start}&end_date=${end}&limit=${limit}&page=${page}`);
      
      console.log('Transactions API Response:', response);
      
      if (response.transactions) {
        const newTransactions = response.transactions || [];
        console.log('New transactions loaded:', newTransactions.length);
        
        if (reset || page === 1) {
          setAllTransactions(newTransactions);
        } else {
          setAllTransactions(prev => [...prev, ...newTransactions]);
        }
        
        // Check if there are more transactions to load
        const hasMore = response.pagination && response.pagination.page < response.pagination.pages;
        setHasMoreTransactions(hasMore);
        
        console.log('Has more transactions:', hasMore);
      } else {
        console.error('Transactions API returned error:', response.error);
        setHasMoreTransactions(false);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setHasMoreTransactions(false);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    // Reset pagination when date range changes
    setTransactionPage(1);
    setAllTransactions([]);
    setHasMoreTransactions(true);
    
    // Fetch summary data and initial transactions
    fetchSummaryData(dateRange);
    fetchTransactions(dateRange, 1, true);
  }, [dateRange]);

  // Intersection Observer for lazy loading
  const lastTransactionElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (transactionsLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreTransactions) {
        console.log('Loading more transactions...');
        setTransactionPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchTransactions(dateRange, nextPage, false);
          return nextPage;
        });
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [transactionsLoading, hasMoreTransactions, dateRange]);

  const handlePreviousMonth = () => {
    setDateRange(prev => ({
      from: subMonths(prev.from, 1),
      to: subMonths(prev.to, 1)
    }));
  };

  const handleNextMonth = () => {
    setDateRange(prev => ({
      from: addMonths(prev.from, 1),
      to: addMonths(prev.to, 1)
    }));
  };

  const handleCurrentMonth = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    });
  };

  const handleLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    setDateRange({
      from: startOfMonth(lastMonth),
      to: endOfMonth(lastMonth)
    });
  };

  const handleLast3Months = () => {
    const lastMonth = subMonths(new Date(), 1);
    const threeMonthsAgo = subMonths(lastMonth, 2);
    setDateRange({
      from: startOfMonth(threeMonthsAgo),
      to: endOfMonth(lastMonth)
    });
  };

  const handleLast6Months = () => {
    const lastMonth = subMonths(new Date(), 1);
    const sixMonthsAgo = subMonths(lastMonth, 5);
    setDateRange({
      from: startOfMonth(sixMonthsAgo),
      to: endOfMonth(lastMonth)
    });
  };

  const handleLast12Months = () => {
    const lastMonth = subMonths(new Date(), 1);
    const twelveMonthsAgo = subMonths(lastMonth, 11);
    setDateRange({
      from: startOfMonth(twelveMonthsAgo),
      to: endOfMonth(lastMonth)
    });
  };

  const handleThisYear = () => {
    setDateRange({
      from: startOfYear(new Date()),
      to: endOfYear(new Date())
    });
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
          
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={loading}
                  className="min-w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-3 bg-white border shadow-xl" 
                align="end" 
                sideOffset={8}
                side="bottom"
              >
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      setDateRange(range);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextMonth}
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={loading}
                className="ml-2"
              >
                Quick Select
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCurrentMonth}>
                This Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLastMonth}>
                Last Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLast3Months}>
                Last 3 Months
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLast6Months}>
                Last 6 Months
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLast12Months}>
                Last 12 Months
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleThisYear}>
                This Year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                ) : (
                  'Select date range'
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions for Selected Month */}
      <Card>
        <CardHeader>
          <CardTitle>
          Transactions - {dateRange.from && dateRange.to ? (
            `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
          ) : (
            'Select date range'
          )} ({allTransactions.length} transactions{hasMoreTransactions ? '+' : ''})
        </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading summary...</div>
            </div>
          ) : allTransactions.length === 0 && !transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No transactions found for this period</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-10">
                  <TableHead className="w-20">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead className="w-24">Source</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-24 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction, index) => {
                    const isLast = index === allTransactions.length - 1;
                    return (
                      <TableRow 
                        key={transaction.id} 
                        className="min-h-12"
                        ref={isLast ? lastTransactionElementRef : null}
                      >
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
                            {transaction.category_icon ? (
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const IconComponent = getCategoryIcon(transaction.category_icon);
                                  return <IconComponent className="w-3 h-3" style={{ color: getCategoryColor(transaction.category_color) }} />;
                                })()}
                                <span className="text-xs">
                                  {transaction.category_name || 'Uncategorized'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div 
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: getCategoryColor(transaction.category_color) }}
                                />
                                <span className="text-xs">
                                  {transaction.category_name || 'Uncategorized'}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-sm text-muted-foreground">
                            {transaction.source || 'Manual Entry'}
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
                    );
                  })}
                  {transactionsLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="text-muted-foreground">Loading more transactions...</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}