import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  X,
  Plus,
  Trash2,
  Building2,
  Edit3,
  Check
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  
  // BOI Statement import state
  const [boiImportStatus, setBoiImportStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed'>('idle');
  const [boiUploadProgress, setBoiUploadProgress] = useState(0);
  const [boiValidationResults, setBoiValidationResults] = useState<ValidationResult[]>([]);
  const [selectedBoiTransactions, setSelectedBoiTransactions] = useState<Set<number>>(new Set());
  const [isBoiDragOver, setIsBoiDragOver] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const pdfDropZoneRef = useRef<HTMLDivElement>(null);
  
  // Inline editing state for CSV import
  const [editingCsvTransaction, setEditingCsvTransaction] = useState<number | null>(null);
  const [csvEditValues, setCsvEditValues] = useState<{[key: number]: {description: string, category: string, type: string}}>({});
  
  // Inline editing state for BOI import  
  const [editingBoiTransaction, setEditingBoiTransaction] = useState<number | null>(null);
  const [boiEditValues, setBoiEditValues] = useState<{[key: number]: {description: string, category: string, type: string}}>({});
  
  // Categories for dropdowns
  const [categories, setCategories] = useState<string[]>([]);
  
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

  // BOI PDF upload handler
  const handleBoiPdfUpload = useCallback(async (file: File) => {
    if (!file) return;

    setBoiImportStatus('uploading');
    setBoiUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('pdfFile', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setBoiUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await apiClient.request('/import/boi-upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setBoiUploadProgress(100);

      if (response.success) {
        setBoiValidationResults(response.validationResults);
        setBoiImportStatus('completed');
        
        // Auto-select valid transactions
        const validIndices = response.validationResults
          .filter((result: ValidationResult) => result.status === 'valid')
          .map((result: ValidationResult) => result.rowIndex);
        setSelectedBoiTransactions(new Set(validIndices));

        toast({
          title: "BOI Statement processed successfully",
          description: `${response.totalTransactions} transactions found`,
        });
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('BOI upload error:', error);
      setBoiImportStatus('idle');
      setBoiUploadProgress(0);
      
      toast({
        title: "BOI Statement upload failed",
        description: error.message || 'Failed to process PDF statement',
        variant: "destructive",
      });
    }
  }, [toast]);

  const handlePdfFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBoiPdfUpload(file);
    }
  }, [handleBoiPdfUpload]);

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

  // BOI PDF drag and drop handlers
  const handleBoiDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBoiDragOver(true);
  }, []);

  const handleBoiDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBoiDragOver(false);
  }, []);

  const handleBoiDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleBoiDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBoiDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));

    if (pdfFile) {
      handleBoiPdfUpload(pdfFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please drop a PDF file",
        variant: "destructive",
      });
    }
  }, [handleBoiPdfUpload, toast]);

  const handlePdfDropZoneClick = useCallback(() => {
    pdfFileInputRef.current?.click();
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

  // BOI transaction selection handlers
  const toggleBoiTransactionSelection = (index: number) => {
    const newSelected = new Set(selectedBoiTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedBoiTransactions(newSelected);
  };

  const toggleAllBoiTransactions = () => {
    if (selectedBoiTransactions.size === boiValidationResults.length) {
      setSelectedBoiTransactions(new Set());
    } else {
      setSelectedBoiTransactions(new Set(boiValidationResults.map((_, index) => index)));
    }
  };

  // BOI import handler
  const handleImportSelectedBoi = async () => {
    if (selectedBoiTransactions.size === 0) {
      toast({
        title: "No transactions selected",
        description: "Please select transactions to import",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionsToImport = boiValidationResults
        .filter((result, index) => selectedBoiTransactions.has(index))
        .map(result => result.data);

      const response = await apiClient.request('/import/boi-import', {
        method: 'POST',
        body: JSON.stringify({ transactions: transactionsToImport }),
      });

      if (response.success) {
        toast({
          title: "BOI import successful",
          description: `${response.importedCount} transactions imported successfully`,
        });
        
        // Reset state
        setBoiImportStatus('idle');
        setBoiValidationResults([]);
        setSelectedBoiTransactions(new Set());
      } else {
        throw new Error(response.error || 'Import failed');
      }
    } catch (error: any) {
      console.error('BOI import error:', error);
      let errorMessage = 'Failed to import transactions';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.errors && Array.isArray(error.errors)) {
        const validationErrors = error.errors.map((err: any) => 
          `${err.path}: ${err.msg}`
        ).join(', ');
        errorMessage = `Validation errors: ${validationErrors}`;
      }
      
      toast({
        title: "BOI import failed",
        description: errorMessage,
        variant: "destructive",
      });
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

  const validBoiTransactions = boiValidationResults.filter(t => t.status === 'valid').length;
  const totalBoiTransactions = boiValidationResults.length;
  const selectedBoiCount = selectedBoiTransactions.size;

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiClient.request('/categories', { method: 'GET' });
        if (response.categories) {
          setCategories(response.categories.map((cat: any) => cat.name));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // CSV Editing functions
  const startCsvEdit = (index: number, result: ValidationResult) => {
    setEditingCsvTransaction(index);
    setCsvEditValues({
      ...csvEditValues,
      [index]: {
        description: result.data.description,
        category: result.data.category,
        type: result.data.transactionType
      }
    });
  };

  const saveCsvEdit = (index: number) => {
    const editedValues = csvEditValues[index];
    if (editedValues) {
      // Update the validation results with edited values
      setValidationResults(prev => prev.map((result, i) => 
        i === index ? {
          ...result,
          data: {
            ...result.data,
            description: editedValues.description,
            category: editedValues.category,
            transactionType: editedValues.type
          }
        } : result
      ));
    }
    setEditingCsvTransaction(null);
  };

  const cancelCsvEdit = () => {
    setEditingCsvTransaction(null);
  };

  // BOI Editing functions
  const startBoiEdit = (index: number, result: ValidationResult) => {
    setEditingBoiTransaction(index);
    setBoiEditValues({
      ...boiEditValues,
      [index]: {
        description: result.data.description,
        category: result.data.category,
        type: result.data.type
      }
    });
  };

  const saveBoiEdit = (index: number) => {
    const editedValues = boiEditValues[index];
    if (editedValues) {
      // Update the validation results with edited values
      setBoiValidationResults(prev => prev.map((result, i) => 
        i === index ? {
          ...result,
          data: {
            ...result.data,
            description: editedValues.description,
            category: editedValues.category,
            type: editedValues.type
          }
        } : result
      ));
    }
    setEditingBoiTransaction(null);
  };

  const cancelBoiEdit = () => {
    setEditingBoiTransaction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Transactions</h1>
          <p className="text-muted-foreground">
            Import transactions from CSV files or BOI PDF statements
          </p>
        </div>
      </div>

      <Tabs defaultValue="csv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            CSV Import
          </TabsTrigger>
          <TabsTrigger value="boi" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            BOI Statement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-6">
          {/* Header for CSV */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">CSV File Import</h2>
              <p className="text-muted-foreground text-sm">
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
                    <TableHead>Actions</TableHead>
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
                        {editingCsvTransaction === index ? (
                          <Input
                            value={csvEditValues[index]?.description || result.data.description}
                            onChange={(e) => setCsvEditValues({
                              ...csvEditValues,
                              [index]: { ...csvEditValues[index], description: e.target.value }
                            })}
                            className="w-full"
                          />
                        ) : (
                          result.data.description
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCsvTransaction === index ? (
                          <Select
                            value={csvEditValues[index]?.category || result.data.category}
                            onValueChange={(value) => setCsvEditValues({
                              ...csvEditValues,
                              [index]: { ...csvEditValues[index], category: value }
                            })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{result.data.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCsvTransaction === index ? (
                          <Select
                            value={csvEditValues[index]?.type || result.data.transactionType}
                            onValueChange={(value) => setCsvEditValues({
                              ...csvEditValues,
                              [index]: { ...csvEditValues[index], type: value }
                            })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                              <SelectItem value="capex">Capex</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
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
                        )}
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
                      <TableCell>
                        {editingCsvTransaction === index ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveCsvEdit(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelCsvEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startCsvEdit(index, result)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
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
        </TabsContent>

        <TabsContent value="boi" className="space-y-6">
          {/* Header for BOI */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">BOI PDF Statement Import</h2>
              <p className="text-muted-foreground text-sm">
                Import transactions from Bank of Ireland PDF statements
              </p>
            </div>
            
            {boiImportStatus === 'completed' && selectedBoiCount > 0 && (
              <Button onClick={handleImportSelectedBoi}>
                <Plus className="w-4 h-4 mr-2" />
                Import {selectedBoiCount} Transactions
              </Button>
            )}
          </div>

          {/* BOI Upload Section */}
          {boiImportStatus === 'idle' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload BOI PDF Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={pdfDropZoneRef}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                    isBoiDragOver
                      ? 'border-primary bg-primary/5 scale-105'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onDragEnter={handleBoiDragEnter}
                  onDragLeave={handleBoiDragLeave}
                  onDragOver={handleBoiDragOver}
                  onDrop={handleBoiDrop}
                  onClick={handlePdfDropZoneClick}
                >
                  <Building2 className={`w-12 h-12 mx-auto mb-4 transition-colors duration-200 ${
                    isBoiDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <h3 className="text-lg font-medium mb-2">
                    {isBoiDragOver ? 'Drop your BOI PDF statement here' : 'Drop your BOI PDF statement here'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    or click to browse files
                  </p>
                  <input
                    ref={pdfFileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfFileInputChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" onClick={(e) => e.stopPropagation()}>
                    <Button asChild>
                      <span>Choose PDF File</span>
                    </Button>
                  </label>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">BOI Statement Requirements:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• <strong>File Format:</strong> PDF statement from Bank of Ireland</p>
                    <p>• <strong>Content:</strong> Transaction details with dates, descriptions, and amounts</p>
                    <p>• <strong>Processing:</strong> Automatically categorizes transactions based on description</p>
                    <p>• <strong>Transaction Types:</strong> Payment-in = Income, Payment-out = Expense</p>
                    <p>• <strong>Categories:</strong> Intelligent matching based on merchant names and history</p>
                    <p>• <strong>Exclusions:</strong> Balance forward entries are automatically excluded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BOI Upload Progress */}
          {(boiImportStatus === 'uploading' || boiImportStatus === 'processing') && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Building2 className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {boiImportStatus === 'uploading' ? 'Processing BOI statement...' : 'Analyzing transactions...'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {boiImportStatus === 'uploading' 
                          ? 'Please wait while your PDF statement is being processed'
                          : 'Extracting transaction data and suggesting categories'
                        }
                      </p>
                    </div>
                  </div>
                  <Progress value={boiUploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* BOI Import Results */}
          {boiImportStatus === 'completed' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{validBoiTransactions}</div>
                    <p className="text-sm text-muted-foreground">Valid Transactions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">
                      {boiValidationResults.filter(t => t.status === 'category_mismatch').length}
                    </div>
                    <p className="text-sm text-muted-foreground">New Categories</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">
                      {boiValidationResults.filter(t => t.status === 'duplicate').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Duplicates</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">{selectedBoiCount}</div>
                    <p className="text-sm text-muted-foreground">Selected for Import</p>
                  </CardContent>
                </Card>
              </div>

              {/* BOI Issues Alert */}
              {totalBoiTransactions > validBoiTransactions && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {totalBoiTransactions - validBoiTransactions} transactions require attention before import.
                    Please review and fix the issues below.
                  </AlertDescription>
                </Alert>
              )}

              {/* BOI Import Preview Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>BOI Import Preview</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={toggleAllBoiTransactions}>
                        {selectedBoiTransactions.size === boiValidationResults.length ? 'Deselect All' : 'Select All'}
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
                            checked={selectedBoiTransactions.size === boiValidationResults.length}
                            onChange={toggleAllBoiTransactions}
                            className="rounded"
                          />
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boiValidationResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedBoiTransactions.has(index)}
                              onChange={() => toggleBoiTransactionSelection(index)}
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
                            {editingBoiTransaction === index ? (
                              <Input
                                value={boiEditValues[index]?.description || result.data.description}
                                onChange={(e) => setBoiEditValues({
                                  ...boiEditValues,
                                  [index]: { ...boiEditValues[index], description: e.target.value }
                                })}
                                className="w-full"
                              />
                            ) : (
                              result.data.description
                            )}
                          </TableCell>
                          <TableCell>
                            {editingBoiTransaction === index ? (
                              <Select
                                value={boiEditValues[index]?.category || result.data.category}
                                onValueChange={(value) => setBoiEditValues({
                                  ...boiEditValues,
                                  [index]: { ...boiEditValues[index], category: value }
                                })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline">{result.data.category}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingBoiTransaction === index ? (
                              <Select
                                value={boiEditValues[index]?.type || result.data.type}
                                onValueChange={(value) => setBoiEditValues({
                                  ...boiEditValues,
                                  [index]: { ...boiEditValues[index], type: value }
                                })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="income">Income</SelectItem>
                                  <SelectItem value="expense">Expense</SelectItem>
                                  <SelectItem value="capex">Capex</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge 
                                variant={
                                  result.data.type === 'income' ? 'secondary' : 
                                  result.data.type === 'capex' ? 'default' : 
                                  'destructive'
                                }
                                className={
                                  result.data.type === 'income' ? 'text-green-600 bg-green-50' :
                                  result.data.type === 'capex' ? 'text-blue-600 bg-blue-50' :
                                  'text-red-600 bg-red-50'
                                }
                              >
                                {result.data.type}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={
                            result.data.type === 'income' ? 'text-green-600' :
                            result.data.type === 'capex' ? 'text-blue-600' :
                            'text-red-600'
                          }>
                            €{result.data.amount?.toFixed(2) || '0.00'}
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
                          <TableCell>
                            {editingBoiTransaction === index ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => saveBoiEdit(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelBoiEdit}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startBoiEdit(index, result)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}