import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, CreditCard, Smartphone, Banknote, Search, Plus, Trash2, Edit2, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';

export const Billing = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // POS / New Invoice State
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    patient_id: '',
    name: '',
    items: [{ description: '', amount: '' }]
  });

  // Edit Invoice State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editInvoiceForm, setEditInvoiceForm] = useState({
    patient_id: '',
    name: '',
    items: [{ description: '', amount: '' }]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handlePayment = async (id: number, method: string, ref?: string, amount?: number) => {
    try {
      setIsSubmitting(true);
      await axios.patch(`/api/billing/invoices/${id}/pay`, { 
        method, 
        reference_number: ref,
        amount: amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Payment processed for Invoice #${id}`);
      setSelectedPaymentMethod(null);
      setReferenceNumber('');
      setPaymentAmount('');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoiceForm.name || !newInvoiceForm.patient_id) {
      toast.error('Please fill in patient details');
      return;
    }
    
    const validItems = newInvoiceForm.items.filter(item => item.description && item.amount);
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      setIsSubmitting(true);
      const totalAmount = validItems.reduce((sum, item) => sum + Number(item.amount), 0);
      await axios.post('/api/billing/invoices', {
        ...newInvoiceForm,
        items: validItems.map(item => ({ ...item, amount: Number(item.amount) })),
        amount: totalAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice created successfully');
      setIsNewInvoiceModalOpen(false);
      setNewInvoiceForm({ patient_id: '', name: '', items: [{ description: '', amount: '' }] });
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;

    const validItems = editInvoiceForm.items.filter(item => item.description && item.amount);
    try {
      setIsSubmitting(true);
      const totalAmount = validItems.reduce((sum, item) => sum + Number(item.amount), 0);
      await axios.patch(`/api/billing/invoices/${editingInvoice.id}`, {
        ...editInvoiceForm,
        items: validItems.map(item => ({ ...item, amount: Number(item.amount) })),
        amount: totalAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice updated successfully');
      setIsEditModalOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to update invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvoice = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await axios.delete(`/api/billing/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Invoice cancelled');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to cancel invoice');
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
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
            CANCELLED
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
        <Dialog open={isNewInvoiceModalOpen} onOpenChange={setIsNewInvoiceModalOpen}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Sale (POS)
            </Button>
          } />
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Sale / Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pos-patient-id">Patient ID</Label>
                  <Input 
                    id="pos-patient-id" 
                    placeholder="UGN-2026-XXXX" 
                    value={newInvoiceForm.patient_id}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, patient_id: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pos-patient-name">Patient Name</Label>
                  <Input 
                    id="pos-patient-name" 
                    placeholder="Full Name" 
                    value={newInvoiceForm.name}
                    onChange={(e) => setNewInvoiceForm({...newInvoiceForm, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase text-muted-foreground">Invoice Items</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] gap-1"
                    onClick={() => setNewInvoiceForm({
                      ...newInvoiceForm, 
                      items: [...newInvoiceForm.items, { description: '', amount: '' }]
                    })}
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {newInvoiceForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <Input 
                        placeholder="Description" 
                        className="flex-1"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...newInvoiceForm.items];
                          newItems[idx].description = e.target.value;
                          setNewInvoiceForm({...newInvoiceForm, items: newItems});
                        }}
                      />
                      <Input 
                        placeholder="Amount" 
                        type="number" 
                        className="w-24"
                        value={item.amount}
                        onChange={(e) => {
                          const newItems = [...newInvoiceForm.items];
                          newItems[idx].amount = e.target.value;
                          setNewInvoiceForm({...newInvoiceForm, items: newItems});
                        }}
                      />
                      {newInvoiceForm.items.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-rose-500"
                          onClick={() => {
                            const newItems = newInvoiceForm.items.filter((_, i) => i !== idx);
                            setNewInvoiceForm({...newInvoiceForm, items: newItems});
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2 font-bold text-lg">
                    {newInvoiceForm.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()} UGX
                  </span>
                </div>
                <Button onClick={handleCreateInvoice} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Generate Invoice
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger render={<Button size="sm" variant="outline" className="gap-2" />}>
                          <Receipt className="w-4 h-4" /> View
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Invoice Details - INV-{inv.id.toString().padStart(5, '0')} - {inv.name} ({inv.patient_id})</DialogTitle>
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
                              <div className="flex justify-between text-sm pt-2 border-t mt-2">
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span className="font-medium">{inv.amount.toLocaleString()} UGX</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paid Amount:</span>
                                <span className="font-medium text-emerald-600">{(inv.paid_amount || 0).toLocaleString()} UGX</span>
                              </div>
                              {(inv.amount - (inv.paid_amount || 0)) > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground font-bold">Remaining Balance:</span>
                                  <span className="font-bold text-rose-600">{(inv.amount - (inv.paid_amount || 0)).toLocaleString()} UGX</span>
                                </div>
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

                            {inv.payments && inv.payments.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Payment History</Label>
                                <div className="border rounded-lg overflow-hidden">
                                  <Table>
                                    <TableHeader className="bg-muted/30">
                                      <TableRow className="text-[10px] uppercase">
                                        <TableHead className="h-8">Date</TableHead>
                                        <TableHead className="h-8">Method</TableHead>
                                        <TableHead className="h-8 text-right">Amount</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {inv.payments.map((payment: any, idx: number) => (
                                        <TableRow key={idx} className="text-xs">
                                          <TableCell className="py-2">
                                            {new Date(payment.date).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <div className="font-medium">{payment.method}</div>
                                            {payment.reference_number && (
                                              <div className="text-[10px] text-muted-foreground">Ref: {payment.reference_number}</div>
                                            )}
                                          </TableCell>
                                          <TableCell className="py-2 text-right font-medium text-emerald-600">
                                            {payment.amount.toLocaleString()}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            {inv.status !== 'PAID' && inv.status !== 'CANCELLED' ? (
                              <div className="space-y-3 pt-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs uppercase text-muted-foreground">Collect Payment</Label>
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="partial-amount" className="text-[10px] text-muted-foreground">Amount:</Label>
                                    <Input 
                                      id="partial-amount" 
                                      type="number" 
                                      className="h-7 w-24 text-xs" 
                                      placeholder="Full Amount"
                                      value={paymentAmount}
                                      onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                  </div>
                                </div>
                                {!selectedPaymentMethod ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                      variant="outline" 
                                      className="h-16 flex-col gap-1 text-xs"
                                      onClick={() => handlePayment(inv.id, 'Cash', undefined, paymentAmount ? Number(paymentAmount) : undefined)}
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
                                      onClick={() => handlePayment(inv.id, 'Insurance', undefined, paymentAmount ? Number(paymentAmount) : undefined)}
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
                                      disabled={!referenceNumber.trim() || isSubmitting}
                                      onClick={() => handlePayment(inv.id, selectedPaymentMethod, referenceNumber, paymentAmount ? Number(paymentAmount) : undefined)}
                                    >
                                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                      Confirm Payment
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : inv.status === 'PAID' ? (
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
                            ) : (
                              <div className="pt-4 text-center">
                                <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 px-4 py-1">
                                  Invoice Cancelled
                                </Badge>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingInvoice(inv);
                              setEditInvoiceForm({
                                patient_id: inv.patient_id,
                                name: inv.name,
                                items: inv.items.map((i: any) => ({ description: i.description, amount: String(i.amount) }))
                              });
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleCancelInvoice(inv.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Invoice - INV-{editingInvoice?.id.toString().padStart(5, '0')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-patient-id">Patient ID</Label>
                <Input 
                  id="edit-patient-id" 
                  value={editInvoiceForm.patient_id}
                  onChange={(e) => setEditInvoiceForm({...editInvoiceForm, patient_id: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-patient-name">Patient Name</Label>
                <Input 
                  id="edit-patient-name" 
                  value={editInvoiceForm.name}
                  onChange={(e) => setEditInvoiceForm({...editInvoiceForm, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase text-muted-foreground">Invoice Items</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] gap-1"
                  onClick={() => setEditInvoiceForm({
                    ...editInvoiceForm, 
                    items: [...editInvoiceForm.items, { description: '', amount: '' }]
                  })}
                >
                  <Plus className="w-3 h-3" /> Add Item
                </Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {editInvoiceForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input 
                      placeholder="Description" 
                      className="flex-1"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...editInvoiceForm.items];
                        newItems[idx].description = e.target.value;
                        setEditInvoiceForm({...editInvoiceForm, items: newItems});
                      }}
                    />
                    <Input 
                      placeholder="Amount" 
                      type="number" 
                      className="w-24"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...editInvoiceForm.items];
                        newItems[idx].amount = e.target.value;
                        setEditInvoiceForm({...editInvoiceForm, items: newItems});
                      }}
                    />
                    {editInvoiceForm.items.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-rose-500"
                        onClick={() => {
                          const newItems = editInvoiceForm.items.filter((_, i) => i !== idx);
                          setEditInvoiceForm({...editInvoiceForm, items: newItems});
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <div className="text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-bold text-lg">
                  {editInvoiceForm.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()} UGX
                </span>
              </div>
              <Button onClick={handleUpdateInvoice} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Update Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
