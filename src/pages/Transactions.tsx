import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Filter, 
  Search, 
  Download, 
  Plus,
  Edit,
  Trash2,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Extended mock data
const mockTransactions = [
  {
    id: 1,
    date: "2025-02-20",
    description: "Whole Foods",
    amount: -78.00,
    category: "Groceries",
    bank: "Chase",
    remarks: "Weekly grocery shopping",
  },
  {
    id: 2,
    date: "2025-02-19", 
    description: "AT&T Monthly Bill",
    amount: -65.00,
    category: "Household",
    bank: "Chase",
    remarks: "Internet and phone service",
  },
  {
    id: 3,
    date: "2025-02-18",
    description: "REI Co-op",
    amount: -145.00,
    category: "Shopping",
    bank: "Chase",
    remarks: "Camping gear purchase",
  },
  {
    id: 4,
    date: "2025-02-17",
    description: "Lyft Ride",
    amount: -22.00,
    category: "Transport",
    bank: "Chase",
    remarks: "Airport to hotel",
  },
  {
    id: 5,
    date: "2025-02-16",
    description: "Trader Joe's",
    amount: -67.75,
    category: "Groceries",
    bank: "Chase",
    remarks: "Organic food shopping",
  },
  {
    id: 6,
    date: "2025-02-15",
    description: "Monthly Salary",
    amount: 5000.00,
    category: "Income",
    bank: "Chase",
    remarks: "Payroll deposit",
  },
];

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");

  const formatAmount = (amount: number) => {
    const isPositive = amount >= 0;
    const formatted = Math.abs(amount).toFixed(2);
    return isPositive ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-success" : "text-foreground";
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      "Groceries": "bg-category-groceries",
      "Household": "bg-category-household", 
      "Shopping": "bg-category-shopping",
      "Transport": "bg-category-transport",
      "Income": "bg-success",
    };
    return colorMap[category] || "bg-muted";
  };

  const filteredTransactions = mockTransactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
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
                placeholder="Search transactions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10" 
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(transaction.category)}`} />
                      <span className="font-medium">{transaction.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.bank}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {transaction.remarks}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${getAmountColor(transaction.amount)}`}>
                    {formatAmount(transaction.amount)}
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
                        <DropdownMenuItem className="text-destructive">
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