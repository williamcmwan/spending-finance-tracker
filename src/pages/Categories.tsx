import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search
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
import { Label } from "@/components/ui/label";

// Mock categories data
const mockCategories = [
  {
    id: 1,
    name: "Groceries",
    color: "bg-category-groceries",
    transactionCount: 15,
    totalAmount: -1245.50,
  },
  {
    id: 2,
    name: "Transport",
    color: "bg-category-transport",
    transactionCount: 8,
    totalAmount: -340.25,
  },
  {
    id: 3,
    name: "Shopping",
    color: "bg-category-shopping",
    transactionCount: 6,
    totalAmount: -890.75,
  },
  {
    id: 4,
    name: "Household",
    color: "bg-category-household",
    transactionCount: 12,
    totalAmount: -567.30,
  },
  {
    id: 5,
    name: "Entertainment",
    color: "bg-category-entertainment",
    transactionCount: 4,
    totalAmount: -245.00,
  },
  {
    id: 6,
    name: "Dining",
    color: "bg-category-dining",
    transactionCount: 10,
    totalAmount: -432.80,
  },
  {
    id: 7,
    name: "Income",
    color: "bg-success",
    transactionCount: 2,
    totalAmount: 10000.00,
  },
];

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const formatAmount = (amount: number) => {
    const isPositive = amount >= 0;
    const formatted = Math.abs(amount).toFixed(2);
    return isPositive ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-success" : "text-foreground";
  };

  const filteredCategories = mockCategories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = () => {
    // This will be implemented with Supabase
    console.log("Adding category:", newCategoryName);
    setNewCategoryName("");
    setIsAddDialogOpen(false);
  };

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
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter category name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
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
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${category.color}`} />
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {category.transactionCount} transactions
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${getAmountColor(category.totalAmount)}`}>
                    {formatAmount(category.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          disabled={category.transactionCount > 0}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}