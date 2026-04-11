import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Loader2, Plus, Search, FileText, Download, RefreshCcw,
  Banknote, CreditCard, Smartphone, Wallet, PieChart
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';

export const Finance = () => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cashbook, setCashbook] = useState<any[]>([]);
  const [plStatement, setPlStatement] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const { token } = useAuthStore();

  // New Expense Form State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Expense State
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Cancel Expense State
  const [isCancelExpenseModalOpen, setIsCancelExpenseModalOpen] = useState(false);
  const [cancellingExpense, setCancellingExpense] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  // View Expense State
  const [isViewExpenseModalOpen, setIsViewExpenseModalOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<any>(null);

  // Custom Report State
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportCategoryFilter, setReportCategoryFilter] = useState('all');
  const [reportMetrics, setReportMetrics] = useState({
    incomeByService: true,
    expensesByCategory: true,
    netProfit: true
  });
  const [customReportData, setCustomReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, cashRes, plRes, accRes] = await Promise.all([
        axios.get('/api/finance/expenses', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/finance/cashbook', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/finance/pl-statement', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/finance/accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setExpenses(expRes.data);
      setCashbook(cashRes.data);
      setPlStatement(plRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      toast.error('Failed to fetch financial data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const generateCustomReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await axios.post('/api/finance/custom-report', {
        startDate: reportDateRange.startDate,
        endDate: reportDateRange.endDate,
        categoryFilter: reportCategoryFilter,
        metrics: reportMetrics
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomReportData(res.data);
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/finance/expenses', {
        ...newExpense,
        amount: Number(newExpense.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Expense recorded successfully');
      setIsExpenseModalOpen(false);
      setNewExpense({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash'
      });
      fetchData();
    } catch (err) {
      toast.error('Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense || !editingExpense.category || !editingExpense.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.patch(`/api/finance/expenses/${editingExpense.id}`, {
        ...editingExpense,
        amount: Number(editingExpense.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Expense updated successfully');
      setIsEditExpenseModalOpen(false);
      setEditingExpense(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelExpense = async () => {
    if (!cancellingExpense || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.patch(`/api/finance/expenses/${cancellingExpense.id}/cancel`, {
        reason: cancelReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Expense cancelled successfully');
      setIsCancelExpenseModalOpen(false);
      setCancellingExpense(null);
      setCancelReason('');
      fetchData();
    } catch (err) {
      toast.error('Failed to cancel expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading financial records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance & Accounting</h1>
          <p className="text-muted-foreground">Manage expenses, cash flow, and financial reporting.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
            <DialogTrigger render={
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Record Expense
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={newExpense.category} 
                    onValueChange={(val) => setNewExpense({...newExpense, category: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.type === 'EXPENSE').map(acc => (
                        <SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (UGX)</Label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    placeholder="What was this for?" 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select 
                      value={newExpense.payment_method} 
                      onValueChange={(val) => setNewExpense({...newExpense, payment_method: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddExpense} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses" className="gap-2">
            <TrendingDown className="w-4 h-4" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="cashbook" className="gap-2">
            <Banknote className="w-4 h-4" /> Cashbook
          </TabsTrigger>
          <TabsTrigger value="pl" className="gap-2">
            <PieChart className="w-4 h-4" /> P&L Statement
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2">
            <FileText className="w-4 h-4" /> Ledgers
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <PieChart className="w-4 h-4" /> Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Records</CardTitle>
              <CardDescription>Recent operational expenditures.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id} className={exp.status === 'CANCELLED' ? 'opacity-50' : ''}>
                      <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exp.category}</Badge>
                      </TableCell>
                      <TableCell>{exp.description}</TableCell>
                      <TableCell>{exp.payment_method}</TableCell>
                      <TableCell>
                        {exp.status === 'CANCELLED' ? (
                          <Badge variant="destructive">CANCELLED</Badge>
                        ) : (
                          <Badge variant="default" className="bg-emerald-500">ACTIVE</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-600">
                        {exp.amount.toLocaleString()} UGX
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setViewingExpense(exp);
                            setIsViewExpenseModalOpen(true);
                          }}>
                            View
                          </Button>
                          {exp.status !== 'CANCELLED' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingExpense(exp);
                                setIsEditExpenseModalOpen(true);
                              }}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                                setCancellingExpense(exp);
                                setIsCancelExpenseModalOpen(true);
                              }}>
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No expenses recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashbook" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cashbook</CardTitle>
                <CardDescription>Chronological record of all cash inflows and outflows.</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Ref / Method</TableHead>
                    <TableHead className="text-right">Inflow</TableHead>
                    <TableHead className="text-right">Outflow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashbook.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{entry.reference}</span>
                          <span className="text-[10px] text-muted-foreground">{entry.method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {entry.type === 'INFLOW' ? `+${entry.amount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-rose-600 font-medium">
                        {entry.type === 'OUTFLOW' ? `-${entry.amount.toLocaleString()}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {plStatement?.totalIncome.toLocaleString()} UGX
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">
                  {plStatement?.totalExpenses.toLocaleString()} UGX
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Profit / Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${plStatement?.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {plStatement?.netProfit.toLocaleString()} UGX
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(plStatement?.income || {}).map(([cat, amt]: any) => (
                    <div key={cat} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm">{cat}</span>
                      <span className="font-medium">{amt.toLocaleString()} UGX</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(plStatement?.expenses || {}).map(([cat, amt]: any) => (
                    <div key={cat} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm">{cat}</span>
                      <span className="font-medium text-rose-600">{amt.toLocaleString()} UGX</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {accounts.map((acc) => (
              <Card key={acc.id} className="hover:border-primary cursor-pointer transition-colors">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <Badge variant={acc.type === 'INCOME' ? 'default' : acc.type === 'EXPENSE' ? 'destructive' : 'outline'}>
                      {acc.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{acc.id}</span>
                  </div>
                  <CardTitle className="text-sm mt-2">{acc.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>General Ledger View</CardTitle>
              <CardDescription>Select an account above to view detailed ledger entries.</CardDescription>
            </CardHeader>
            <CardContent className="h-32 flex items-center justify-center text-muted-foreground italic">
              Ledger details for selected account will appear here.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Financial Reports</CardTitle>
              <CardDescription>Generate customized reports based on specific criteria.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={reportDateRange.startDate}
                    onChange={(e) => setReportDateRange({...reportDateRange, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={reportDateRange.endDate}
                    onChange={(e) => setReportDateRange({...reportDateRange, endDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expense Category Filter</Label>
                  <Select value={reportCategoryFilter} onValueChange={setReportCategoryFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Array.from(new Set(expenses.map(e => e.category))).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full gap-2" onClick={generateCustomReport} disabled={isGeneratingReport}>
                    {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Generate Report
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 mb-6 p-4 border rounded-md bg-muted/20">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportMetrics.incomeByService}
                    onChange={(e) => setReportMetrics({...reportMetrics, incomeByService: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  Income by Service
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportMetrics.expensesByCategory}
                    onChange={(e) => setReportMetrics({...reportMetrics, expensesByCategory: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  Expenses by Category
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reportMetrics.netProfit}
                    onChange={(e) => setReportMetrics({...reportMetrics, netProfit: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  Net Profit
                </Label>
              </div>

              {customReportData && (
                <div className="space-y-6 border-t pt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Report Results</h3>
                    <div className="text-sm text-muted-foreground">
                      Period: {new Date(reportDateRange.startDate).toLocaleDateString()} - {new Date(reportDateRange.endDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportMetrics.incomeByService && customReportData.incomeByService && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Income by Service
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(customReportData.incomeByService).map(([category, amount]: [string, any]) => (
                              <div key={category} className="flex justify-between text-sm border-b pb-1">
                                <span>{category}</span>
                                <span className="font-medium">{amount.toLocaleString()} UGX</span>
                              </div>
                            ))}
                            {Object.keys(customReportData.incomeByService).length === 0 && (
                              <div className="text-sm text-muted-foreground italic">No income recorded in this period.</div>
                            )}
                            <div className="flex justify-between font-bold pt-2">
                              <span>Total Income</span>
                              <span className="text-emerald-600">{customReportData.totalIncome?.toLocaleString() || 0} UGX</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {reportMetrics.expensesByCategory && customReportData.expensesByCategory && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                            Expenses by Category
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(customReportData.expensesByCategory).map(([category, amount]: [string, any]) => (
                              <div key={category} className="flex justify-between text-sm border-b pb-1">
                                <span>{category}</span>
                                <span className="font-medium">{amount.toLocaleString()} UGX</span>
                              </div>
                            ))}
                            {Object.keys(customReportData.expensesByCategory).length === 0 && (
                              <div className="text-sm text-muted-foreground italic">No expenses recorded in this period.</div>
                            )}
                            <div className="flex justify-between font-bold pt-2">
                              <span>Total Expenses</span>
                              <span className="text-rose-600">{customReportData.totalExpenses?.toLocaleString() || 0} UGX</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {reportMetrics.netProfit && customReportData.netProfit !== undefined && (
                    <Card className={customReportData.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}>
                      <CardContent className="p-6 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                          <h3 className={`text-3xl font-bold ${customReportData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {customReportData.netProfit.toLocaleString()} UGX
                          </h3>
                        </div>
                        <div className={`p-4 rounded-full ${customReportData.netProfit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          <DollarSign className="w-8 h-8" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Expense Modal */}
      <Dialog open={isViewExpenseModalOpen} onOpenChange={setIsViewExpenseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Date</Label>
                  <p className="font-medium">{new Date(viewingExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div>
                    {viewingExpense.status === 'CANCELLED' ? (
                      <Badge variant="destructive">CANCELLED</Badge>
                    ) : (
                      <Badge variant="default" className="bg-emerald-500">ACTIVE</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Category</Label>
                  <p className="font-medium">{viewingExpense.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Payment Method</Label>
                  <p className="font-medium">{viewingExpense.payment_method}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Amount</Label>
                  <p className="text-xl font-bold text-rose-600">{viewingExpense.amount.toLocaleString()} UGX</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="font-medium">{viewingExpense.description}</p>
                </div>
                {viewingExpense.status === 'CANCELLED' && (
                  <>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">Cancellation Reason</Label>
                      <p className="font-medium text-destructive">{viewingExpense.cancellation_reason}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Cancelled By</Label>
                      <p className="font-medium">{viewingExpense.cancelled_by}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Cancelled At</Label>
                      <p className="font-medium">{new Date(viewingExpense.cancelled_at).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={isEditExpenseModalOpen} onOpenChange={setIsEditExpenseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category*</Label>
                  <Select 
                    value={editingExpense.category} 
                    onValueChange={(val) => setEditingExpense({...editingExpense, category: val})}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Staff Salaries">Staff Salaries</SelectItem>
                      <SelectItem value="Utility Expenses">Utility Expenses</SelectItem>
                      <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                      <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (UGX)*</Label>
                  <Input 
                    type="number" 
                    value={editingExpense.amount} 
                    onChange={(e) => setEditingExpense({...editingExpense, amount: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={editingExpense.description} 
                  onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})} 
                  placeholder="What was this expense for?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={editingExpense.date} 
                    onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select 
                    value={editingExpense.payment_method} 
                    onValueChange={(val) => setEditingExpense({...editingExpense, payment_method: val})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full mt-4" onClick={handleEditExpense} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Update Expense
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Expense Modal */}
      <Dialog open={isCancelExpenseModalOpen} onOpenChange={setIsCancelExpenseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancel Expense</DialogTitle>
            <CardDescription>
              Are you sure you want to cancel this expense? This action will reverse the expense and cannot be undone.
            </CardDescription>
          </DialogHeader>
          {cancellingExpense && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/20 rounded-md border text-sm">
                <p><strong>Expense:</strong> {cancellingExpense.category} - {cancellingExpense.description}</p>
                <p><strong>Amount:</strong> {cancellingExpense.amount.toLocaleString()} UGX</p>
                <p><strong>Date:</strong> {new Date(cancellingExpense.date).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <Label>Reason for Cancellation*</Label>
                <Input 
                  value={cancelReason} 
                  onChange={(e) => setCancelReason(e.target.value)} 
                  placeholder="e.g. Entered by mistake, Refunded"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsCancelExpenseModalOpen(false)}>Close</Button>
                <Button variant="destructive" onClick={handleCancelExpense} disabled={isSubmitting || !cancelReason.trim()}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
