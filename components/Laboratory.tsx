import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FlaskConical, Search, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LAB_TESTS } from './Clinical';

export const Laboratory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const { token, user } = useAuthStore();

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/lab/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to fetch lab orders');
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
    const testId = data.test_id as string;
    const test = LAB_TESTS.find(t => t.id === testId);

    let payload: any = {
      test_id: testId,
      encounter_id: selectedOrder.encounter_id,
      notes: data.notes
    };

    if (test?.parameters) {
      const parameterResults = test.parameters.map(param => ({
        id: param.id,
        name: param.name,
        value: data[`param_${param.id}`],
        unit: param.unit,
        range: param.range
      }));
      payload.value = JSON.stringify(parameterResults);
      payload.is_multi_parameter = true;
    } else {
      payload.value = data.value;
      payload.units = data.units;
      payload.normal_range = data.normal_range;
    }

    try {
      await axios.post('/api/lab/results', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Result recorded successfully');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to save result');
    }
  };

  const updateOrderStatus = async (encounterId: number, status: string) => {
    try {
      await axios.patch(`/api/lab/orders/${encounterId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
      setIsResultModalOpen(false);
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => 
    String(order.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(order.patient_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string, className: string, icon: any }> = {
      'COMPLETED': { 
        label: 'Completed', 
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: CheckCircle2
      },
      'PARTIAL': { 
        label: 'Partial', 
        className: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock
      },
      'PENDING': { 
        label: 'Pending', 
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: Clock
      }
    };

    const { label, className, icon: Icon } = config[status] || config['PENDING'];

    return (
      <Badge 
        variant="outline" 
        className={cn("gap-1.5 px-2.5 py-0.5 font-semibold uppercase text-[10px] tracking-wider", className)}
      >
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laboratory</h2>
          <p className="text-muted-foreground">Manage lab investigations and record results</p>
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
            <FlaskConical className="w-5 h-5 text-primary" />
            Active Lab Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Tests Ordered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{order.patient_id}</TableCell>
                    <TableCell>{order.patient_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.ordered_labs.map((testId: string) => (
                          <Badge key={testId} variant="outline" className="text-[10px]">
                            {LAB_TESTS.find(t => t.id === testId)?.name || testId}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isResultModalOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                        setIsResultModalOpen(open);
                        if (open) setSelectedOrder(order);
                      }}>
                        <DialogTrigger render={<Button variant="ghost" size="sm" className="gap-2" />}>
                          <FileText className="w-4 h-4" />
                          {order.status === 'COMPLETED' ? 'View Results' : 'Enter Results'}
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Lab Results - {order.patient_name}</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6 py-4">
                            {order.ordered_labs.map((testId: string) => {
                              const test = LAB_TESTS.find(t => t.id === testId);
                              const existingResult = order.results.find((r: any) => r.test_id === testId);
                              
                              return (
                                <div key={testId} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-primary">{test?.name || testId}</h4>
                                    {existingResult ? (
                                      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Recorded
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="gap-1">
                                        <Clock className="w-3 h-3" /> Pending
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {existingResult ? (
                                    <div className="space-y-3">
                                      {test?.parameters ? (
                                        <div className="border rounded-md overflow-hidden">
                                          <Table>
                                            <TableHeader className="bg-muted/50">
                                              <TableRow>
                                                <TableHead className="h-8 text-[10px] uppercase">Parameter</TableHead>
                                                <TableHead className="h-8 text-[10px] uppercase text-center">Result</TableHead>
                                                <TableHead className="h-8 text-[10px] uppercase text-right">Normal Range</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {(() => {
                                                try {
                                                  const params = JSON.parse(existingResult.value);
                                                  return params.map((p: any) => (
                                                    <TableRow key={p.id} className="h-8">
                                                      <TableCell className="py-1 text-xs font-medium">{p.name}</TableCell>
                                                      <TableCell className="py-1 text-xs text-center font-bold">{p.value} <span className="text-[10px] font-normal text-muted-foreground">{p.unit}</span></TableCell>
                                                      <TableCell className="py-1 text-xs text-right text-muted-foreground">{p.range}</TableCell>
                                                    </TableRow>
                                                  ));
                                                } catch (e) {
                                                  return <TableRow><TableCell colSpan={3} className="text-xs text-center text-destructive">Error parsing multi-parameter results</TableCell></TableRow>;
                                                }
                                              })()}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                          <div>
                                            <Label className="text-muted-foreground">Result Value</Label>
                                            <p className="font-semibold text-lg">{existingResult.value} {existingResult.units}</p>
                                          </div>
                                          <div>
                                            <Label className="text-muted-foreground">Normal Range</Label>
                                            <p className="font-medium">{existingResult.normal_range || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <Label className="text-muted-foreground">Recorded On</Label>
                                            <p className="font-medium">{new Date(existingResult.created_at).toLocaleString()}</p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {existingResult.notes && (
                                        <div className="pt-2 border-t border-dashed">
                                          <Label className="text-xs text-muted-foreground">Technician Notes</Label>
                                          <p className="text-sm italic text-muted-foreground">{existingResult.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <form key={testId} onSubmit={handleSaveResult} className="space-y-4">
                                      <input type="hidden" name="test_id" value={testId} />
                                      
                                      {test?.parameters ? (
                                        <div className="border rounded-md overflow-hidden bg-background">
                                          <Table>
                                            <TableHeader className="bg-muted/50">
                                              <TableRow>
                                                <TableHead className="h-9 text-[10px] uppercase">Parameter</TableHead>
                                                <TableHead className="h-9 text-[10px] uppercase">Unit</TableHead>
                                                <TableHead className="h-9 text-[10px] uppercase text-center">Result</TableHead>
                                                <TableHead className="h-9 text-[10px] uppercase text-right">Normal Range</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {test.parameters.map(param => (
                                                <TableRow key={param.id} className="h-10">
                                                  <TableCell className="py-1 text-xs font-medium">{param.name}</TableCell>
                                                  <TableCell className="py-1 text-xs text-muted-foreground">{param.unit}</TableCell>
                                                  <TableCell className="py-1">
                                                    <Input 
                                                      id={`param_${param.id}`} 
                                                      name={`param_${param.id}`} 
                                                      placeholder="Value" 
                                                      className="h-7 text-xs text-center w-24 mx-auto"
                                                      required 
                                                    />
                                                  </TableCell>
                                                  <TableCell className="py-1 text-xs text-right text-muted-foreground">{param.range}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor={`value-${testId}`}>Result Value</Label>
                                            <Input id={`value-${testId}`} name="value" placeholder="e.g. 12.5" required />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor={`units-${testId}`}>Units</Label>
                                            <Input id={`units-${testId}`} name="units" placeholder="e.g. g/dL" required />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor={`range-${testId}`}>Normal Range</Label>
                                            <Input id={`range-${testId}`} name="normal_range" placeholder="e.g. 11.0 - 16.0" />
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="space-y-2">
                                        <Label htmlFor={`notes-${testId}`}>Technician Notes</Label>
                                        <Textarea id={`notes-${testId}`} name="notes" placeholder="Any clinical observations..." className="h-20" />
                                      </div>
                                      
                                      <div className="flex justify-end">
                                        <Button type="submit" size="sm" className="gap-2">
                                          <CheckCircle2 className="w-4 h-4" /> Save {test?.name || 'Result'}
                                        </Button>
                                      </div>
                                    </form>
                                  )}
                                </div>
                              );
                            })}

                            <div className="pt-4 border-t flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <AlertCircle className="w-4 h-4" />
                                <span>Ensure all critical values are flagged to the clinician.</span>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsResultModalOpen(false)}>Close</Button>
                                {order.status !== 'COMPLETED' && (
                                  <Button 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => updateOrderStatus(order.encounter_id, 'COMPLETED')}
                                  >
                                    Mark Order as Completed
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {loading ? 'Loading orders...' : 'No lab orders found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
