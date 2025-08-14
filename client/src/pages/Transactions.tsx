import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Filter, 
  Search, 
  Download, 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Tag,
  Home,
  Car,
  ShoppingBag,
  Film,
  Heart,
  Zap,
  Book,
  DollarSign,
  Briefcase,
  TrendingUp,
  // Additional icons for comprehensive coverage
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
  Cpu
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: number;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface TransactionFormData {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category_id?: number;
  date: string;
}

interface FilterData {
  type?: 'income' | 'expense';
  category_id?: number;
  start_date?: string;
  end_date?: string;
  min_amount?: string;
  max_amount?: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: parseInt(localStorage.getItem('transactionPageLimit') || '20'),
    total: 0,
    pages: 0
  });
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [inlineEditingCategory, setInlineEditingCategory] = useState<number | null>(null);
  const [inlineEditingDate, setInlineEditingDate] = useState<number | null>(null);
  const [inlineEditingDescription, setInlineEditingDescription] = useState<number | null>(null);
  const [inlineEditValues, setInlineEditValues] = useState<{ date?: string; description?: string }>({});
  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: '',
    type: 'expense',
    category_id: undefined,
    date: new Date().toISOString().split('T')[0]
  });
  const [filterData, setFilterData] = useState<FilterData>({});
  const [activeFilters, setActiveFilters] = useState<FilterData>({});
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const recordLimitOptions = [10, 20, 50, 100, 200, 500];

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [pagination.page, pagination.limit]);

  const fetchTransactions = async (search?: string, page?: number, limit?: number, filters?: FilterData) => {
    try {
      setLoading(true);
      const params: any = {
        page: page || pagination.page,
        limit: limit || pagination.limit,
        sort_field: sortField,
        sort_direction: sortDirection
      };
      
      // Add search parameter
      if (search) {
        // Check if search query looks like an amount (contains numbers)
        const hasNumbers = /\d/.test(search);
        const isNumeric = /^\d+(\.\d+)?$/.test(search);
        
        // Check if it looks like a date
        const isDate = /^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/.test(search) || 
                      /^\d{4}$/.test(search) || 
                      /^\d{1,2}$/.test(search) ||
                      /^\d{3}$/.test(search) ||
                      /^\d{1}$/.test(search) ||
                      /^\d{4}-\d{1,2}$/.test(search) ||  // YYYY-MM format
                      /^\d{1,2}-\d{1,2}$/.test(search) || // MM-DD format
                      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)$/i.test(search);
        
        // Check if it's a mixed query (text + numbers)
        const hasText = /[a-zA-Z]/.test(search);
        const isMixedQuery = hasNumbers && hasText;
        
        // Check if it's likely a year (4 digits starting with 19 or 20)
        const isLikelyYear = /^(19|20)\d{2}$/.test(search);
        
        if (isMixedQuery) {
          // For mixed queries, search in description (which includes category names)
          // This will find transactions where description or category contains the text part
          params.description = search;
        } else if (isLikelyYear) {
          // If it looks like a year, search in date field
          params.date_search = search;
        } else if (isDate) {
          // If it looks like a date, search in date field
          params.date_search = search;
        } else if (hasNumbers && (isNumeric || search.includes('$') || search.includes(','))) {
          // If it looks like an amount, search in amount field
          // Remove common currency symbols and formatting
          const cleanAmount = search.replace(/[$,\s]/g, '');
          params.amount = cleanAmount;
        } else {
          // Otherwise search in description and category
          params.description = search;
        }
      }
      
      // Add filter parameters
      const currentFilters = filters || activeFilters;
      if (currentFilters.type) {
        params.type = currentFilters.type;
      }
      if (currentFilters.category_id) {
        params.category_id = currentFilters.category_id;
      }
      if (currentFilters.start_date) {
        params.start_date = currentFilters.start_date;
      }
      if (currentFilters.end_date) {
        params.end_date = currentFilters.end_date;
      }
      if (currentFilters.min_amount) {
        params.min_amount = currentFilters.min_amount;
      }
      if (currentFilters.max_amount) {
        params.max_amount = currentFilters.max_amount;
      }
      
      const response = await apiClient.getTransactions(params);
      setTransactions(response.transactions || []);
      setPagination(prev => ({
        ...prev,
        page: response.pagination?.page || prev.page,
        limit: response.pagination?.limit || prev.limit,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      }));
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response.categories || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      fetchTransactions(value, 1, pagination.limit);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchTransactions(searchQuery, newPage, pagination.limit, activeFilters);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    // Save to localStorage
    localStorage.setItem('transactionPageLimit', newLimit.toString());
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    fetchTransactions(searchQuery, 1, newLimit, activeFilters);
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await apiClient.deleteTransaction(transactionId);
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
      fetchTransactions(searchQuery, pagination.page, pagination.limit, activeFilters);
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category_id: undefined,
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.type,
      category_id: transaction.category_id,
      date: transaction.date
    });
    setIsEditDialogOpen(true);
  };

  const openFilterDialog = () => {
    setFilterData(activeFilters);
    setIsFilterDialogOpen(true);
  };

  const handleApplyFilters = () => {
    setActiveFilters(filterData);
    fetchTransactions(searchQuery, 1, pagination.limit, filterData);
    setIsFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setFilterData({});
    setActiveFilters({});
    fetchTransactions(searchQuery, 1, pagination.limit, {});
    setIsFilterDialogOpen(false);
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(value => value !== undefined && value !== '').length;
  };



  const handleInlineCategoryChange = async (transactionId: number, categoryId: number | undefined) => {
    try {
      await apiClient.updateTransaction(transactionId, {
        category_id: categoryId
      });
      
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      
      // Refresh the transactions list
      fetchTransactions(searchQuery, pagination.page, pagination.limit, activeFilters);
      setInlineEditingCategory(null);
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleInlineDateChange = async (transactionId: number, newDate: string) => {
    try {
      await apiClient.updateTransaction(transactionId, {
        date: newDate
      });
      
      toast({
        title: "Success",
        description: "Date updated successfully",
      });
      
      fetchTransactions(searchQuery, pagination.page, pagination.limit, activeFilters);
      setInlineEditingDate(null);
      setInlineEditValues({});
    } catch (error: any) {
      console.error('Error updating date:', error);
      toast({
        title: "Error",
        description: "Failed to update date",
        variant: "destructive",
      });
    }
  };

  const handleInlineDescriptionChange = async (transactionId: number, newDescription: string) => {
    try {
      await apiClient.updateTransaction(transactionId, {
        description: newDescription
      });
      
      toast({
        title: "Success",
        description: "Description updated successfully",
      });
      
      fetchTransactions(searchQuery, pagination.page, pagination.limit, activeFilters);
      setInlineEditingDescription(null);
      setInlineEditValues({});
    } catch (error: any) {
      console.error('Error updating description:', error);
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    }
  };

  const handleSort = (field: string) => {
    let newDirection: 'asc' | 'desc';
    
    if (sortField === field) {
      // Same field - toggle direction
      newDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    } else {
      // Different field - start with descending
      newDirection = 'desc';
    }
    
    console.log(`Sorting: ${field} ${newDirection}`); // Debug log
    
    setSortField(field);
    setSortDirection(newDirection);
    
    // Create a temporary fetch function with the new sort parameters
    const fetchWithNewSort = async () => {
      try {
        setLoading(true);
        const params: any = {
          page: 1,
          limit: pagination.limit,
          sort_field: field,
          sort_direction: newDirection
        };
        
        // Add search parameter
        if (searchQuery) {
          // Check if search query looks like an amount (contains numbers)
          const hasNumbers = /\d/.test(searchQuery);
          const isNumeric = /^\d+(\.\d+)?$/.test(searchQuery);
          
          // Check if it looks like a date
          const isDate = /^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/.test(searchQuery) || 
                        /^\d{4}$/.test(searchQuery) || 
                        /^\d{1,2}$/.test(searchQuery) ||
                        /^\d{3}$/.test(searchQuery) ||
                        /^\d{1}$/.test(searchQuery) ||
                        /^\d{4}-\d{1,2}$/.test(searchQuery) ||  // YYYY-MM format
                        /^\d{1,2}-\d{1,2}$/.test(searchQuery) || // MM-DD format
                        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)$/i.test(searchQuery);
          
          // Check if it's a mixed query (text + numbers)
          const hasText = /[a-zA-Z]/.test(searchQuery);
          const isMixedQuery = hasNumbers && hasText;
          
          // Check if it's likely a year (4 digits starting with 19 or 20)
          const isLikelyYear = /^(19|20)\d{2}$/.test(searchQuery);
          
          if (isMixedQuery) {
            params.description = searchQuery;
          } else if (isLikelyYear) {
            params.date_search = searchQuery;
          } else if (isDate) {
            params.date_search = searchQuery;
          } else if (hasNumbers && (isNumeric || searchQuery.includes('$') || searchQuery.includes(','))) {
            const cleanAmount = searchQuery.replace(/[$,\s]/g, '');
            params.amount = cleanAmount;
          } else {
            params.description = searchQuery;
          }
        }
        
        // Add filter parameters
        if (activeFilters.type) {
          params.type = activeFilters.type;
        }
        if (activeFilters.category_id) {
          params.category_id = activeFilters.category_id;
        }
        if (activeFilters.start_date) {
          params.start_date = activeFilters.start_date;
        }
        if (activeFilters.end_date) {
          params.end_date = activeFilters.end_date;
        }
        if (activeFilters.min_amount) {
          params.min_amount = activeFilters.min_amount;
        }
        if (activeFilters.max_amount) {
          params.max_amount = activeFilters.max_amount;
        }
        
        const response = await apiClient.getTransactions(params);
        setTransactions(response.transactions);
        setPagination(response.pagination);
      } catch (error: any) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWithNewSort();
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'desc' ? '↓' : '↑';
  };

  const handleExport = async () => {
    try {
      // Get all transactions for export (without pagination)
      const params: any = {
        page: 1,
        limit: 10000, // Large limit to get all transactions
        sort_field: sortField,
        sort_direction: sortDirection
      };
      
      // Add search parameter if exists
      if (searchQuery) {
        const hasNumbers = /\d/.test(searchQuery);
        const isNumeric = /^\d+(\.\d+)?$/.test(searchQuery);
        const isDate = /^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/.test(searchQuery) || 
                      /^\d{4}$/.test(searchQuery) || 
                      /^\d{1,2}$/.test(searchQuery) ||
                      /^\d{3}$/.test(searchQuery) ||
                      /^\d{1}$/.test(searchQuery) ||
                      /^\d{4}-\d{1,2}$/.test(searchQuery) ||
                      /^\d{1,2}-\d{1,2}$/.test(searchQuery) ||
                      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)$/i.test(searchQuery);
        const hasText = /[a-zA-Z]/.test(searchQuery);
        const isMixedQuery = hasNumbers && hasText;
        const isLikelyYear = /^(19|20)\d{2}$/.test(searchQuery);
        
        if (isMixedQuery) {
          params.description = searchQuery;
        } else if (isLikelyYear) {
          params.date_search = searchQuery;
        } else if (isDate) {
          params.date_search = searchQuery;
        } else if (hasNumbers && (isNumeric || searchQuery.includes('$') || searchQuery.includes(','))) {
          const cleanAmount = searchQuery.replace(/[$,\s]/g, '');
          params.amount = cleanAmount;
        } else {
          params.description = searchQuery;
        }
      }
      
      // Add filter parameters
      if (activeFilters.type) {
        params.type = activeFilters.type;
      }
      if (activeFilters.category_id) {
        params.category_id = activeFilters.category_id;
      }
      if (activeFilters.start_date) {
        params.start_date = activeFilters.start_date;
      }
      if (activeFilters.end_date) {
        params.end_date = activeFilters.end_date;
      }
      if (activeFilters.min_amount) {
        params.min_amount = activeFilters.min_amount;
      }
      if (activeFilters.max_amount) {
        params.max_amount = activeFilters.max_amount;
      }

      const response = await apiClient.getTransactions(params);
      
      // Convert transactions to CSV format
      const headers = [
        'Date', 'Year', 'Month', 'Details / Description', 
        'Income Amount', 'Spending Amount', 'Category', 
        'Source / Bank', 'Currency', 'Spending for non-EUR currency'
      ];
      
      const csvRows = [headers.join(',')];
      
      response.transactions.forEach((transaction: Transaction) => {
        const date = new Date(transaction.date);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        const incomeAmount = transaction.type === 'income' ? Math.abs(transaction.amount).toFixed(2) : '0.00';
        const spendingAmount = transaction.type === 'expense' ? Math.abs(transaction.amount).toFixed(2) : '0.00';
        
        const row = [
          transaction.date,
          year,
          month,
          `"${transaction.description}"`,
          incomeAmount,
          spendingAmount,
          `"${transaction.category_name || ''}"`,
          '"Manual Entry"',
          '"EUR"',
          '""'
        ];
        
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `${response.transactions.length} transactions exported to CSV`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || 'Failed to export transactions',
        variant: "destructive",
      });
    }
  };

  const handleAddTransaction = async () => {
    if (!formData.description.trim() || !formData.amount.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.createTransaction({
        description: formData.description.trim(),
        amount: amount,
        type: formData.type,
        category_id: formData.category_id,
        date: formData.date
      });
      
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
      setIsAddDialogOpen(false);
      fetchTransactions(searchQuery, pagination.page, pagination.limit);
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;
    
    if (!formData.description.trim() || !formData.amount.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.updateTransaction(editingTransaction.id, {
        description: formData.description.trim(),
        amount: amount,
        type: formData.type,
        category_id: formData.category_id,
        date: formData.date
      });
      
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      fetchTransactions(searchQuery, pagination.page, pagination.limit, activeFilters);
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      category_id: undefined,
      date: new Date().toISOString().split('T')[0]
    });
    setEditingTransaction(null);
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const isPositive = type === 'income';
    const formatted = Math.abs(amount).toFixed(2);
    return isPositive ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (type: 'income' | 'expense') => {
    return type === 'income' ? "text-green-600" : "text-foreground";
  };

  const getCategoryColor = (categoryColor?: string) => {
    return categoryColor || "#6B7280";
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
      'trending-up': TrendingUp,
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

  const renderPaginationButtons = () => {
    const { page, pages } = pagination;
    const buttons: React.ReactElement[] = [];

    // First page button
    buttons.push(
      <Button
        key="first"
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(1)}
        disabled={page === 1}
      >
        <ChevronsLeft className="w-4 h-4" />
      </Button>
    );

    // Previous page button
    buttons.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
    );

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === page ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    // Next page button
    buttons.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(page + 1)}
        disabled={page === pages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    );

    // Last page button
    buttons.push(
      <Button
        key="last"
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(pages)}
        disabled={page === pages}
      >
        <ChevronsRight className="w-4 h-4" />
      </Button>
    );

    return buttons;
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">
              Manage all your income and expense transactions
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            Manage all your income and expense transactions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>

        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                ref={searchInputRef}
                placeholder="Search by description, amount, date, or category..." 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10" 
              />
            </div>
            <Button 
              variant={getActiveFilterCount() > 0 ? "default" : "outline"} 
              size="sm" 
              onClick={openFilterDialog}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
            {getActiveFilterCount() > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearFilters}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              All Transactions ({pagination.total.toLocaleString()})
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select 
                value={pagination.limit.toString()} 
                onValueChange={(value) => handleLimitChange(parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recordLimitOptions.map(limit => (
                    <SelectItem key={limit} value={limit.toString()}>
                      {limit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No transactions found matching your search.' : 'No transactions yet. Add your first transaction to get started!'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="h-10">
                    <TableHead 
                      className="w-20 cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Date {getSortIcon('date')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center gap-1">
                        Description {getSortIcon('description')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-32 cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-1">
                        Category {getSortIcon('category')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-20 cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center gap-1">
                        Type {getSortIcon('type')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-24 text-right cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount {getSortIcon('amount')}
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                                          <TableRow key={transaction.id} className="min-h-12">
                      <TableCell className="text-muted-foreground text-sm py-2 whitespace-nowrap">
                        {inlineEditingDate === transaction.id ? (
                          <Input
                            type="date"
                            value={inlineEditValues.date || transaction.date}
                            onChange={(e) => setInlineEditValues(prev => ({ ...prev, date: e.target.value }))}
                            onBlur={() => handleInlineDateChange(transaction.id, inlineEditValues.date || transaction.date)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineDateChange(transaction.id, inlineEditValues.date || transaction.date);
                              } else if (e.key === 'Escape') {
                                setInlineEditingDate(null);
                                setInlineEditValues({});
                              }
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 px-1 py-1 rounded"
                            onClick={() => {
                              setInlineEditingDate(transaction.id);
                              setInlineEditValues({ date: transaction.date });
                            }}
                          >
                            {transaction.date}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {inlineEditingDescription === transaction.id ? (
                          <div className="flex items-start gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" 
                              style={{ backgroundColor: getCategoryColor(transaction.category_color) }}
                            />
                            <Input
                              value={inlineEditValues.description || transaction.description}
                              onChange={(e) => setInlineEditValues(prev => ({ ...prev, description: e.target.value }))}
                              onBlur={() => handleInlineDescriptionChange(transaction.id, inlineEditValues.description || transaction.description)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleInlineDescriptionChange(transaction.id, inlineEditValues.description || transaction.description);
                                } else if (e.key === 'Escape') {
                                  setInlineEditingDescription(null);
                                  setInlineEditValues({});
                                }
                              }}
                              className="text-sm"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" 
                              style={{ backgroundColor: getCategoryColor(transaction.category_color) }}
                            />
                            <div 
                              className="font-medium text-sm break-words leading-relaxed cursor-pointer hover:bg-muted/50 px-1 py-1 rounded flex-1"
                              onClick={() => {
                                setInlineEditingDescription(transaction.id);
                                setInlineEditValues({ description: transaction.description });
                              }}
                            >
                              {transaction.description}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {inlineEditingCategory === transaction.id ? (
                          <Select 
                            value={transaction.category_id?.toString() || 'none'} 
                            onValueChange={(value) => handleInlineCategoryChange(transaction.id, value === 'none' ? undefined : parseInt(value))}
                            onOpenChange={(open) => !open && setInlineEditingCategory(null)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Category</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const IconComponent = getCategoryIcon(category.icon);
                                      return <IconComponent className="w-3 h-3" style={{ color: category.color }} />;
                                    })()}
                                    <span className="text-xs">{category.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div 
                            className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded text-xs"
                            onClick={() => setInlineEditingCategory(transaction.id)}
                          >
                            {transaction.category_icon ? (
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const IconComponent = getCategoryIcon(transaction.category_icon);
                                  return <IconComponent className="w-3 h-3 flex-shrink-0" style={{ color: getCategoryColor(transaction.category_color) }} />;
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
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium text-sm py-2 ${getAmountColor(transaction.type)}`}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </TableCell>
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(transaction)}>
                              <Edit className="w-3 h-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total.toLocaleString()} results
                  </div>
                  <div className="flex items-center gap-2">
                    {renderPaginationButtons()}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Create a new income or expense transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter transaction description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={formData.category_id?.toString() || 'none'} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value === 'none' ? undefined : parseInt(value) }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddTransaction}
              disabled={submitting || !formData.description.trim() || !formData.amount.trim()}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Enter transaction description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Type
              </Label>
              <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select value={formData.category_id?.toString() || 'none'} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value === 'none' ? undefined : parseInt(value) }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">
                Date
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleEditTransaction}
              disabled={submitting || !formData.description.trim() || !formData.amount.trim()}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Transactions</DialogTitle>
            <DialogDescription>
              Filter transactions by various criteria.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filter-type" className="text-right">
                Type
              </Label>
              <Select 
                value={filterData.type || 'all'} 
                onValueChange={(value) => setFilterData(prev => ({ 
                  ...prev, 
                  type: value === 'all' ? undefined : value as 'income' | 'expense' 
                }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filter-category" className="text-right">
                Category
              </Label>
              <Select 
                value={filterData.category_id?.toString() || 'all'} 
                onValueChange={(value) => setFilterData(prev => ({ 
                  ...prev, 
                  category_id: value === 'all' ? undefined : parseInt(value) 
                }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filter-start-date" className="text-right">
                Start Date
              </Label>
              <Input
                id="filter-start-date"
                type="date"
                value={filterData.start_date || ''}
                onChange={(e) => setFilterData(prev => ({ ...prev, start_date: e.target.value || undefined }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filter-end-date" className="text-right">
                End Date
              </Label>
              <Input
                id="filter-end-date"
                type="date"
                value={filterData.end_date || ''}
                onChange={(e) => setFilterData(prev => ({ ...prev, end_date: e.target.value || undefined }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filter-min-amount" className="text-right">
                Min Amount
              </Label>
              <Input
                id="filter-min-amount"
                type="number"
                step="0.01"
                min="0"
                value={filterData.min_amount || ''}
                onChange={(e) => setFilterData(prev => ({ ...prev, min_amount: e.target.value || undefined }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filter-max-amount" className="text-right">
                Max Amount
              </Label>
              <Input
                id="filter-max-amount"
                type="number"
                step="0.01"
                min="0"
                value={filterData.max_amount || ''}
                onChange={(e) => setFilterData(prev => ({ ...prev, max_amount: e.target.value || undefined }))}
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}