import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock CSV import data
const mockImportData = [
  {
    id: 1,
    date: "2025-02-20",
    description: "Whole Foods Market",
    income: 0,
    spending: 78.00,
    category: "Groceries",
    bank: "Chase",
    otherCurrency: "",
    remarks: "Weekly shopping",
    status: "valid" as const,
    issues: [],
  },
  {
    id: 2,
    date: "2025-02-19",
    description: "Netflix Subscription",
    income: 0,
    spending: 15.99,
    category: "Entertainment",
    bank: "Chase",
    otherCurrency: "",
    remarks: "Monthly subscription",
    status: "category_mismatch" as const,
    issues: ["Category 'Entertainment' not found. Suggested: 'Subscription'"],
  },
  {
    id: 3,
    date: "2025-02-18",
    description: "Salary Deposit",
    income: 5000.00,
    spending: 0,
    category: "Income",
    bank: "Chase",
    otherCurrency: "",
    remarks: "Monthly salary",
    status: "duplicate" as const,
    issues: ["Potential duplicate of transaction on 2025-02-15"],
  },
  {
    id: 4,
    date: "2025-02-17",
    description: "Starbucks Coffee",
    income: 0,
    spending: 5.50,
    category: "Food",
    bank: "Chase",
    otherCurrency: "",
    remarks: "Morning coffee",
    status: "category_mismatch" as const,
    issues: ["Category 'Food' not found. Suggested: 'Dining'"],
  },
];

export default function Import() {
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importData, setImportData] = useState(mockImportData);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('uploading');
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setImportStatus('processing');
          
          // Simulate processing
          setTimeout(() => {
            setImportStatus('completed');
          }, 2000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="secondary" className="text-success"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
      case 'category_mismatch':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Category Issue</Badge>;
      case 'duplicate':
        return <Badge variant="secondary" className="text-warning"><AlertTriangle className="w-3 h-3 mr-1" />Duplicate</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const validTransactions = importData.filter(t => t.status === 'valid').length;
  const totalTransactions = importData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Transactions</h1>
          <p className="text-muted-foreground">
            Import transactions from CSV files
          </p>
        </div>
        
        {importStatus === 'completed' && (
          <Button>
            Import {validTransactions} Valid Transactions
          </Button>
        )}
      </div>

      {/* Upload Section */}
      {importStatus === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Drop your CSV file here</h3>
              <p className="text-muted-foreground mb-4">
                or click to browse files
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>date:</strong> YYYY-MM-DD format</p>
                <p>• <strong>description:</strong> Transaction description</p>
                <p>• <strong>income:</strong> Income amount (0 if expense)</p>
                <p>• <strong>spending:</strong> Expense amount (0 if income)</p>
                <p>• <strong>category:</strong> Transaction category</p>
                <p>• <strong>bank:</strong> Bank or account name</p>
                <p>• <strong>other_currency_amount:</strong> Optional foreign currency amount</p>
                <p>• <strong>remarks:</strong> Additional notes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {(importStatus === 'uploading' || importStatus === 'processing') && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-medium">
                    {importStatus === 'uploading' ? 'Uploading file...' : 'Processing transactions...'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {importStatus === 'uploading' 
                      ? 'Please wait while your file is being uploaded'
                      : 'Validating data and checking for duplicates'
                    }
                  </p>
                </div>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importStatus === 'completed' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-success">{validTransactions}</div>
                <p className="text-sm text-muted-foreground">Valid Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-warning">
                  {importData.filter(t => t.status === 'category_mismatch').length}
                </div>
                <p className="text-sm text-muted-foreground">Category Issues</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-destructive">
                  {importData.filter(t => t.status === 'duplicate').length}
                </div>
                <p className="text-sm text-muted-foreground">Potential Duplicates</p>
              </CardContent>
            </Card>
          </div>

          {/* Issues Alert */}
          {totalTransactions > validTransactions && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {totalTransactions - validTransactions} transactions require attention before import.
                Please review and fix the issues below.
              </AlertDescription>
            </Alert>
          )}

          {/* Import Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle>Import Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Income</TableHead>
                    <TableHead>Spending</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.date}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell className="text-success">
                        {transaction.income > 0 ? `$${transaction.income.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {transaction.spending > 0 ? `$${transaction.spending.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {transaction.issues.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {transaction.issues[0]}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}