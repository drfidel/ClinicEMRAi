import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, CreditCard, Smartphone, Banknote, Search } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';

export const Billing = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    // Mock data for billing
    setInvoices([
      { id: 1, patient_id: 'UGN-2026-0001', name: 'Okello David', amount: 45000, status: 'UNPAID', date: '2026-03-24' },
      { id: 2, patient_id: 'UGN-2026-0005', name: 'Atim Grace', amount: 120000, status: 'PAID', date: '2026-03-24' },
    ]);
  }, []);

  const handlePayment = (id: number, method: string) => {
    toast.success(`Payment of ${method} processed for Invoice #${id}`);
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'PAID' } : inv));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Payments</h2>
          <p className="text-muted-foreground">Manage invoices and collect payments</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">450,000 UGX</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collected Today (Cash)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">820,000 UGX</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collected Today (MoMo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,150,000 UGX</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoice or patient..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Amount (UGX)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono">INV-{inv.id.toString().padStart(5, '0')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{inv.name}</div>
                    <div className="text-xs text-muted-foreground">{inv.patient_id}</div>
                  </TableCell>
                  <TableCell>{inv.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'PAID' ? 'default' : 'destructive'}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell className="text-right">
                    {inv.status === 'UNPAID' && (
                      <Dialog>
                        <DialogTrigger render={<Button size="sm" variant="outline" />}>
                          Collect Payment
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Collect Payment - {inv.amount.toLocaleString()} UGX</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <Button 
                              variant="outline" 
                              className="h-24 flex-col gap-2"
                              onClick={() => handlePayment(inv.id, 'Cash')}
                            >
                              <Banknote className="w-8 h-8" />
                              Cash
                            </Button>
                            <Button 
                              variant="outline" 
                              className="h-24 flex-col gap-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                              onClick={() => handlePayment(inv.id, 'MTN MoMo')}
                            >
                              <Smartphone className="w-8 h-8" />
                              MTN MoMo
                            </Button>
                            <Button 
                              variant="outline" 
                              className="h-24 flex-col gap-2 border-red-500 text-red-700 hover:bg-red-50"
                              onClick={() => handlePayment(inv.id, 'Airtel Money')}
                            >
                              <Smartphone className="w-8 h-8" />
                              Airtel Money
                            </Button>
                            <Button 
                              variant="outline" 
                              className="h-24 flex-col gap-2"
                              onClick={() => handlePayment(inv.id, 'Insurance')}
                            >
                              <CreditCard className="w-8 h-8" />
                              Insurance
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button variant="ghost" size="sm" className="ml-2">
                      <Receipt className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
