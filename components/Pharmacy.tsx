import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Pill, Clock, CheckCircle2, FileText, AlertCircle, Loader2, Printer, Package, Plus, History, BarChart3, TrendingUp, TrendingDown, Calendar, Download, Receipt, Banknote } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export const Pharmacy = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('queue');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  
  // Stock Adjustment State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add/Edit Medication State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    dosage: '',
    category: '',
    stock: '',
    maxStock: '',
    reorderLevel: '',
    unit: '',
    expiry_date: '',
    price_per_unit: ''
  });
  const [isSubmittingMedication, setIsSubmittingMedication] = useState(false);

  // Reporting State
  const [reportType, setReportType] = useState<'inventory' | 'expiring' | 'dispensed'>('inventory');
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [medicationFilter, setMedicationFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { token, user } = useAuthStore();
  const canManageMedications = user && ['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST'].includes(user.role);

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get('/api/pharmacy/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await axios.get('/api/pharmacy/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to fetch inventory');
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchStockHistory = async (itemId: string) => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/pharmacy/inventory/${itemId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStockHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to fetch stock history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    setReportData(null); // Clear old data to prevent type mismatch crashes
    try {
      let url = `/api/pharmacy/reports/${reportType}`;
      if (reportType === 'dispensed') {
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        if (medicationFilter) url += `&medicationName=${medicationFilter}`;
        if (userFilter) url += `&dispensedBy=${userFilter}`;
        if (sortBy) url += `&sortBy=${sortBy}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to fetch report');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchInventory();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReport();
    }
  }, [activeTab, reportType, dateRange, medicationFilter, userFilter, sortBy, sortOrder]);

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustmentAmount || !adjustmentReason) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsAdjusting(true);
    try {
      await axios.patch(`/api/pharmacy/inventory/${selectedItem.id}/adjust`, {
        adjustment: Number(adjustmentAmount),
        reason: adjustmentReason,
        type: adjustmentType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Stock adjusted successfully');
      setIsAdjustModalOpen(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      fetchInventory();
    } catch (err) {
      toast.error('Failed to adjust stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleAddMedication = async () => {
    if (!medicationForm.name || !medicationForm.dosage || !medicationForm.stock || !medicationForm.price_per_unit) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingMedication(true);
    try {
      await axios.post('/api/pharmacy/inventory', medicationForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Medication added successfully');
      setIsAddModalOpen(false);
      setMedicationForm({
        name: '', dosage: '', category: '', stock: '', maxStock: '', reorderLevel: '', unit: '', expiry_date: '', price_per_unit: ''
      });
      fetchInventory();
    } catch (err) {
      toast.error('Failed to add medication');
    } finally {
      setIsSubmittingMedication(false);
    }
  };

  const handleEditMedication = async () => {
    if (!selectedItem || !medicationForm.name || !medicationForm.dosage) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingMedication(true);
    try {
      await axios.patch(`/api/pharmacy/inventory/${selectedItem.id}`, medicationForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Medication updated successfully');
      setIsEditModalOpen(false);
      fetchInventory();
    } catch (err) {
      toast.error('Failed to update medication');
    } finally {
      setIsSubmittingMedication(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdatingStatusId(id);
    try {
      await axios.patch(`/api/pharmacy/prescriptions/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Prescription marked as ${status.toLowerCase()}`);
      fetchPrescriptions();
      if (selectedPrescription?.id === id) {
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredPrescriptions = Array.isArray(prescriptions) ? prescriptions.filter(p => 
    String(p.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.patient_name && String(p.patient_name).toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  const filteredInventory = Array.isArray(inventory) ? inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) || 
                         (item.category && item.category.toLowerCase().includes(inventorySearchQuery.toLowerCase())) ||
                         (item.dosage && item.dosage.toLowerCase().includes(inventorySearchQuery.toLowerCase()));
    const matchesCategory = inventoryCategoryFilter === 'all' || item.category === inventoryCategoryFilter;
    return matchesSearch && matchesCategory;
  }) : [];

  const inventoryCategories = Array.isArray(inventory) 
    ? ['all', ...new Set(inventory.map(i => i.category).filter(Boolean))] 
    : ['all'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DISPENSED':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
            <CheckCircle2 className="w-3 h-3" /> Dispensed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-rose-100 text-rose-700 border-rose-200 gap-1">
            <AlertCircle className="w-3 h-3" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pharmacy</h2>
          <p className="text-muted-foreground">Dispense medications and manage prescriptions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchPrescriptions} variant="outline" size="icon">
            <Clock className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" className="gap-2">
            <History className="w-4 h-4" />
            Prescription Queue
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="w-4 h-4" />
            Medication Inventory
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Active Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medications</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading prescriptions...
                      </TableCell>
                    </TableRow>
                  ) : filteredPrescriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No prescriptions found.
                      </TableCell>
                    </TableRow>
                  ) : filteredPrescriptions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{p.patient_name}</div>
                        <div className="text-xs text-muted-foreground">{p.patient_id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.items.map((item: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[10px]">
                              {item.medication_name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {p.items.reduce((sum: number, item: any) => {
                          const invItem = inventory.find(i => i.name === item.medication_name);
                          return sum + (invItem?.price_per_unit || 0);
                        }, 0).toLocaleString()} UGX
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isDetailModalOpen && selectedPrescription?.id === p.id} onOpenChange={(open) => {
                          setIsDetailModalOpen(open);
                          if (open) setSelectedPrescription(p);
                        }}>
                          <DialogTrigger render={
                            <Button variant="ghost" size="sm" className="gap-2">
                              <FileText className="w-4 h-4" />
                              Details
                            </Button>
                          } />
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Prescription Details - {p.patient_name} ({p.patient_id})</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="text-muted-foreground">Prescribed By</Label>
                                  <p className="font-medium">Dr. Musoke John</p>
                                </div>
                                <div className="text-right">
                                  <Label className="text-muted-foreground">Date</Label>
                                  <p className="font-medium">{new Date(p.created_at).toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader className="bg-muted/50">
                                    <TableRow>
                                      <TableHead>Medication</TableHead>
                                      <TableHead>Dose/Freq/Dur</TableHead>
                                      <TableHead className="text-center">Qty</TableHead>
                                      <TableHead className="text-right">Unit Price</TableHead>
                                      <TableHead className="text-right">Total Price</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                      <TableBody>
                                        {p.items.map((item: any, idx: number) => {
                                          const invItem = inventory.find(i => i.name === item.medication_name);
                                          const availableStock = Array.isArray(inventory) ? inventory.filter(i => i.name === item.medication_name) : [];
                                          const nearestExpiry = availableStock.length > 0 
                                            ? [...availableStock].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0]
                                            : null;
                                          
                                          const qty = Number(item.quantity || 1);
                                          const unitPrice = invItem?.price_per_unit || 0;
                                          const totalPrice = unitPrice * qty;

                                          return (
                                            <TableRow key={idx}>
                                              <TableCell>
                                                <div className="font-medium">{item.medication_name}</div>
                                                <div className="text-[10px] text-muted-foreground">{item.dosage} • {item.instructions}</div>
                                                {nearestExpiry && (
                                                  <div className="mt-1">
                                                    <Badge variant="outline" className={cn(
                                                      "text-[10px] gap-1",
                                                      new Date(nearestExpiry.expiry_date) <= new Date(new Date().setMonth(new Date().getMonth() + 3)) 
                                                        ? "border-amber-500 text-amber-600 bg-amber-50" 
                                                        : ""
                                                    )}>
                                                      <Clock className="w-3 h-3" />
                                                      Nearest Expiry: {new Date(nearestExpiry.expiry_date).toLocaleDateString()}
                                                    </Badge>
                                                  </div>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-xs">
                                                {item.dose} units, {item.frequency}x daily for {item.duration} days
                                              </TableCell>
                                              <TableCell className="text-center font-bold">{qty}</TableCell>
                                              <TableCell className="text-right text-xs text-muted-foreground">
                                                {unitPrice.toLocaleString()}
                                              </TableCell>
                                              <TableCell className="text-right font-medium">
                                                {totalPrice.toLocaleString()} UGX
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                      <TableBody className="bg-muted/30 font-bold">
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-right">Total Estimated Cost</TableCell>
                                          <TableCell className="text-right">
                                            {p.items.reduce((sum: number, item: any) => {
                                              const invItem = inventory.find(i => i.name === item.medication_name);
                                              const qty = Number(item.quantity || 1);
                                              return sum + ((invItem?.price_per_unit || 0) * qty);
                                            }, 0).toLocaleString()} UGX
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                </Table>
                              </div>

                              <div className="flex justify-between items-center pt-4 border-t">
                                <div className="flex gap-2">
                                  {p.status === 'DISPENSED' && (
                                    <Button variant="outline" size="sm" className="gap-2 text-primary border-primary hover:bg-primary/5">
                                      <Receipt className="w-4 h-4" />
                                      View Invoice
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Printer className="w-4 h-4" />
                                    Print Label
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  {p.status === 'PENDING' && (
                                    <>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => updateStatus(p.id, 'CANCELLED')}
                                        disabled={updatingStatusId === p.id}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        className="gap-2" 
                                        size="sm"
                                        onClick={() => updateStatus(p.id, 'DISPENSED')}
                                        disabled={updatingStatusId === p.id}
                                      >
                                        {updatingStatusId === p.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Dispense Medication
                                      </Button>
                                    </>
                                  )}
                                  {p.status === 'DISPENSED' && (
                                    <div className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4" />
                                      Dispensed on {new Date(p.dispensed_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
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
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Inventory Stock
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      className="pl-8 h-8"
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  >
                    {inventoryCategories.map(cat => (
                      <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adjust Stock - {selectedItem?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Adjustment Type</Label>
                        <div className="flex gap-2">
                          <Button 
                            variant={adjustmentType === 'ADD' ? 'default' : 'outline'} 
                            className="flex-1"
                            onClick={() => setAdjustmentType('ADD')}
                          >
                            Add Stock
                          </Button>
                          <Button 
                            variant={adjustmentType === 'REMOVE' ? 'destructive' : 'outline'} 
                            className="flex-1"
                            onClick={() => setAdjustmentType('REMOVE')}
                          >
                            Remove Stock
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Quantity ({selectedItem?.unit})</Label>
                        <Input 
                          id="amount" 
                          type="number" 
                          placeholder="Enter quantity" 
                          value={adjustmentAmount}
                          onChange={(e) => setAdjustmentAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Adjustment</Label>
                        <Input 
                          id="reason" 
                          placeholder="e.g., New shipment, Expired, Damaged" 
                          value={adjustmentReason}
                          onChange={(e) => setAdjustmentReason(e.target.value)}
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={handleAdjustStock}
                        disabled={isAdjusting}
                      >
                        {isAdjusting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Confirm Adjustment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Stock History: {selectedItem?.name} ({selectedItem?.dosage})
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                          <p className="text-sm text-muted-foreground">Loading history...</p>
                        </div>
                      ) : stockHistory.length === 0 ? (
                        <div className="text-center py-10 border rounded-lg bg-muted/20">
                          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                          <p className="text-muted-foreground">No stock history found for this item.</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>User</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...stockHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell className="text-xs">
                                    {new Date(entry.created_at).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={entry.type === 'ADD' ? 'outline' : 'destructive'} className={cn(
                                      "text-[10px] px-1.5 h-5",
                                      entry.type === 'ADD' ? "border-emerald-500 text-emerald-600 bg-emerald-50" : ""
                                    )}>
                                      {entry.type === 'ADD' ? (
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3 mr-1" />
                                      )}
                                      {entry.type === 'ADD' ? 'Addition' : 'Removal'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {entry.type === 'ADD' ? '+' : '-'}{entry.quantity} {selectedItem?.unit}
                                  </TableCell>
                                  <TableCell className="text-xs max-w-[150px] truncate" title={entry.reason}>
                                    {entry.reason}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {entry.user_name}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {canManageMedications && (
                  <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger render={
                      <Button size="sm" className="gap-2" onClick={() => setMedicationForm({
                        name: '', dosage: '', category: '', stock: '', maxStock: '', reorderLevel: '', unit: '', expiry_date: '', price_per_unit: ''
                      })}>
                        <Plus className="w-4 h-4" />
                        Add Item
                      </Button>
                    } />
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Inventory Item</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="name">Item Name*</Label>
                          <Input id="name" value={medicationForm.name} onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dosage">Dosage/Size*</Label>
                          <Input id="dosage" placeholder="e.g. 500mg or Size 14" value={medicationForm.dosage} onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input id="category" placeholder="e.g. Antibiotics, Sundries" value={medicationForm.category} onChange={(e) => setMedicationForm({...medicationForm, category: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stock">Initial Stock*</Label>
                          <Input id="stock" type="number" value={medicationForm.stock} onChange={(e) => setMedicationForm({...medicationForm, stock: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxStock">Max Stock</Label>
                          <Input id="maxStock" type="number" value={medicationForm.maxStock} onChange={(e) => setMedicationForm({...medicationForm, maxStock: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reorderLevel">Reorder Level</Label>
                          <Input id="reorderLevel" type="number" value={medicationForm.reorderLevel} onChange={(e) => setMedicationForm({...medicationForm, reorderLevel: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit</Label>
                          <Input id="unit" placeholder="e.g. Tablets" value={medicationForm.unit} onChange={(e) => setMedicationForm({...medicationForm, unit: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" type="date" value={medicationForm.expiry_date} onChange={(e) => setMedicationForm({...medicationForm, expiry_date: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price">Price per Unit (UGX)*</Label>
                          <Input id="price" type="number" value={medicationForm.price_per_unit} onChange={(e) => setMedicationForm({...medicationForm, price_per_unit: e.target.value})} />
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleAddMedication} disabled={isSubmittingMedication}>
                        {isSubmittingMedication ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Add Medication
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}

                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Medication - {selectedItem?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="edit-name">Medication Name*</Label>
                        <Input id="edit-name" value={medicationForm.name} onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-dosage">Dosage*</Label>
                        <Input id="edit-dosage" value={medicationForm.dosage} onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-category">Category</Label>
                        <Input id="edit-category" value={medicationForm.category} onChange={(e) => setMedicationForm({...medicationForm, category: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxStock">Max Stock</Label>
                        <Input id="edit-maxStock" type="number" value={medicationForm.maxStock} onChange={(e) => setMedicationForm({...medicationForm, maxStock: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-reorderLevel">Reorder Level</Label>
                        <Input id="edit-reorderLevel" type="number" value={medicationForm.reorderLevel} onChange={(e) => setMedicationForm({...medicationForm, reorderLevel: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-unit">Unit</Label>
                        <Input id="edit-unit" value={medicationForm.unit} onChange={(e) => setMedicationForm({...medicationForm, unit: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-expiry">Expiry Date</Label>
                        <Input id="edit-expiry" type="date" value={medicationForm.expiry_date} onChange={(e) => setMedicationForm({...medicationForm, expiry_date: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-price">Price per Unit (UGX)*</Label>
                        <Input id="edit-price" type="number" value={medicationForm.price_per_unit} onChange={(e) => setMedicationForm({...medicationForm, price_per_unit: e.target.value})} />
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleEditMedication} disabled={isSubmittingMedication}>
                      {isSubmittingMedication ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Price/Unit</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading inventory...
                      </TableCell>
                    </TableRow>
                  ) : [...filteredInventory].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()).map((item) => {
                    const isLowStock = item.stock <= item.reorderLevel;
                    const expiryDate = new Date(item.expiry_date);
                    const today = new Date();
                    const threeMonthsFromNow = new Date();
                    threeMonthsFromNow.setMonth(today.getMonth() + 3);
                    
                    const isNearExpiry = expiryDate <= threeMonthsFromNow && expiryDate >= today;
                    const isExpired = expiryDate < today;

                    return (
                      <TableRow key={item.id} className={cn(
                        isLowStock && "bg-rose-50/50",
                        isNearExpiry && "bg-amber-50/50",
                        isExpired && "bg-rose-100/50"
                      )}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{item.name}</div>
                            <div className="flex gap-1">
                              {isLowStock && (
                                <Badge variant="destructive" className="h-5 text-[10px] px-1.5 gap-1">
                                  <AlertCircle className="w-3 h-3" /> Low Stock
                                </Badge>
                              )}
                              {isNearExpiry && (
                                <Badge variant="outline" className="h-5 text-[10px] px-1.5 gap-1 border-amber-500 text-amber-600 bg-amber-50">
                                  <Clock className="w-3 h-3" /> Near Expiry
                                </Badge>
                              )}
                              {isExpired && (
                                <Badge variant="destructive" className="h-5 text-[10px] px-1.5 gap-1">
                                  <AlertCircle className="w-3 h-3" /> Expired
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{item.dosage}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  isLowStock ? "bg-rose-500" : item.stock < (item.maxStock * 0.5) ? "bg-amber-500" : "bg-emerald-500"
                                )} 
                                style={{ width: `${Math.min(100, (item.stock / item.maxStock) * 100)}%` }}
                              />
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              isLowStock ? "text-rose-600" : ""
                            )}>
                              {item.stock}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{(item.price_per_unit || 0).toLocaleString()} UGX</span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "text-sm font-medium",
                            isNearExpiry ? "text-amber-600" : isExpired ? "text-rose-600" : ""
                          )}>
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{item.reorderLevel}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsHistoryModalOpen(true);
                                fetchStockHistory(item.id);
                              }}
                            >
                              <History className="w-4 h-4" />
                              History
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsAdjustModalOpen(true);
                              }}
                            >
                              Adjust Stock
                            </Button>
                            {canManageMedications && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setMedicationForm({
                                    name: item.name,
                                    dosage: item.dosage,
                                    category: item.category || '',
                                    stock: String(item.stock),
                                    maxStock: String(item.maxStock || ''),
                                    reorderLevel: String(item.reorderLevel || ''),
                                    unit: item.unit || '',
                                    expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
                                    price_per_unit: String(item.price_per_unit || '')
                                  });
                                  setIsEditModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Report Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button 
                    variant={reportType === 'inventory' ? 'default' : 'ghost'} 
                    className="w-full justify-start gap-2"
                    onClick={() => setReportType('inventory')}
                  >
                    <Package className="w-4 h-4" />
                    Stock Levels
                  </Button>
                  <Button 
                    variant={reportType === 'expiring' ? 'default' : 'ghost'} 
                    className="w-full justify-start gap-2"
                    onClick={() => setReportType('expiring')}
                  >
                    <Clock className="w-4 h-4" />
                    Expiring Items
                  </Button>
                  <Button 
                    variant={reportType === 'dispensed' ? 'default' : 'ghost'} 
                    className="w-full justify-start gap-2"
                    onClick={() => setReportType('dispensed')}
                  >
                    <History className="w-4 h-4" />
                    Dispensed Meds
                  </Button>
                </div>

                {reportType === 'dispensed' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                      <Search className="w-3 h-3" />
                      FILTERS & SORTING
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date</Label>
                      <Input 
                        type="date" 
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End Date</Label>
                      <Input 
                        type="date" 
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Medication Name</Label>
                      <Input 
                        placeholder="Filter by med..."
                        value={medicationFilter}
                        onChange={(e) => setMedicationFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dispensed By</Label>
                      <Input 
                        placeholder="Filter by user..."
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sort By</Label>
                      <select 
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="date">Date</option>
                        <option value="medication">Medication</option>
                        <option value="user">Dispensing User</option>
                        <option value="revenue">Revenue</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sort Order</Label>
                      <select 
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                      </select>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs h-8"
                      onClick={() => {
                        setMedicationFilter('');
                        setUserFilter('');
                        setSortBy('date');
                        setSortOrder('desc');
                        setDateRange({
                          startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                          endDate: new Date().toISOString().split('T')[0]
                        });
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}

                <Button className="w-full gap-2 mt-4" variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" />
                  Print Report
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {reportType === 'inventory' && "Inventory & Stock Levels"}
                  {reportType === 'expiring' && "Expiring & Expired Medications"}
                  {reportType === 'dispensed' && "Medications Dispensed Summary"}
                </CardTitle>
                {reportLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Generating report...</p>
                  </div>
                ) : reportData ? (
                  <div className="space-y-8">
                    {reportType === 'inventory' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Card className="bg-slate-50 border-none shadow-none">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Package className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">Total Items</span>
                              </div>
                              <div className="text-2xl font-bold">{reportData?.stockLevels?.length || 0}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-rose-50 border-none shadow-none">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-rose-600 mb-1">
                                <TrendingDown className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">Low Stock</span>
                              </div>
                              <div className="text-2xl font-bold text-rose-700">{reportData?.lowStock?.length || 0}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-emerald-50 border-none shadow-none">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">Healthy Stock</span>
                              </div>
                              <div className="text-2xl font-bold text-emerald-700">
                                {(reportData?.stockLevels?.length || 0) - (reportData?.lowStock?.length || 0)}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Array.isArray(reportData?.stockLevels) ? reportData.stockLevels.slice(0, 10) : []}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip />
                              <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                                {(Array.isArray(reportData?.stockLevels) ? reportData.stockLevels.slice(0, 10) : []).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.stock <= entry.reorderLevel ? '#e11d48' : '#10b981'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            Low Stock Items
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Medication</TableHead>
                                <TableHead>Current Stock</TableHead>
                                <TableHead>Reorder Level</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(reportData?.lowStock || []).map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.name} {item.dosage}</TableCell>
                                  <TableCell className="text-rose-600 font-bold">{item.stock}</TableCell>
                                  <TableCell>{item.reorderLevel}</TableCell>
                                  <TableCell>
                                    <Badge variant="destructive">REORDER</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}

                    {reportType === 'expiring' && (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-rose-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Expired Medications
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Medication</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Current Stock</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reportData?.expired?.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                    No expired medications found.
                                  </TableCell>
                                </TableRow>
                              ) : reportData?.expired?.map((item: any) => (
                                <TableRow key={item.id} className="bg-rose-50/30">
                                  <TableCell className="font-medium">{item.name} {item.dosage}</TableCell>
                                  <TableCell className="text-rose-600 font-bold">{item.expiry_date}</TableCell>
                                  <TableCell>{item.stock}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-amber-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Expiring Within 3 Months
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Medication</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Current Stock</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reportData?.expiringSoon?.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                    No medications expiring soon.
                                  </TableCell>
                                </TableRow>
                              ) : reportData?.expiringSoon?.map((item: any) => (
                                <TableRow key={item.id} className="bg-amber-50/30">
                                  <TableCell className="font-medium">{item.name} {item.dosage}</TableCell>
                                  <TableCell className="text-amber-600 font-bold">{item.expiry_date}</TableCell>
                                  <TableCell>{item.stock}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {reportType === 'dispensed' && (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Report Summary
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Card className="bg-slate-50 border-none shadow-none">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <FileText className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">Total Prescriptions</span>
                              </div>
                              <div className="text-2xl font-bold">{Array.isArray(reportData?.prescriptions) ? reportData.prescriptions.length : 0}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-emerald-50 border-none shadow-none">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <Pill className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">Total Units Dispensed</span>
                              </div>
                              <div className="text-2xl font-bold text-emerald-700">
                                {Array.isArray(reportData?.summary) ? reportData.summary.reduce((sum: number, item: any) => sum + item.totalDispensed, 0) : 0}
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-blue-50 border-none shadow-none">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <Banknote className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">Total Revenue (UGX)</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-700">
                                {Array.isArray(reportData?.summary) ? reportData.summary.reduce((sum: number, item: any) => sum + item.totalPrice, 0).toLocaleString() : 0}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Pill className="w-4 h-4 text-primary" />
                            Medication Summary
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Medication</TableHead>
                                <TableHead className="text-center">Total Dispensed</TableHead>
                                <TableHead className="text-center">Prescriptions</TableHead>
                                <TableHead className="text-right">Total Price (UGX)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(reportData?.summary?.length || 0) === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                      <Pill className="w-8 h-8 opacity-20" />
                                      <p>No medication data found for the selected filters.</p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                (reportData?.summary || []).map((item: any, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">{item.name} {item.dosage}</TableCell>
                                    <TableCell className="text-center">{item.totalDispensed}</TableCell>
                                    <TableCell className="text-center">{item.prescriptions}</TableCell>
                                    <TableCell className="text-right font-bold">{item.totalPrice.toLocaleString()}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <History className="w-4 h-4 text-primary" />
                            Detailed Dispensing Log
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date/Time</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Medications</TableHead>
                                <TableHead>Dispensed By</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(reportData?.prescriptions?.length || 0) === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                      <History className="w-8 h-8 opacity-20" />
                                      <p>No detailed logs found for the selected filters.</p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                (reportData?.prescriptions || []).map((p: any) => (
                                  <TableRow key={p.id}>
                                    <TableCell className="text-xs">
                                      {new Date(p.dispensed_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-medium">{p.patient_name}</TableCell>
                                    <TableCell>
                                      <div className="text-xs space-y-1">
                                        {p.items.map((item: any, idx: number) => (
                                          <div key={idx}>
                                            {item.medication_name} ({item.dosage}) x {item.quantity}
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                          {p.dispensed_by_name?.charAt(0)}
                                        </div>
                                        <span className="text-xs">{p.dispensed_by_name}</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-20 text-center text-muted-foreground">
                    Select a report type to view data.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
