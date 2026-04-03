import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, CheckCircle2, Clock, FileText, Camera, Eye, Activity, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, any> = {
  'REQUESTED': { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Requested' },
  'IN PROGRESS': { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'In Progress' },
  'COMPLETED': { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Completed' },
  'REPORTED': { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Reported' },
};

const STATUSES = Object.keys(STATUS_CONFIG);

export const Imaging = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const { token } = useAuthStore();

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/imaging/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to fetch imaging orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleSaveResult = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      await axios.post('/api/imaging/results', {
        ...data,
        encounter_id: selectedOrder.encounter_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Imaging result recorded');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to save imaging result');
    }
  };

  const updateStatus = async (encounterId: number, status: string) => {
    setUpdatingStatusId(encounterId);
    try {
      await axios.patch(`/api/imaging/orders/${encounterId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Status updated to ${status}`, {
        description: `Order for encounter #${encounterId} is now ${status.toLowerCase()}.`,
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
      });
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredOrders = orders.filter(order => 
    String(order.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(order.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Imaging (Radiology)</h2>
          <p className="text-muted-foreground">Manage X-Ray, Ultrasound, CT, and MRI requests</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient or ID..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchOrders} variant="outline" size="icon">
            <Clock className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Pending Imaging Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Investigations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading orders...</TableCell>
                </TableRow>
              ) : filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{order.patient_id}</TableCell>
                  <TableCell>{order.patient_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {order.ordered_imaging.map((img: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          {img.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => updateStatus(order.encounter_id, value)}
                        disabled={updatingStatusId === order.encounter_id}
                      >
                        <SelectTrigger size="sm" className={`w-[150px] h-9 border-2 transition-all ${STATUS_CONFIG[order.status]?.bg} ${STATUS_CONFIG[order.status]?.border}`}>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              {updatingStatusId === order.encounter_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                              ) : (
                                (() => {
                                  const Icon = STATUS_CONFIG[order.status]?.icon;
                                  return Icon ? <Icon className={`w-3.5 h-3.5 ${STATUS_CONFIG[order.status]?.color}`} /> : null;
                                })()
                              )}
                              <span className={`text-xs font-semibold ${STATUS_CONFIG[order.status]?.color}`}>
                                {STATUS_CONFIG[order.status]?.label}
                              </span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(status => {
                            const config = STATUS_CONFIG[status];
                            const Icon = config.icon;
                            return (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2 py-1">
                                  <div className={`p-1 rounded-md ${config.bg} ${config.border} border`}>
                                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                  </div>
                                  <span className="font-medium">{config.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={isResultModalOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                        setIsResultModalOpen(open);
                        if (open) setSelectedOrder(order);
                      }}>
                        <DialogTrigger render={
                          <Button 
                            variant={order.status === 'COMPLETED' || order.status === 'REPORTED' ? "outline" : "ghost"} 
                            size="sm" 
                            className="gap-2 h-8"
                          >
                            {order.status === 'COMPLETED' || order.status === 'REPORTED' ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            {order.status === 'COMPLETED' || order.status === 'REPORTED' ? 'View Results' : 'Enter Findings'}
                          </Button>
                        } />
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Imaging Findings - {order.patient_name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          {order.ordered_imaging.map((img: any, idx: number) => {
                            const existingResult = order.results.find((r: any) => r.imaging_id === img.id);
                            
                            return (
                              <div key={idx} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-bold text-primary">{img.name}</h4>
                                    <p className="text-xs text-muted-foreground">Part: {img.bodyPart} | Indication: {img.clinicalIndication}</p>
                                  </div>
                                  {existingResult ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Reported
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="gap-1">
                                      <Clock className="w-3 h-3" /> Pending
                                    </Badge>
                                  )}
                                </div>
                                
                                {existingResult ? (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <Label className="text-muted-foreground">Radiologist</Label>
                                        <p className="font-medium">{existingResult.radiologist_name}</p>
                                      </div>
                                      <div className="text-right">
                                        <Label className="text-muted-foreground">Report Date</Label>
                                        <p className="font-medium">{new Date(existingResult.report_date).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Radiological Findings</Label>
                                      <p className="font-medium whitespace-pre-wrap">{existingResult.findings}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Conclusion/Result</Label>
                                      <p className="font-semibold">{existingResult.result_text}</p>
                                    </div>
                                    {existingResult.file_name && (
                                      <div className="flex items-center justify-between gap-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                                        <div className="flex items-center gap-2 text-primary text-xs font-medium">
                                          <FileText className="w-4 h-4" />
                                          <span>{existingResult.file_name}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10">
                                          <Eye className="w-3 h-3" /> View Report
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <form key={idx} onSubmit={handleSaveResult} className="space-y-4">
                                    <input type="hidden" name="imaging_id" value={img.id} />
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`radiologist-${idx}`}>Radiologist Name</Label>
                                        <Input id={`radiologist-${idx}`} name="radiologist_name" placeholder="Dr. Smith" required />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`date-${idx}`}>Report Date</Label>
                                        <Input id={`date-${idx}`} name="report_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`findings-${idx}`}>Detailed Findings</Label>
                                      <Textarea id={`findings-${idx}`} name="findings" placeholder="Describe what is seen in the images..." required />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`result-${idx}`}>Conclusion / Impression</Label>
                                      <Input id={`result-${idx}`} name="result_text" placeholder="e.g. Normal chest radiograph" required />
                                    </div>
                                    <div className="flex justify-end">
                                      <Button type="submit" size="sm" className="gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Save Report
                                      </Button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
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
