import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, CreditCard, Smartphone, Banknote, Search, Plus, Trash2, Edit2, Loader2, X, Printer, CheckCircle2, FileText, Download } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';

export const Billing = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
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

  // Receipt State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any>(null);

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

  const [activeTab, setActiveTab] = useState('invoices');
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

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

  const fetchServices = async () => {
    try {
      const res = await axios.get('/api/billing/services', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(res.data);
    } catch (err) {
      console.error('Failed to fetch services', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/pharmacy/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get(`/api/billing/reports?startDate=${reportDateRange.startDate}&endDate=${reportDateRange.endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to fetch report data');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchServices();
    fetchInventory();
    fetchPatients();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReport();
    }
  }, [activeTab, reportDateRange.startDate, reportDateRange.endDate, token]);

  const exportReportToCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Summary Section
    csvContent += "Financial Summary\n";
    csvContent += `Total Revenue,${reportData.totalRevenue}\n`;
    csvContent += `Total Collected,${reportData.totalCollected}\n`;
    csvContent += `Outstanding Balance,${reportData.outstandingBalance}\n\n`;

    // Income Breakdown
    csvContent += "Income Breakdown\n";
    csvContent += "Category,Amount\n";
    Object.entries(reportData.incomeByCategory || {}).forEach(([cat, amt]) => {
      csvContent += `"${cat}",${amt}\n`;
    });
    csvContent += "\n";

    // Expense Breakdown
    csvContent += "Expense Breakdown\n";
    csvContent += "Category,Amount\n";
    Object.entries(reportData.expenseByCategory || {}).forEach(([cat, amt]) => {
      csvContent += `"${cat}",${amt}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${reportDateRange.startDate}_to_${reportDateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleCombinedReceipt = (encounterId: number) => {
    const encounterInvoices = invoices.filter(inv => inv.encounter_id === encounterId);
    if (encounterInvoices.length === 0) return;

    const combinedItems = encounterInvoices.flatMap(inv => inv.items || []);
    const totalAmount = encounterInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPaid = encounterInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
    
    let combinedStatus = 'PENDING';
    if (totalPaid >= totalAmount) combinedStatus = 'PAID';
    else if (totalPaid > 0) combinedStatus = 'PARTIAL';

    const combinedInvoice = {
      id: `CMB-${encounterId}`,
      isCombined: true,
      encounter_id: encounterId,
      date: encounterInvoices[0].date,
      name: encounterInvoices[0].name,
      patient_id: encounterInvoices[0].patient_id,
      amount: totalAmount,
      paid_amount: totalPaid,
      status: combinedStatus,
      items: combinedItems
    };

    setSelectedInvoiceForReceipt(combinedInvoice);
    setIsReceiptModalOpen(true);
  };

  const filteredInvoices = (Array.isArray(invoices) ? invoices : []).filter(inv => 
    String(inv.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(inv.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(inv.encounter_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(inv.id || '').toLowerCase().includes(searchQuery.toLowerCase())
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="invoices">Invoices & Payments</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Card className="w-64">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Pending</p>
                    <h3 className="text-2xl font-bold">{totalPending.toLocaleString()} UGX</h3>
                  </div>
                </CardContent>
              </Card>
              <Card className="w-64">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Collected Today</p>
                    <h3 className="text-2xl font-bold">{totalCollectedToday.toLocaleString()} UGX</h3>
                  </div>
                </CardContent>
              </Card>
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
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Patient Lookup</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by ID or Name..." 
                    className="pl-8" 
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                  />
                </div>
                {patientSearchQuery && (
                  <div className="border rounded-md max-h-[150px] overflow-y-auto bg-card shadow-sm">
                    {patients
                      .filter(p => 
                        p.patient_id.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                        `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearchQuery.toLowerCase())
                      )
                      .map((p) => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b last:border-0 flex justify-between items-center"
                          onClick={() => {
                            setNewInvoiceForm({
                              ...newInvoiceForm,
                              patient_id: p.patient_id,
                              name: `${p.first_name} ${p.last_name}`
                            });
                            setPatientSearchQuery('');
                          }}
                        >
                          <div>
                            <span className="font-medium">{p.first_name} {p.last_name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{p.patient_id}</span>
                          </div>
                          <Plus className="w-3 h-3 text-primary" />
                        </button>
                      ))}
                    {patients.filter(p => 
                      p.patient_id.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                      `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="p-3 text-xs text-muted-foreground text-center">No patients found</div>
                    )}
                  </div>
                )}
              </div>

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
                  <Label className="text-xs uppercase text-muted-foreground">Quick Add Services</Label>
                  <div className="relative w-40">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      placeholder="Search services..." 
                      className="pl-7 h-7 text-[10px]" 
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 border rounded-md">
                  {services
                    .filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()))
                    .map((service) => (
                      <Button 
                        key={service.id} 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] h-7 px-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          const lastItem = newInvoiceForm.items[newInvoiceForm.items.length - 1];
                          if (!lastItem.description && !lastItem.amount) {
                            const newItems = [...newInvoiceForm.items];
                            newItems[newInvoiceForm.items.length - 1] = { description: service.name, amount: String(service.amount) };
                            setNewInvoiceForm({...newInvoiceForm, items: newItems});
                          } else {
                            setNewInvoiceForm({
                              ...newInvoiceForm, 
                              items: [...newInvoiceForm.items, { description: service.name, amount: String(service.amount) }]
                            });
                          }
                        }}
                      >
                        {service.name}
                      </Button>
                    ))}
                  {services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
                    <p className="text-[10px] text-muted-foreground p-2">No services found</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase text-muted-foreground">Quick Add Medications</Label>
                  <div className="relative w-40">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      placeholder="Search meds..." 
                      className="pl-7 h-7 text-[10px]" 
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 border rounded-md">
                  {inventory
                    .filter(i => i.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()))
                    .map((item) => (
                      <Button 
                        key={item.id} 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                        onClick={() => {
                          const lastItem = newInvoiceForm.items[newInvoiceForm.items.length - 1];
                          const description = `${item.name} (${item.dosage})`;
                          const amount = String(item.price_per_unit);
                          if (!lastItem.description && !lastItem.amount) {
                            const newItems = [...newInvoiceForm.items];
                            newItems[newInvoiceForm.items.length - 1] = { description, amount };
                            setNewInvoiceForm({...newInvoiceForm, items: newItems});
                          } else {
                            setNewInvoiceForm({
                              ...newInvoiceForm, 
                              items: [...newInvoiceForm.items, { description, amount }]
                            });
                          }
                        }}
                      >
                        {item.name}
                      </Button>
                    ))}
                  {inventory.filter(i => i.name.toLowerCase().includes(inventorySearchQuery.toLowerCase())).length === 0 && (
                    <p className="text-[10px] text-muted-foreground p-2">No medications found</p>
                  )}
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search invoice, patient, or encounter ID..." 
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
                      {inv.encounter_id && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => handleCombinedReceipt(inv.encounter_id)}
                        >
                          <Printer className="w-4 h-4" /> Combined Receipt
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => {
                          setSelectedInvoiceForReceipt(inv);
                          setIsReceiptModalOpen(true);
                        }}
                      >
                        <Printer className="w-4 h-4" /> Receipt
                      </Button>
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
                <Label className="text-xs uppercase text-muted-foreground">Quick Add Services</Label>
                <div className="relative w-40">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search services..." 
                    className="pl-7 h-7 text-[10px]" 
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 border rounded-md">
                {services
                  .filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()))
                  .map((service) => (
                    <Button 
                      key={service.id} 
                      variant="outline" 
                      size="sm" 
                      className="text-[10px] h-7 px-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        const lastItem = editInvoiceForm.items[editInvoiceForm.items.length - 1];
                        if (!lastItem.description && !lastItem.amount) {
                          const newItems = [...editInvoiceForm.items];
                          newItems[editInvoiceForm.items.length - 1] = { description: service.name, amount: String(service.amount) };
                          setEditInvoiceForm({...editInvoiceForm, items: newItems});
                        } else {
                          setEditInvoiceForm({
                            ...editInvoiceForm, 
                            items: [...editInvoiceForm.items, { description: service.name, amount: String(service.amount) }]
                          });
                        }
                      }}
                    >
                      {service.name}
                    </Button>
                  ))}
                {services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
                  <p className="text-[10px] text-muted-foreground p-2">No services found</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase text-muted-foreground">Quick Add Medications</Label>
                <div className="relative w-40">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search meds..." 
                    className="pl-7 h-7 text-[10px]" 
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1 border rounded-md">
                {inventory
                  .filter(i => i.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()))
                  .map((item) => (
                    <Button 
                      key={item.id} 
                      variant="outline" 
                      size="sm" 
                      className="text-[10px] h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                      onClick={() => {
                        const lastItem = editInvoiceForm.items[editInvoiceForm.items.length - 1];
                        const description = `${item.name} (${item.dosage})`;
                        const amount = String(item.price_per_unit);
                        if (!lastItem.description && !lastItem.amount) {
                          const newItems = [...editInvoiceForm.items];
                          newItems[editInvoiceForm.items.length - 1] = { description, amount };
                          setEditInvoiceForm({...editInvoiceForm, items: newItems});
                        } else {
                          setEditInvoiceForm({
                            ...editInvoiceForm, 
                            items: [...editInvoiceForm.items, { description, amount }]
                          });
                        }
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                {inventory.filter(i => i.name.toLowerCase().includes(inventorySearchQuery.toLowerCase())).length === 0 && (
                  <p className="text-[10px] text-muted-foreground p-2">No medications found</p>
                )}
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

      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Official Receipt
            </DialogTitle>
          </DialogHeader>
          {selectedInvoiceForReceipt && (
            <div className="space-y-6 py-4" id="printable-receipt">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-xl uppercase">Uganda EMR Hospital</h3>
                <p className="text-xs text-muted-foreground">Kampala, Central Uganda</p>
                <p className="text-xs text-muted-foreground">Tel: +256 700 000 000</p>
                <div className="pt-2 border-b-2 border-dashed" />
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-muted-foreground">Receipt No:</div>
                <div className="text-right font-mono">RCP-{selectedInvoiceForReceipt.id.toString().padStart(5, '0')}</div>
                <div className="text-muted-foreground">Invoice No:</div>
                <div className="text-right font-mono">INV-{selectedInvoiceForReceipt.id.toString().padStart(5, '0')}</div>
                {selectedInvoiceForReceipt.encounter_id && (
                  <>
                    <div className="text-muted-foreground">Encounter ID:</div>
                    <div className="text-right font-mono">ENC-{selectedInvoiceForReceipt.encounter_id.toString().padStart(5, '0')}</div>
                  </>
                )}
                <div className="text-muted-foreground">Date:</div>
                <div className="text-right">{selectedInvoiceForReceipt.date}</div>
                <div className="text-muted-foreground">Patient:</div>
                <div className="text-right font-medium">{selectedInvoiceForReceipt.name}</div>
                <div className="text-muted-foreground">Patient ID:</div>
                <div className="text-right">{selectedInvoiceForReceipt.patient_id}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase border-b pb-1">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                {selectedInvoiceForReceipt.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span>{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t-2 border-dashed pt-2 flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span>{selectedInvoiceForReceipt.amount.toLocaleString()} UGX</span>
                </div>
              </div>

              <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">{(selectedInvoiceForReceipt.paid_amount || 0).toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance Due:</span>
                  <span className="font-bold text-rose-600">{(selectedInvoiceForReceipt.amount - (selectedInvoiceForReceipt.paid_amount || 0)).toLocaleString()} UGX</span>
                </div>
                {selectedInvoiceForReceipt.status === 'PAID' && (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold pt-2">
                    <CheckCircle2 className="w-5 h-5" />
                    FULLY PAID
                  </div>
                )}
              </div>

              <div className="text-center space-y-4 pt-4">
                <p className="text-[10px] text-muted-foreground italic">
                  Thank you for choosing Uganda EMR Hospital. This is a computer generated receipt.
                </p>
                <Button className="w-full gap-2 no-print" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" /> Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </TabsContent>

      <TabsContent value="reports" className="space-y-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Financial Reports</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">From</Label>
                <Input 
                  type="date" 
                  className="w-auto h-8 text-sm"
                  value={reportDateRange.startDate}
                  onChange={(e) => setReportDateRange({ ...reportDateRange, startDate: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">To</Label>
                <Input 
                  type="date" 
                  className="w-auto h-8 text-sm"
                  value={reportDateRange.endDate}
                  onChange={(e) => setReportDateRange({ ...reportDateRange, endDate: e.target.value })}
                />
              </div>
              <Button size="sm" variant="outline" onClick={exportReportToCSV} disabled={!reportData || reportLoading} className="gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : reportData ? (
              <div className="space-y-8 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                    <h3 className="text-2xl font-bold mt-1">{reportData.totalRevenue?.toLocaleString()} UGX</h3>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-sm text-emerald-600 font-medium">Total Collected</p>
                    <h3 className="text-2xl font-bold mt-1 text-emerald-700">{reportData.totalCollected?.toLocaleString()} UGX</h3>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
                    <p className="text-sm text-rose-600 font-medium">Outstanding Balance</p>
                    <h3 className="text-2xl font-bold mt-1 text-rose-700">{reportData.outstandingBalance?.toLocaleString()} UGX</h3>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      Income Breakdown
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(reportData.incomeByCategory || {}).map(([category, amount]: [string, any]) => (
                        <div key={category} className="flex justify-between items-center p-3 bg-muted/20 rounded-md border text-sm">
                          <span className="font-medium">{category}</span>
                          <span className="font-bold">{amount.toLocaleString()} UGX</span>
                        </div>
                      ))}
                      {Object.keys(reportData.incomeByCategory || {}).length === 0 && (
                        <div className="text-sm text-muted-foreground text-center p-4 border rounded-md border-dashed">
                          No income data for this period
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-rose-600" />
                      Expense Breakdown
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(reportData.expenseByCategory || {}).map(([category, amount]: [string, any]) => (
                        <div key={category} className="flex justify-between items-center p-3 bg-muted/20 rounded-md border text-sm">
                          <span className="font-medium">{category}</span>
                          <span className="font-bold">{amount.toLocaleString()} UGX</span>
                        </div>
                      ))}
                      {Object.keys(reportData.expenseByCategory || {}).length === 0 && (
                        <div className="text-sm text-muted-foreground text-center p-4 border rounded-md border-dashed">
                          No expense data for this period
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No report data available
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
};
