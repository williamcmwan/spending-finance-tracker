import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - will be replaced with real data from Supabase
const mockTransactions = [
  {
    id: 1,
    date: "2025-02-20",
    description: "Whole Foods",
    amount: -78.00,
    category: "Groceries",
    categoryColor: "bg-category-groceries",
    bank: "Chase",
  },
  {
    id: 2,
    date: "2025-02-19", 
    description: "AT&T",
    amount: -65.00,
    category: "Household",
    categoryColor: "bg-category-household",
    bank: "Chase",
  },
  {
    id: 3,
    date: "2025-02-18",
    description: "REI",
    amount: -145.00,
    category: "Shopping",
    categoryColor: "bg-category-shopping",
    bank: "Chase",
  },
  {
    id: 4,
    date: "2025-02-17",
    description: "Lyft",
    amount: -22.00,
    category: "Transport",
    categoryColor: "bg-category-transport",
    bank: "Chase",
  },
  {
    id: 5,
    date: "2025-02-16",
    description: "Trader Joe's",
    amount: -67.75,
    category: "Groceries",
    categoryColor: "bg-category-groceries",
    bank: "Chase",
  },
  {
    id: 6,
    date: "2025-02-15",
    description: "Salary Deposit",
    amount: 5000.00,
    category: "Income",
    categoryColor: "bg-success",
    bank: "Chase",
  },
];

interface TransactionListProps {
  onEditTransaction?: (id: number) => void;
}

export function TransactionList({ onEditTransaction }: TransactionListProps) {
  const formatAmount = (amount: number) => {
    const isPositive = amount >= 0;
    const formatted = Math.abs(amount).toFixed(2);
    return isPositive ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? "text-success" : "text-foreground";
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Recent Transactions</h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {mockTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full ${transaction.categoryColor} flex items-center justify-center`}>
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                
                <div className="flex flex-col">
                  <span className="font-medium">{transaction.description}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-xs">
                  {transaction.category}
                </Badge>
                
                <span className={`font-medium text-lg ${getAmountColor(transaction.amount)}`}>
                  {formatAmount(transaction.amount)}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditTransaction?.(transaction.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}