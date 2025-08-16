import { useState, useCallback, useRef } from "react";
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
  X,
  Plus,
  Trash2
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
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";

interface ValidationResult {
  rowIndex: number;
  data: {
    date: string;
    description: string;
    incomeAmount: number;
    spendingAmount: number;
    capexAmount: number;
    category: string;
    source: string;
    transactionType: string;
    currency: string;
    nonEurSpending: string;
    year: string;
    month: string;
    amount: number;
  };
  status: 'valid' | 'invalid' | 'category_mismatch' | 'duplicate';
  issues: string[];
}

export default function Import() {
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [newCategories, setNewCategories] = useState<Set<string>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    setImportStatus('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiClient.request('/import/upload', {
        method: 'POST',
        body: formData
        // Don't override headers - let apiClient set the Authorization header
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setValidationResults(response.validationResults);
        setImportStatus('completed');
        
        // Auto-select valid transactions
        const validIndices = response.validationResults
          .filter((result: ValidationResult) => result.status === 'valid')
          .map((result: ValidationResult) => result.rowIndex);
        setSelectedTransactions(new Set(validIndices));

        toast({
          title: "File uploaded successfully",
          description: `${response.totalTransactions} transactions processed`,
        });
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setImportStatus('idle');
      setUploadProgress(0);
      
      toast({
        title: "Upload failed",
        description: error.message || 'Failed to upload file',
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'));

    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please drop a CSV file",
        variant: "destructive",
      });
    }
  }, [handleFileUpload, toast]);

  const handleDropZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.request('/import/template');
      
      if (response.success) {
        // Convert template to CSV format
        const headers = response.headers;
        const csvContent = [
          headers.join(','),
          ...response.template.map((row: any) => 
            headers.map(header => `"${row[header]}"`).join(',')
          )
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transaction_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Template downloaded",
          description: "CSV template saved to your downloads",
        });
      }
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleImportSelected = async () => {
    if (selectedTransactions.size === 0) {
      toast({
        title: "No transactions selected",
        description: "Please select transactions to import",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionsToImport = validationResults
        .filter((result, index) => selectedTransactions.has(index))
        .map(result => result.data);

      const response = await apiClient.request('/import/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: transactionsToImport }),
      });

      if (response.success) {
        toast({
          title: "Import successful",
          description: `${response.importedCount} transactions imported successfully`,
        });
        
        // Reset state
        setImportStatus('idle');
        setValidationResults([]);
        setSelectedTransactions(new Set());
        setNewCategories(new Set());
      } else {
        throw new Error(response.error || 'Import failed');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      let errorMessage = 'Failed to import transactions';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.errors && Array.isArray(error.errors)) {
        // Handle validation errors
        const validationErrors = error.errors.map((err: any) => 
          `${err.path}: ${err.msg}`
        ).join(', ');
        errorMessage = `Validation errors: ${validationErrors}`;
      }
      
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleTransactionSelection = (index: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAllTransactions = () => {
    if (selectedTransactions.size === validationResults.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(validationResults.map((_, index) => index)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="secondary" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
      case 'category_mismatch':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Category Issue</Badge>;
      case 'duplicate':
        return <Badge variant="secondary" className="text-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Duplicate</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Invalid</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const validTransactions = validationResults.filter(t => t.status === 'valid').length;
  const totalTransactions = validationResults.length;
  const selectedCount = selectedTransactions.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Transactions</h1>
          <p className="text-muted-foreground">
            Import transactions from CSV files with validation
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          
          {importStatus === 'completed' && selectedCount > 0 && (
            <Button onClick={handleImportSelected}>
              <Plus className="w-4 h-4 mr-2" />
              Import {selectedCount} Transactions
            </Button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      {importStatus === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={dropZoneRef}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragOver
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-muted hover:border-primary/50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleDropZoneClick}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors duration-200 ${
                isDragOver ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <h3 className="text-lg font-medium mb-2">
                {isDragOver ? 'Drop your CSV file here' : 'Drop your CSV file here'}
              </h3>
              <p className="text-muted-foreground mb-4">
                or click to browse files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" onClick={(e) => e.stopPropagation()}>
                <Button asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Date:</strong> DD/MM/YYYY or YYYY-MM-DD format (required)</p>
                <p>• <strong>Year:</strong> Year value (auto-generated from date)</p>
                <p>• <strong>Month:</strong> Month value (auto-generated from date)</p>
                <p>• <strong>Details / Description:</strong> Transaction description (required)</p>
                <p>• <strong>Income Amount:</strong> Amount for income transactions (0.00 if not income)</p>
                <p>• <strong>Spending Amount:</strong> Amount for expense transactions (0.00 if not expense)</p>
                <p>• <strong>Capex Amount:</strong> Amount for capital expenditure transactions (0.00 if not capex)</p>
                <p>• <strong>Category:</strong> Transaction category (required)</p>
                <p>• <strong>Source / Bank:</strong> Bank or account name (required)</p>
                <p>• <strong>Transaction Type:</strong> income, expense, or capex (required)</p>
                <p>• <strong>Currency:</strong> Transaction currency (required)</p>
                <p>• <strong>Spending for non-EUR currency:</strong> Non-EUR spending amount (optional)</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{validTransactions}</div>
                <p className="text-sm text-muted-foreground">Valid Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {validationResults.filter(t => t.status === 'category_mismatch').length}
                </div>
                <p className="text-sm text-muted-foreground">Category Issues</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {validationResults.filter(t => t.status === 'duplicate').length}
                </div>
                <p className="text-sm text-muted-foreground">Duplicates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{selectedCount}</div>
                <p className="text-sm text-muted-foreground">Selected for Import</p>
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
              <div className="flex items-center justify-between">
                <CardTitle>Import Preview</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAllTransactions}>
                    {selectedTransactions.size === validationResults.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.size === validationResults.length}
                        onChange={toggleAllTransactions}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(index)}
                          onChange={() => toggleTransactionSelection(index)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(result.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {result.data.date}
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.data.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.data.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            result.data.transactionType === 'income' ? 'secondary' : 
                            result.data.transactionType === 'capex' ? 'default' : 
                            'destructive'
                          }
                          className={
                            result.data.transactionType === 'income' ? 'text-green-600 bg-green-50' :
                            result.data.transactionType === 'capex' ? 'text-blue-600 bg-blue-50' :
                            'text-red-600 bg-red-50'
                          }
                        >
                          {result.data.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className={
                        result.data.transactionType === 'income' ? 'text-green-600' :
                        result.data.transactionType === 'capex' ? 'text-blue-600' :
                        'text-red-600'
                      }>
                        ${result.data.amount?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        {result.data.source}
                      </TableCell>
                      <TableCell>
                        {result.issues.length > 0 && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {result.issues.map((issue, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                {issue}
                              </div>
                            ))}
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