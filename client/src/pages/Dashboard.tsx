import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getCurrencySymbol, formatAmountWithCurrency } from "@/utils/currency";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Building,
  ArrowUp,
  ArrowDown, 
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { apiClient } from "@/integrations/api/client";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, subDays, addDays, isWithinInterval, parseISO, startOfYear, endOfYear } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'capex';
  category_name: string;
  category_color: string;
  category_icon?: string;
  category_is_once_off?: boolean;
  source: string;
}

interface CategorySpending {
  category_name: string;
  category_color: string;
  category_icon?: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

interface MonthlyCategorySpending {
  category_name: string;
  category_color: string;
  category_icon?: string;
  monthly_amounts: {
    [monthKey: string]: {
      amount: number;
      change_percentage?: number;
      change_direction?: 'up' | 'down' | 'same';
    };
  };
}

interface MonthlySpendingData {
  month: string;
  [categoryName: string]: number | string;
}

interface ChartCategoryData {
  name: string;
  color: string;
  total: number;
}

interface DashboardData {
  totalIncome: number;
  totalSpending: number;
  totalCapex: number;
  netIncome: number;
  savingsRate: number;
  transactions: Transaction[];
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>(() => {
    const lastMonth = subMonths(new Date(), 1);
    const sixMonthsAgo = subMonths(lastMonth, 5);
    return {
      from: startOfMonth(sixMonthsAgo),
      to: endOfMonth(lastMonth)
    };
  });
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalIncome: 0,
    totalSpending: 0,
    totalCapex: 0,
    netIncome: 0,
    savingsRate: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [transactionPage, setTransactionPage] = useState(1);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalTransactionCount, setTotalTransactionCount] = useState(0);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyCategorySpending, setMonthlyCategorySpending] = useState<MonthlyCategorySpending[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlySpendingData[]>([]);
  const [chartCategories, setChartCategories] = useState<ChartCategoryData[]>([]);
  const [selectedCategoryCount, setSelectedCategoryCount] = useState<string>("5");
  const [currentMonthPage, setCurrentMonthPage] = useState(0);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [showOnlyRegularCategories, setShowOnlyRegularCategories] = useState<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTransactionRef = useRef<HTMLTableRowElement | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency
    }).format(amount);
  };

  // Helper function to get months for current page
  const getCurrentMonths = () => {
    if (monthlyCategorySpending.length === 0) return [];

    const allMonths = Object.keys(monthlyCategorySpending[0].monthly_amounts);
    const isMobile = window.innerWidth < 768; // md breakpoint
    const monthsPerPage = isMobile ? 3 : 8;
    const startIndex = currentMonthPage * monthsPerPage;
    const endIndex = startIndex + monthsPerPage;
    return allMonths.slice(startIndex, endIndex);
  };

  // Helper function to get total number of month pages
  const getTotalMonthPages = () => {
    if (monthlyCategorySpending.length === 0) return 0;
    const allMonths = Object.keys(monthlyCategorySpending[0].monthly_amounts);
    const isMobile = window.innerWidth < 768; // md breakpoint
    const monthsPerPage = isMobile ? 3 : 8;
    return Math.ceil(allMonths.length / monthsPerPage);
  };

  // Initialize to last page when data loads
  useEffect(() => {
    if (monthlyCategorySpending.length > 0) {
      const totalPages = getTotalMonthPages();
      if (totalPages > 0) {
        setCurrentMonthPage(totalPages - 1);
      }
    }
  }, [monthlyCategorySpending]);

  // Navigation functions
  const goToPreviousMonths = () => {
    setCurrentMonthPage(prev => Math.max(0, prev - 1));
  };

  const goToNextMonths = () => {
    setCurrentMonthPage(prev => Math.min(getTotalMonthPages() - 1, prev + 1));
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatAmount = (amount: number, type: 'income' | 'expense' | 'capex') => {
    return formatAmountWithCurrency(amount, baseCurrency, type);
  };

  const getAmountColor = (type: 'income' | 'expense' | 'capex') => {
    if (type === 'income') return "text-green-600";
    if (type === 'capex') return "text-blue-600";
    return "text-red-600";
  };

  // Helper function to brighten colors for dark mode
  const brightenColor = (hex: string, percent: number = 40): string => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Brighten by increasing each component toward 255
    const brighten = (component: number) => {
      return Math.min(255, Math.round(component + (255 - component) * (percent / 100)));
    };

    const newR = brighten(r);
    const newG = brighten(g);
    const newB = brighten(b);

    // Convert back to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  };

  const getCategoryColor = (color: string, brightenForDarkMode: boolean = false) => {
    const baseColor = color || '#6B7280';

    // If brighten is requested, check if we're in dark mode
    if (brightenForDarkMode) {
      // Check if dark mode is active
      const isDarkMode = document.documentElement.classList.contains('dark');
      if (isDarkMode) {
        return brightenColor(baseColor);
      }
    }

    return baseColor;
  };

  const getCategoryDisplayText = (count: string) => {
    switch (count) {
      case "all":
        return "All Categories";
      default:
        return `Top ${count} Categories`;
    }
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

  const fetchUserSettings = async () => {
    try {
      const settings = await apiClient.getSettings();
      setBaseCurrency(settings.base_currency || 'USD');
    } catch (error) {
      console.error('Error fetching user settings:', error);
      setBaseCurrency('USD'); // fallback
    }
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
        const totalCapex = transactions.reduce((sum: number, t: Transaction) => 
          sum + (t.type === 'capex' ? t.amount : 0), 0);
        const netIncome = totalIncome - totalSpending - totalCapex;
        const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

        console.log('Calculated totals:', { totalIncome, totalSpending, netIncome, savingsRate });

        setDashboardData({
          totalIncome,
          totalSpending,
          totalCapex,
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
        totalCapex: 800,
        netIncome: 1000,
        savingsRate: 20,
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
        
        // Check if there are more transactions to load and set total count
        const hasMore = response.pagination && response.pagination.page < response.pagination.pages;
        setHasMoreTransactions(hasMore);
        
        // Set total transaction count from pagination info
        if (response.pagination && response.pagination.total !== undefined) {
          setTotalTransactionCount(response.pagination.total);
        }
        
        console.log('Has more transactions:', hasMore);
        console.log('Total transactions:', response.pagination?.total);
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

  const fetchCategorySpending = async (range: { from: Date; to: Date }) => {
    try {
      const { start, end } = getDateRange(range);
      
      console.log('Fetching category spending for:', start, 'to', end);
      
      // Fetch only expense transactions for category analysis (excluding capex)
      const expenseResponse = await apiClient.request(`/transactions?start_date=${start}&end_date=${end}&type=expense&limit=999999`);
      
      console.log('Category spending API Response:', expenseResponse);
      
      if (expenseResponse.transactions) {
        const transactions = expenseResponse.transactions || [];
        
        // Group transactions by category and calculate totals
        const categoryMap = new Map<string, {
          category_name: string;
          category_color: string;
          category_icon?: string;
          total_amount: number;
          transaction_count: number;
        }>();
        
        let totalExpenses = 0;
        
        transactions.forEach((transaction: Transaction) => {
          // Explicitly exclude capex transactions
          if (transaction.type === 'capex') {
            return;
          }
          
          const categoryName = transaction.category_name || 'Uncategorized';
          const amount = transaction.amount;
          totalExpenses += amount;
          
          if (categoryMap.has(categoryName)) {
            const existing = categoryMap.get(categoryName)!;
            existing.total_amount += amount;
            existing.transaction_count += 1;
          } else {
            categoryMap.set(categoryName, {
              category_name: categoryName,
              category_color: transaction.category_color,
              category_icon: transaction.category_icon,
              total_amount: amount,
              transaction_count: 1
            });
          }
        });
        
        // Convert to array and calculate percentages
        const categorySpendingData: CategorySpending[] = Array.from(categoryMap.values()).map(category => ({
          ...category,
          percentage: totalExpenses > 0 ? (category.total_amount / totalExpenses) * 100 : 0
        }));
        
        // Sort by highest spending first
        categorySpendingData.sort((a, b) => b.total_amount - a.total_amount);
        
        setCategorySpending(categorySpendingData);
        console.log('Category spending data:', categorySpendingData);
      } else {
        console.error('Category spending API returned error:', expenseResponse.error);
        setCategorySpending([]);
      }
    } catch (error) {
      console.error('Error fetching category spending:', error);
      setCategorySpending([]);
    }
  };

  const fetchMonthlyCategorySpending = async (range: { from: Date; to: Date }) => {
    try {
      const { start, end } = getDateRange(range);
      
      console.log('Fetching monthly category spending for:', start, 'to', end);
      
      // Fetch only expense transactions for monthly category analysis
      const expenseResponse = await apiClient.request(`/transactions?start_date=${start}&end_date=${end}&type=expense&limit=999999`);
      
      if (expenseResponse.transactions) {
        const transactions = expenseResponse.transactions || [];
        
        // Group transactions by category and month
        const categoryMonthlyData = new Map<string, {
          category_name: string;
          category_color: string;
          category_icon?: string;
          monthly_amounts: Map<string, number>;
        }>();
        
        transactions.forEach((transaction: Transaction) => {
          // Explicitly exclude capex transactions
          if (transaction.type === 'capex') {
            return;
          }
          
          // Filter out once-off categories if toggle is enabled
          if (showOnlyRegularCategories && transaction.category_is_once_off) {
            return;
          }
          
          const monthKey = format(new Date(transaction.date), 'MMM yyyy');
          const categoryName = transaction.category_name || 'Uncategorized';
          const amount = transaction.amount;
          
          if (!categoryMonthlyData.has(categoryName)) {
            categoryMonthlyData.set(categoryName, {
              category_name: categoryName,
              category_color: transaction.category_color,
              category_icon: transaction.category_icon,
              monthly_amounts: new Map()
            });
          }
          
          const categoryData = categoryMonthlyData.get(categoryName)!;
          const currentAmount = categoryData.monthly_amounts.get(monthKey) || 0;
          categoryData.monthly_amounts.set(monthKey, currentAmount + amount);
        });
        
        // Convert to final format with percentage calculations
        const monthlyCategoryData: MonthlyCategorySpending[] = [];
        
        // Get all unique months in chronological order
        const allMonths = new Set<string>();
        categoryMonthlyData.forEach(categoryData => {
          categoryData.monthly_amounts.forEach((_, monthKey) => {
            allMonths.add(monthKey);
          });
        });
        
        // Sort months chronologically by parsing the month from transactions
        const monthsWithDates = Array.from(allMonths).map(monthKey => {
          // Find a transaction from this month to get the actual date
          const transactionFromMonth = transactions.find((t: Transaction) => {
            return format(new Date(t.date), 'MMM yyyy') === monthKey;
          });
          return {
            monthKey,
            date: transactionFromMonth ? new Date(transactionFromMonth.date) : new Date()
          };
        });

        const sortedMonths = monthsWithDates
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map(item => item.monthKey);
        
        categoryMonthlyData.forEach(categoryData => {
          const monthly_amounts: { [monthKey: string]: { amount: number; change_percentage?: number; change_direction?: 'up' | 'down' | 'same' } } = {};
          
          let previousAmount = 0;
          sortedMonths.forEach(monthKey => {
            const amount = categoryData.monthly_amounts.get(monthKey) || 0;
            let change_percentage: number | undefined;
            let change_direction: 'up' | 'down' | 'same' | undefined;
            
            if (previousAmount > 0) {
              const changePercent = ((amount - previousAmount) / previousAmount) * 100;
              change_percentage = Math.abs(changePercent);
              
              if (changePercent > 0) {
                change_direction = 'up';
              } else if (changePercent < 0) {
                change_direction = 'down';
              } else {
                change_direction = 'same';
              }
            }
            
            monthly_amounts[monthKey] = {
              amount,
              change_percentage,
              change_direction
            };
            
            if (amount > 0) {
              previousAmount = amount;
            }
          });
          
          // Only include categories that have spending in at least one month
          const hasSpending = Object.values(monthly_amounts).some(month => month.amount > 0);
          if (hasSpending) {
            monthlyCategoryData.push({
              category_name: categoryData.category_name,
              category_color: categoryData.category_color,
              category_icon: categoryData.category_icon,
              monthly_amounts
            });
          }
        });
        
        // Sort by total spending across all months
        monthlyCategoryData.sort((a, b) => {
          const totalA = Object.values(a.monthly_amounts).reduce((sum, month) => sum + month.amount, 0);
          const totalB = Object.values(b.monthly_amounts).reduce((sum, month) => sum + month.amount, 0);
          return totalB - totalA;
        });
        
        setMonthlyCategorySpending(monthlyCategoryData);
        console.log('Monthly category spending data:', monthlyCategoryData);
      } else {
        console.error('Monthly category spending API returned error:', expenseResponse.error);
        setMonthlyCategorySpending([]);
      }
    } catch (error) {
      console.error('Error fetching monthly category spending:', error);
      setMonthlyCategorySpending([]);
    }
  };

  const fetchMonthlyChartData = async (range: { from: Date; to: Date }, categoryCount: string = "5") => {
    try {
      const { start, end } = getDateRange(range);
      
      console.log('Fetching monthly chart data for:', start, 'to', end);
      
      // Fetch only expense transactions for chart analysis (excluding capex)
      const expenseResponse = await apiClient.request(`/transactions?start_date=${start}&end_date=${end}&type=expense&limit=999999`);
      
      if (expenseResponse.transactions) {
        const transactions = expenseResponse.transactions || [];
        
        // Group transactions by month and category
        const monthlyData = new Map<string, Map<string, { amount: number; color: string }>>();
        const categoryTotals = new Map<string, { total: number; color: string }>();
        
        transactions.forEach((transaction: Transaction) => {
          // Explicitly exclude capex transactions
          if (transaction.type === 'capex') {
            return;
          }
          
          const monthKey = format(new Date(transaction.date), 'MMM yyyy');
          const categoryName = transaction.category_name || 'Uncategorized';
          const amount = transaction.amount;
          const color = getCategoryColor(transaction.category_color, true);
          
          // Track monthly data
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, new Map());
          }
          const monthMap = monthlyData.get(monthKey)!;
          
          if (monthMap.has(categoryName)) {
            monthMap.get(categoryName)!.amount += amount;
          } else {
            monthMap.set(categoryName, { amount, color });
          }
          
          // Track category totals for top 10 selection
          if (categoryTotals.has(categoryName)) {
            categoryTotals.get(categoryName)!.total += amount;
          } else {
            categoryTotals.set(categoryName, { total: amount, color });
          }
        });
        
        // Get top X categories by total spending
        const allSortedCategories = Array.from(categoryTotals.entries())
          .sort(([,a], [,b]) => b.total - a.total);
        
        const categoriesToShow = categoryCount === "all" 
          ? allSortedCategories 
          : allSortedCategories.slice(0, parseInt(categoryCount));
        
        const topCategories: ChartCategoryData[] = categoriesToShow.map(([name, data]) => ({
          name,
          color: data.color,
          total: data.total
        }));
        
        // Create chart data structure
        const chartData: MonthlySpendingData[] = Array.from(monthlyData.entries()).map(([month, categoryMap]) => {
          const monthData: MonthlySpendingData = { month };
          
          // Add data for each of the selected top categories
          topCategories.forEach(category => {
            const categoryData = categoryMap.get(category.name);
            monthData[category.name] = categoryData ? categoryData.amount : 0;
          });
          
          return monthData;
        });
        
        // Sort chart data by month chronologically
        chartData.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        
        setMonthlyChartData(chartData);
        setChartCategories(topCategories);
        
        console.log('Monthly chart data:', chartData);
        console.log('Chart categories:', topCategories);
      } else {
        console.error('Monthly chart API returned error:', expenseResponse.error);
        setMonthlyChartData([]);
        setChartCategories([]);
      }
    } catch (error) {
      console.error('Error fetching monthly chart data:', error);
      setMonthlyChartData([]);
      setChartCategories([]);
    }
  };

  useEffect(() => {
    // Load user settings on component mount
    fetchUserSettings();
  }, []);

  useEffect(() => {
    // Reset pagination when date range changes
    setTransactionPage(1);
    setAllTransactions([]);
    setHasMoreTransactions(true);
    setTotalTransactionCount(0);
    setCategorySpending([]);
    setMonthlyCategorySpending([]);
    setMonthlyChartData([]);
    setChartCategories([]);
    setCurrentMonthPage(0);
    
    // Fetch summary data, category spending, monthly category spending, chart data, and initial transactions
    fetchSummaryData(dateRange);
    fetchCategorySpending(dateRange);
    fetchMonthlyCategorySpending(dateRange);
    fetchMonthlyChartData(dateRange, selectedCategoryCount);
    fetchTransactions(dateRange, 1, true);
  }, [dateRange]);

  // Update chart when category count selection changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchMonthlyChartData(dateRange, selectedCategoryCount);
    }
  }, [selectedCategoryCount]);

  // Update monthly category spending when toggle changes
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchMonthlyCategorySpending(dateRange);
    }
  }, [showOnlyRegularCategories]);

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
      title: "Capital Expenditure",
      amount: formatCurrency(dashboardData.totalCapex),
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
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
    <div className="space-y-4 md:space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track your income and expenses
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            disabled={loading}
            className="px-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="relative flex-1 md:flex-none">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="w-full md:min-w-[200px] justify-start text-left font-normal text-xs md:text-sm"
                >
                  <CalendarIcon className="w-4 h-4 mr-1 md:mr-2 flex-shrink-0" />
                  <span className="truncate">
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
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-3 bg-white border shadow-xl"
                align="center"
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
                  numberOfMonths={1}
                  className="md:hidden"
                />
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
                  className="hidden md:block"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            disabled={loading}
            className="px-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="text-xs md:text-sm"
              >
                <span className="hidden md:inline">Quick Select</span>
                <span className="md:hidden">Quick</span>
                <ChevronDown className="w-4 h-4 ml-1 md:ml-2" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {summaryCards.map((item, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-3 w-3 md:h-4 md:w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold break-words">{item.amount}</div>
              <p className="text-xs text-muted-foreground break-words">
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

      {/* Monthly Spending Chart */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-2 md:gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm md:text-lg">
              <span className="hidden md:inline">Monthly Spending Trends (Expenses Only) - {getCategoryDisplayText(selectedCategoryCount)}</span>
              <span className="md:hidden">Spending Trends</span>
            </CardTitle>
            <Select value={selectedCategoryCount} onValueChange={setSelectedCategoryCount}>
              <SelectTrigger className="w-full md:w-32 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Top 3</SelectItem>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="8">Top 8</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">Loading chart data...</div>
            </div>
          ) : monthlyChartData.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">No data available for chart</div>
            </div>
          ) : (
            <div className="h-64 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{
                    top: 20,
                    right: 5,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fontFamily: 'inherit', fill: 'currentColor' }}
                    className="text-gray-700 dark:text-gray-300"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: 'inherit', fill: 'currentColor' }}
                    className="text-gray-700 dark:text-gray-300"
                    tickFormatter={(value) => `${getCurrencySymbol(baseCurrency)}${value.toLocaleString()}`}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${getCurrencySymbol(baseCurrency)}${value.toFixed(2)}`, name]}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      backgroundColor: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: '10px',
                      fontFamily: 'inherit',
                      paddingTop: '10px',
                      color: 'hsl(var(--foreground))'
                    }}
                    iconSize={8}
                  />
                  {chartCategories.map((category, index) => (
                    <Bar
                      key={category.name}
                      dataKey={category.name}
                      stackId="spending"
                      fill={category.color}
                      name={`${category.name} (${getCurrencySymbol(baseCurrency)}${category.total.toFixed(0)})`}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Spending Analysis */}
      <Card className="overflow-hidden">
        <CardHeader className="p-3 md:p-6">
          <div className="flex flex-col gap-2 md:gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm md:text-lg">
              <span className="hidden md:block">Spending by Category (Expenses Only) - {dateRange.from && dateRange.to ? (
                `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
              ) : (
                'Select date range'
              )}</span>
              <span className="md:hidden">Category Spending</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="regular-categories-only"
                checked={showOnlyRegularCategories}
                onCheckedChange={setShowOnlyRegularCategories}
              />
              <Label htmlFor="regular-categories-only" className="text-xs md:text-sm font-normal">
                Regular only
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-4 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading category data...</div>
            </div>
          ) : monthlyCategorySpending.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No expense data found for this period</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonths}
                    disabled={currentMonthPage === 0}
                    className="text-xs md:text-sm"
                  >
                    <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Previous</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonths}
                    disabled={currentMonthPage >= getTotalMonthPages() - 1}
                    className="text-xs md:text-sm"
                  >
                    <span className="hidden md:inline">Next</span>
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {getCurrentMonths().length > 0 && (
                    `${getCurrentMonths()[0]} - ${getCurrentMonths()[getCurrentMonths().length - 1]} (Page ${currentMonthPage + 1} of ${getTotalMonthPages()})`
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table className="w-full text-xs md:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm px-2 py-2 w-20 md:w-32 sticky left-0 bg-background z-10">Category</TableHead>
                      {/* Dynamic month headers - 3 months on mobile, 8 on desktop */}
                      {getCurrentMonths().map(month => (
                        <TableHead key={month} className="text-right text-xs md:text-sm px-1 py-2 min-w-[65px] md:min-w-[90px]">
                          <div className="truncate" title={month}>
                            {month}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {monthlyCategorySpending.map((category) => {
                  const IconComponent = getCategoryIcon(category.category_icon);
                  return (
                    <TableRow key={category.category_name}>
                      <TableCell className="px-2 py-2 sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-1">
                          {category.category_icon ? (
                            <IconComponent
                              className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0"
                              style={{ color: getCategoryColor(category.category_color) }}
                            />
                          ) : (
                            <div
                              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCategoryColor(category.category_color) }}
                            />
                          )}
                          <div className="text-xs md:text-sm font-medium truncate" title={category.category_name}>
                            {category.category_name}
                          </div>
                        </div>
                      </TableCell>
                      {/* Dynamic month data - show current 8 months only */}
                      {getCurrentMonths().map(month => {
                        const data = category.monthly_amounts[month];
                        return (
                          <TableCell key={month} className="px-1 py-2 text-right">
                            {data && data.amount > 0 ? (
                              <div className="relative group inline-block">
                                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer whitespace-nowrap">
                                  {getCurrencySymbol(baseCurrency)}{data.amount.toFixed(0)}
                                </span>
                                {data.change_direction && data.change_percentage !== undefined && (
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[1000]">
                                    <div className="flex items-center gap-1">
                                      {data.change_direction === 'up' ? (
                                        <ArrowUp className="w-3 h-3 text-green-400" />
                                      ) : data.change_direction === 'down' ? (
                                        <ArrowDown className="w-3 h-3 text-red-400" />
                                      ) : null}
                                      <span className={`${
                                        data.change_direction === 'up' ? 'text-green-400' :
                                        data.change_direction === 'down' ? 'text-red-400' :
                                        'text-gray-300'
                                      }`}>
                                        {data.change_percentage.toFixed(0)}%
                                      </span>
                                    </div>
                                    {/* Tooltip arrow */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-black"></div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs md:text-sm">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    );
                  })}
                  
                  {/* Total Row */}
                  <TableRow className="border-t-2 border-gray-300 bg-gray-50 dark:bg-gray-800">
                    <TableCell className="px-2 py-2 font-bold sticky left-0 bg-gray-50 dark:bg-gray-800 z-10">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gray-500 rounded-full flex-shrink-0"></div>
                        <div className="text-xs md:text-sm font-bold">Total</div>
                      </div>
                    </TableCell>
                    {/* Calculate and display monthly totals */}
                    {getCurrentMonths().map(month => {
                      const monthTotal = monthlyCategorySpending.reduce((total, category) => {
                        const data = category.monthly_amounts[month];
                        return total + (data?.amount || 0);
                      }, 0);

                      return (
                        <TableCell key={month} className="px-1 py-2 text-right font-bold">
                          <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {getCurrencySymbol(baseCurrency)}{monthTotal.toFixed(0)}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions for Selected Month */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-sm md:text-lg">
            <span className="hidden md:inline">Transactions - {dateRange.from && dateRange.to ? (
              `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
            ) : (
              'Select date range'
            )} ({totalTransactionCount} transactions)</span>
            <span className="md:hidden">Transactions ({totalTransactionCount})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">Loading summary...</div>
            </div>
          ) : allTransactions.length === 0 && !transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">No transactions found for this period</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-10">
                    <TableHead className="w-12 md:w-20 text-xs md:text-sm px-1 md:px-4">Date</TableHead>
                    <TableHead className="text-xs md:text-sm px-2 md:px-4">Description</TableHead>
                    <TableHead className="w-20 md:w-32 text-xs md:text-sm px-1 md:px-4 hidden sm:table-cell">Category</TableHead>
                    <TableHead className="w-20 md:w-24 text-xs md:text-sm px-1 md:px-4 hidden lg:table-cell">Source</TableHead>
                    <TableHead className="w-14 md:w-20 text-xs md:text-sm px-1 md:px-4 hidden md:table-cell">Type</TableHead>
                    <TableHead className="w-20 md:w-24 text-right text-xs md:text-sm px-1 md:px-4">Amount</TableHead>
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
                        <TableCell className="text-muted-foreground text-xs md:text-sm py-2 px-1 md:px-4 align-top">
                          <div className="hidden md:block">{transaction.date}</div>
                          <div className="md:hidden text-xs">{format(new Date(transaction.date), 'MM/dd')}</div>
                        </TableCell>
                        <TableCell className="py-2 px-2 md:px-4 align-top">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-start gap-1.5">
                              <div
                                className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full flex-shrink-0 mt-1"
                                style={{ backgroundColor: getCategoryColor(transaction.category_color) }}
                              />
                              <div className="font-medium text-xs md:text-sm break-words leading-tight flex-1">
                                {transaction.description}
                              </div>
                            </div>
                            <div className="sm:hidden flex items-center gap-2 ml-3 text-xs">
                              <span className="text-muted-foreground truncate">{transaction.category_name}</span>
                              <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                                {transaction.type}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-1 md:px-4 hidden sm:table-cell align-top">
                          <div className="flex items-center gap-1 text-xs">
                            {transaction.category_icon ? (
                              <div className="flex items-center gap-1">
                                {(() => {
                                  const IconComponent = getCategoryIcon(transaction.category_icon);
                                  return <IconComponent className="w-2.5 h-2.5 md:w-3 md:h-3" style={{ color: getCategoryColor(transaction.category_color) }} />;
                                })()}
                                <span className="text-xs truncate max-w-[80px]">
                                  {transaction.category_name || 'Uncategorized'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: getCategoryColor(transaction.category_color) }}
                                />
                                <span className="text-xs truncate max-w-[80px]">
                                  {transaction.category_name || 'Uncategorized'}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-1 md:px-4 hidden lg:table-cell align-top">
                          <div className="text-xs md:text-sm text-muted-foreground truncate">
                            {transaction.source || 'Manual Entry'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-1 md:px-4 hidden md:table-cell align-top">
                          <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium text-xs md:text-sm py-2 px-1 md:px-4 whitespace-nowrap align-top ${getAmountColor(transaction.type)}`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {transactionsLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="text-muted-foreground text-sm">Loading more transactions...</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}