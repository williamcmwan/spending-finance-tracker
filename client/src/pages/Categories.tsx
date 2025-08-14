import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  created_at: string;
  updated_at: string;
  transaction_count?: number;
  total_amount?: number;
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'tag'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
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

  const handleAddCategory = async () => {
    try {
      await apiClient.createCategory(formData);
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setIsAddDialogOpen(false);
      setFormData({ name: '', color: '#3B82F6', icon: 'tag' });
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
      setFormData({ name: '', color: '#3B82F6', icon: 'tag' });
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
      icon: category.icon
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', color: '#3B82F6', icon: 'tag' });
    setEditingCategory(null);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">
              Manage your transaction categories
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your transaction categories
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
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
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <span className="font-medium">{category.name}</span>
                    </TableCell>
                    <TableCell>
                      <IconComponent className="w-4 h-4" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm text-muted-foreground">{category.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(category.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
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