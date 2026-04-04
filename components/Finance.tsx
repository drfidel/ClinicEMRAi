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
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exp.category}</Badge>
                      </TableCell>
                      <TableCell>{exp.description}</TableCell>
                      <TableCell>{exp.payment_method}</TableCell>
                      <TableCell className="text-right font-medium text-rose-600">
                        {exp.amount.toLocaleString()} UGX
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
      </Tabs>
    </div>
  );
};
