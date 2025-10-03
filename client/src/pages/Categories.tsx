import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
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
  MoreHorizontal as MoreHorizontalIcon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  user_id?: number;
  is_once_off?: boolean;
  created_at: string;
  updated_at: string;
  transaction_count?: number;
  total_amount?: number;
}

interface CategoryRule {
  id: number;
  user_id?: number;
  category_id: number;
  keywords: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_color: string;
  category_icon: string;
}

const iconOptions = [
  // Basic icons
  { value: 'tag', label: 'Tag', icon: Tag },
  { value: 'home', label: 'Home', icon: Home },
  { value: 'car', label: 'Car', icon: Car },
  { value: 'shopping-bag', label: 'Shopping', icon: ShoppingBag },
  { value: 'film', label: 'Film', icon: Film },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'book', label: 'Book', icon: Book },
  { value: 'dollar-sign', label: 'Dollar', icon: DollarSign },
  { value: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'trending-up', label: 'Trending', icon: TrendingUp },
  { value: 'more-horizontal', label: 'More', icon: MoreHorizontalIcon },
  
  // Food & Dining
  { value: 'utensils', label: 'Utensils', icon: Utensils },
  { value: 'coffee', label: 'Coffee', icon: Coffee },
  { value: 'shopping-cart', label: 'Shopping Cart', icon: ShoppingCart },
  
  // Transportation
  { value: 'wrench', label: 'Wrench', icon: Wrench },
  { value: 'fuel', label: 'Fuel', icon: Fuel },
  { value: 'parking-circle', label: 'Parking', icon: ParkingCircle },
  { value: 'plane', label: 'Plane', icon: Plane },
  
  // Shopping & Retail
  { value: 'shirt', label: 'Shirt', icon: Shirt },
  { value: 'sofa', label: 'Sofa', icon: Sofa },
  { value: 'book-open', label: 'Book Open', icon: BookOpen },
  { value: 'pen-tool', label: 'Pen Tool', icon: PenTool },
  { value: 'gift', label: 'Gift', icon: Gift },
  
  // Health & Medical
  { value: 'stethoscope', label: 'Stethoscope', icon: Stethoscope },
  { value: 'pill', label: 'Pill', icon: Pill },
  
  // Home & Utilities
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'file-text', label: 'File Text', icon: FileText },
  { value: 'building', label: 'Building', icon: Building },
  { value: 'trees', label: 'Trees', icon: Trees },
  
  // Business & Work
  { value: 'package', label: 'Package', icon: Package },
  { value: 'repeat', label: 'Repeat', icon: Repeat },
  
  // Services
  { value: 'mail', label: 'Mail', icon: Mail },
  { value: 'truck', label: 'Truck', icon: Truck },
  { value: 'tv', label: 'TV', icon: Tv },
  
  // Technology & Communication
  { value: 'smartphone', label: 'Smartphone', icon: Smartphone },
  
  // Energy & Environment
  { value: 'sun', label: 'Sun', icon: Sun },
  
  // Education & Family
  { value: 'graduation-cap', label: 'Graduation Cap', icon: GraduationCap },
  { value: 'baby', label: 'Baby', icon: Baby },
  
  // Other
  { value: 'circle-dot', label: 'Circle Dot', icon: CircleDot },
  { value: 'help-circle', label: 'Help Circle', icon: HelpCircle },
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  
  // Additional icons for variety
  { value: 'camera', label: 'Camera', icon: Camera },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'trophy', label: 'Trophy', icon: Trophy },
  { value: 'dumbbell', label: 'Dumbbell', icon: Dumbbell },
  { value: 'droplets', label: 'Droplets', icon: Droplets },
  { value: 'flame', label: 'Flame', icon: Flame },
  { value: 'thermometer', label: 'Thermometer', icon: Thermometer },
  { value: 'snowflake', label: 'Snowflake', icon: Snowflake },
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'bitcoin', label: 'Bitcoin', icon: Bitcoin },
  { value: 'bed', label: 'Bed', icon: Bed },
  { value: 'map-pin', label: 'Map Pin', icon: MapPin },
  { value: 'monitor', label: 'Monitor', icon: Monitor },
  { value: 'footprints', label: 'Footprints', icon: Footprints },
  { value: 'gem', label: 'Gem', icon: Gem },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'fish', label: 'Fish', icon: Fish },
  { value: 'gamepad-2', label: 'Gamepad', icon: Gamepad2 },
  { value: 'play', label: 'Play', icon: Play },
  { value: 'scissors', label: 'Scissors', icon: Scissors },
  { value: 'hand', label: 'Hand', icon: Hand },
  { value: 'palette', label: 'Palette', icon: Palette },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'scale', label: 'Scale', icon: Scale },
  { value: 'megaphone', label: 'Megaphone', icon: Megaphone },
  { value: 'calculator', label: 'Calculator', icon: Calculator },
  { value: 'server', label: 'Server', icon: Server },
  { value: 'globe', label: 'Globe', icon: Globe },
  { value: 'key', label: 'Key', icon: Key },
  { value: 'cloud', label: 'Cloud', icon: Cloud },
  { value: 'hard-drive', label: 'Hard Drive', icon: HardDrive },
  { value: 'clock', label: 'Clock', icon: Clock },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'alert-triangle', label: 'Alert Triangle', icon: AlertTriangle },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'train', label: 'Train', icon: Train },
  { value: 'settings', label: 'Settings', icon: Settings },
  { value: 'rotate-ccw', label: 'Rotate CCW', icon: RotateCcw },
  { value: 'cpu', label: 'CPU', icon: Cpu },
];

const colorOptions = [
  { value: '#EF4444', label: 'Red' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Yellow' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#6B7280', label: 'Gray' },
  { value: '#000000', label: 'Black' },
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'categories' | 'rules'>('categories');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'tag',
    is_once_off: false
  });

  // Category Rules state
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState({
    category_id: 0,
    keywords: '',
    priority: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchCategoryRules();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCategories();
      setCategories(response.categories || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryRules = async () => {
    try {
      setRulesLoading(true);
      const response = await apiClient.getCategoryRules();
      setCategoryRules(response.rules || []);
    } catch (error: any) {
      console.error('Error fetching category rules:', error);
      toast({
        title: "Error",
        description: "Failed to load category rules",
        variant: "destructive",
      });
    } finally {
      setRulesLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      await apiClient.createCategory(formData);
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setIsAddDialogOpen(false);
      setFormData({ name: '', color: '#3B82F6', icon: 'tag', is_once_off: false });
      fetchCategories();
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    
    try {
      await apiClient.updateCategory(editingCategory.id, formData);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', color: '#3B82F6', icon: 'tag', is_once_off: false });
      fetchCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      await apiClient.deleteCategory(category.id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
      is_once_off: category.is_once_off || false
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', color: '#3B82F6', icon: 'tag', is_once_off: false });
    setEditingCategory(null);
  };

  // Category Rules functions
  const handleAddRule = async () => {
    try {
      await apiClient.createCategoryRule(ruleFormData);
      toast({
        title: "Success",
        description: "Category rule created successfully",
      });
      setIsAddRuleDialogOpen(false);
      setRuleFormData({ category_id: 0, keywords: '', priority: 0 });
      fetchCategoryRules();
    } catch (error: any) {
      console.error('Error creating category rule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create category rule",
        variant: "destructive",
      });
    }
  };

  const handleEditRule = async () => {
    if (!editingRule) return;
    
    try {
      await apiClient.updateCategoryRule(editingRule.id, ruleFormData);
      toast({
        title: "Success",
        description: "Category rule updated successfully",
      });
      setIsEditRuleDialogOpen(false);
      setEditingRule(null);
      setRuleFormData({ category_id: 0, keywords: '', priority: 0 });
      fetchCategoryRules();
    } catch (error: any) {
      console.error('Error updating category rule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update category rule",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (rule: CategoryRule) => {
    if (!confirm(`Are you sure you want to delete this rule?`)) {
      return;
    }

    try {
      await apiClient.deleteCategoryRule(rule.id);
      toast({
        title: "Success",
        description: "Category rule deleted successfully",
      });
      fetchCategoryRules();
    } catch (error: any) {
      console.error('Error deleting category rule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category rule",
        variant: "destructive",
      });
    }
  };

  const openEditRuleDialog = (rule: CategoryRule) => {
    setEditingRule(rule);
    setRuleFormData({
      category_id: rule.category_id,
      keywords: rule.keywords,
      priority: rule.priority
    });
    setIsEditRuleDialogOpen(true);
  };

  const resetRuleForm = () => {
    setRuleFormData({ category_id: 0, keywords: '', priority: 0 });
    setEditingRule(null);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.value === iconName);
    return iconOption ? iconOption.icon : Tag;
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );



  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Categories</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your transaction categories
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Categories</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your transaction categories and automatic categorization rules
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'categories'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'rules'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Auto-categorization Rules
        </button>
      </div>

      {activeTab === 'categories' && (
        <>
          {/* Categories Section */}
          <div className="flex justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs md:text-sm">
                  <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                  <span className="hidden md:inline ml-2">Add Category</span>
                  <span className="md:hidden ml-1">Add</span>
                </Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category for your transactions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  placeholder="Enter category name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">
                  Color
                </Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="icon" className="text-right">
                  Icon
                </Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => {
                      const IconComponent = icon.icon;
                      return (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_once_off" className="text-right">
                  Once-off Spending
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="is_once_off"
                    checked={formData.is_once_off}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_once_off: checked as boolean }))}
                  />
                  <Label htmlFor="is_once_off" className="text-sm text-muted-foreground">
                    Mark this category for one-time expenses
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddCategory}
                disabled={!formData.name.trim()}
              >
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-3 md:pt-6 md:px-6 md:pb-6">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 md:w-4 md:h-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 md:pl-10 text-xs md:text-sm h-8 md:h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card>
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-sm md:text-lg">
                <span className="hidden md:inline">All Categories ({filteredCategories.length})</span>
                <span className="md:hidden">Categories ({filteredCategories.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm px-2 md:px-4">Category</TableHead>
                      <TableHead className="text-xs md:text-sm px-1 md:px-4 hidden sm:table-cell">Icon</TableHead>
                      <TableHead className="text-xs md:text-sm px-1 md:px-4 hidden md:table-cell">Color</TableHead>
                      <TableHead className="text-xs md:text-sm px-1 md:px-4">Type</TableHead>
                      <TableHead className="text-xs md:text-sm px-1 md:px-4 hidden lg:table-cell">Created</TableHead>
                      <TableHead className="w-8 md:w-[70px] px-1 md:px-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => {
                      const IconComponent = getIconComponent(category.icon);
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="px-2 md:px-4 py-2 align-top">
                            <div className="flex items-center gap-1.5">
                              <div className="sm:hidden">
                                <IconComponent className="w-3 h-3" style={{ color: category.color }} />
                              </div>
                              <span className="font-medium text-xs md:text-sm">{category.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-1 md:px-4 py-2 hidden sm:table-cell align-top">
                            <IconComponent className="w-3 h-3 md:w-4 md:h-4" style={{ color: category.color }} />
                          </TableCell>
                          <TableCell className="px-1 md:px-4 py-2 hidden md:table-cell align-top">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-xs md:text-sm text-muted-foreground">{category.color}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-1 md:px-4 py-2 align-top">
                            {category.is_once_off ? (
                              <Badge variant="secondary" className="text-xs px-1.5 md:px-2 py-0">
                                Once-off
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs px-1.5 md:px-2 py-0">
                                Regular
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-1 md:px-4 py-2 text-muted-foreground text-xs md:text-sm hidden lg:table-cell align-top">
                            {new Date(category.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="px-1 md:px-4 py-2 align-top">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8">
                                  <MoreHorizontal className="w-3 h-3 md:w-4 md:h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                  <Edit className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteCategory(category)}
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'rules' && (
        <>
          {/* Category Rules Section */}
          <div className="flex justify-end">
            <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs md:text-sm">
                  <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                  <span className="hidden md:inline ml-2">Add Rule</span>
                  <span className="md:hidden ml-1">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Category Rule</DialogTitle>
                  <DialogDescription>
                    Create a rule to automatically categorize transactions based on keywords.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rule-category" className="text-right">
                      Category
                    </Label>
                    <Select 
                      value={ruleFormData.category_id.toString()} 
                      onValueChange={(value) => setRuleFormData(prev => ({ ...prev, category_id: parseInt(value) }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => {
                          const IconComponent = getIconComponent(category.icon);
                          return (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" style={{ color: category.color }} />
                                {category.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rule-keywords" className="text-right">
                      Keywords
                    </Label>
                    <Input
                      id="rule-keywords"
                      value={ruleFormData.keywords}
                      onChange={(e) => setRuleFormData(prev => ({ ...prev, keywords: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., lidl,tesco,grocery"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rule-priority" className="text-right">
                      Priority
                    </Label>
                    <Input
                      id="rule-priority"
                      type="number"
                      min="0"
                      max="100"
                      value={ruleFormData.priority}
                      onChange={(e) => setRuleFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      className="col-span-3"
                      placeholder="0-100 (higher = more priority)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleAddRule}
                    disabled={!ruleFormData.category_id || !ruleFormData.keywords.trim()}
                  >
                    Add Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rules Table */}
          <Card>
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-sm md:text-lg">
                Auto-categorization Rules ({categoryRules.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              {rulesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm px-2 md:px-4">Category</TableHead>
                        <TableHead className="text-xs md:text-sm px-1 md:px-4">Keywords</TableHead>
                        <TableHead className="text-xs md:text-sm px-1 md:px-4 hidden md:table-cell">Priority</TableHead>
                        <TableHead className="text-xs md:text-sm px-1 md:px-4 hidden lg:table-cell">Status</TableHead>
                        <TableHead className="w-8 md:w-[70px] px-1 md:px-4"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryRules.map((rule) => {
                        const IconComponent = getIconComponent(rule.category_icon);
                        return (
                          <TableRow key={rule.id}>
                            <TableCell className="px-2 md:px-4 py-2 align-top">
                              <div className="flex items-center gap-1.5">
                                <IconComponent className="w-3 h-3" style={{ color: rule.category_color }} />
                                <span className="font-medium text-xs md:text-sm">{rule.category_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-1 md:px-4 py-2 align-top">
                              <div className="text-xs md:text-sm max-w-xs">
                                {rule.keywords.split(',').map((keyword, index) => (
                                  <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                    {keyword.trim()}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="px-1 md:px-4 py-2 text-xs md:text-sm hidden md:table-cell align-top">
                              {rule.priority}
                            </TableCell>
                            <TableCell className="px-1 md:px-4 py-2 hidden lg:table-cell align-top">
                              {rule.is_active ? (
                                <Badge variant="default" className="text-xs px-1.5 md:px-2 py-0">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs px-1.5 md:px-2 py-0">
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-1 md:px-4 py-2 align-top">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8">
                                    <MoreHorizontal className="w-3 h-3 md:w-4 md:h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditRuleDialog(rule)}>
                                    <Edit className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteRule(rule)}
                                  >
                                    <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Rule Dialog */}
          <Dialog open={isEditRuleDialogOpen} onOpenChange={(open) => {
            setIsEditRuleDialogOpen(open);
            if (!open) resetRuleForm();
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category Rule</DialogTitle>
                <DialogDescription>
                  Update the rule for automatic transaction categorization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-rule-category" className="text-right">
                    Category
                  </Label>
                  <Select 
                    value={ruleFormData.category_id.toString()} 
                    onValueChange={(value) => setRuleFormData(prev => ({ ...prev, category_id: parseInt(value) }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => {
                        const IconComponent = getIconComponent(category.icon);
                        return (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" style={{ color: category.color }} />
                              {category.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-rule-keywords" className="text-right">
                    Keywords
                  </Label>
                  <Input
                    id="edit-rule-keywords"
                    value={ruleFormData.keywords}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., lidl,tesco,grocery"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-rule-priority" className="text-right">
                    Priority
                  </Label>
                  <Input
                    id="edit-rule-priority"
                    type="number"
                    min="0"
                    max="100"
                    value={ruleFormData.priority}
                    onChange={(e) => setRuleFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    className="col-span-3"
                    placeholder="0-100 (higher = more priority)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleEditRule}
                  disabled={!ruleFormData.category_id || !ruleFormData.keywords.trim()}
                >
                  Update Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter category name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-color" className="text-right">
                Color
              </Label>
              <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-icon" className="text-right">
                Icon
              </Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((icon) => {
                    const IconComponent = icon.icon;
                    return (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {icon.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_is_once_off" className="text-right">
                Once-off Spending
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="edit_is_once_off"
                  checked={formData.is_once_off}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_once_off: checked as boolean }))}
                />
                <Label htmlFor="edit_is_once_off" className="text-sm text-muted-foreground">
                  Mark this category for one-time expenses
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleEditCategory}
              disabled={!formData.name.trim()}
            >
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}