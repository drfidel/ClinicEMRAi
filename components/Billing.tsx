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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const { token } = useAuthStore();

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/billing/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(res.data);
    } catch (err) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  const handlePayment = async (id: number, method: string, ref?: string) => {
    try {
      await axios.patch(`/api/billing/invoices/${id}/pay`, { 
        method, 
        reference_number: ref 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Payment of ${method} processed for Invoice #${id}`);
      setSelectedPaymentMethod(null);
      setReferenceNumber('');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to process payment');
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    String(inv.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(inv.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
            PAID
          </Badge>
        );
      case 'PARTIALLY PAID':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
            PARTIALLY PAID
          </Badge>
        );
      case 'UNPAID':
      default:
        return (
          <Badge variant="destructive">
            UNPAID
          </Badge>
        );
    }
  };

  const totalPending = invoices
    .filter(inv => inv.status === 'UNPAID' || inv.status === 'PARTIALLY PAID')
    .reduce((sum, inv) => sum + (inv.amount - (inv.paid_amount || 0)), 0);

  const totalCollectedToday = invoices
    .filter(inv => inv.status === 'PAID' || inv.status === 'PARTIALLY PAID')
    .reduce((sum, inv) => sum + (inv.paid_amount || (inv.status === 'PAID' ? inv.amount : 0)), 0);

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
            <div className="text-2xl font-bold">{totalPending.toLocaleString()} UGX</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCollectedToday.toLocaleString()} UGX</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invoices Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search invoice or patient..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={fetchInvoices} variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Amount (UGX)</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading invoices...</TableCell>
                </TableRow>
              ) : filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono">INV-{inv.id.toString().padStart(5, '0')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{inv.name}</div>
                    <div className="text-xs text-muted-foreground">{inv.patient_id}</div>
                  </TableCell>
                  <TableCell>{inv.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {getStatusBadge(inv.status)}
                  </TableCell>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-2" />}>
                        <Receipt className="w-4 h-4" /> View Details
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Invoice Details - INV-{inv.id.toString().padStart(5, '0')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Patient:</span>
                              <span className="font-medium">{inv.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Patient ID:</span>
                              <span className="font-medium">{inv.patient_id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Date:</span>
                              <span className="font-medium">{inv.date}</span>
                            </div>
                            {inv.encounter_id && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Encounter ID:</span>
                                <span className="font-medium">ENC-{inv.encounter_id.toString().padStart(5, '0')}</span>
                              </div>
                            )}
                            {inv.status === 'PARTIALLY PAID' && (
                              <>
                                <div className="flex justify-between text-sm pt-2 border-t mt-2">
                                  <span className="text-muted-foreground">Paid Amount:</span>
                                  <span className="font-medium text-emerald-600">{inv.paid_amount?.toLocaleString()} UGX</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Balance:</span>
                                  <span className="font-medium text-rose-600">{(inv.amount - (inv.paid_amount || 0)).toLocaleString()} UGX</span>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Items Breakdown</Label>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableBody>
                                  {inv.items?.map((item: any, idx: number) => (
                                    <TableRow key={idx} className="text-xs">
                                      <TableCell className="py-2">{item.description}</TableCell>
                                      <TableCell className="py-2 text-right">{item.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow className="font-bold bg-muted/50">
                                    <TableCell className="py-2">Total</TableCell>
                                    <TableCell className="py-2 text-right">{inv.amount.toLocaleString()} UGX</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {inv.status === 'UNPAID' ? (
                            <div className="space-y-3 pt-4">
                              <Label className="text-xs uppercase text-muted-foreground">Collect Payment</Label>
                              {!selectedPaymentMethod ? (
                                <div className="grid grid-cols-2 gap-2">
                                  <Button 
                                    variant="outline" 
                                    className="h-16 flex-col gap-1 text-xs"
                                    onClick={() => handlePayment(inv.id, 'Cash')}
                                  >
                                    <Banknote className="w-5 h-5" />
                                    Cash
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="h-16 flex-col gap-1 border-yellow-500 text-yellow-700 hover:bg-yellow-50 text-xs"
                                    onClick={() => setSelectedPaymentMethod('MTN MoMo')}
                                  >
                                    <Smartphone className="w-5 h-5" />
                                    MTN MoMo
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="h-16 flex-col gap-1 border-red-500 text-red-700 hover:bg-red-50 text-xs"
                                    onClick={() => setSelectedPaymentMethod('Airtel Money')}
                                  >
                                    <Smartphone className="w-5 h-5" />
                                    Airtel Money
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="h-16 flex-col gap-1 text-xs"
                                    onClick={() => handlePayment(inv.id, 'Insurance')}
                                  >
                                    <CreditCard className="w-5 h-5" />
                                    Insurance
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium flex items-center gap-2">
                                      <Smartphone className="w-4 h-4" />
                                      {selectedPaymentMethod}
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedPaymentMethod(null)}>Change</Button>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="ref-no">Transaction Reference Number</Label>
                                    <Input 
                                      id="ref-no" 
                                      placeholder="Enter MoMo Ref ID" 
                                      value={referenceNumber}
                                      onChange={(e) => setReferenceNumber(e.target.value)}
                                    />
                                  </div>
                                  <Button 
                                    className="w-full" 
                                    disabled={!referenceNumber.trim()}
                                    onClick={() => handlePayment(inv.id, selectedPaymentMethod, referenceNumber)}
                                  >
                                    Confirm Payment
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="pt-4 space-y-2">
                              <div className="text-center">
                                <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-1">
                                  Paid via {inv.payment_method}
                                </Badge>
                              </div>
                              {inv.reference_number && (
                                <div className="text-center text-xs text-muted-foreground">
                                  Ref: {inv.reference_number}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
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
