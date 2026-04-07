import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, Search, CheckCircle2, Clock, FileText, AlertCircle, BarChart3, Calendar, Download, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LAB_TESTS } from './Clinical';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const Laboratory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const { token, user } = useAuthStore();

  // Reporting State
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

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

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get(`/api/lab/reports/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to fetch lab report');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReport();
    }
  }, [activeTab, dateRange]);

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

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => 
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="orders" className="gap-2">
                <FlaskConical className="w-4 h-4" /> Orders
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="w-4 h-4" /> Reports
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
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
                    <TableHead>Patient</TableHead>
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
                        <TableCell>
                          <div className="font-medium">{order.patient_name}</div>
                          <div className="text-xs text-muted-foreground">{order.patient_id}</div>
                        </TableCell>
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
                                <DialogTitle>Lab Results - {order.patient_name} ({order.patient_id})</DialogTitle>
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
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-8 h-9 w-40" 
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-8 h-9 w-40" 
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
              </div>
              <Button className="mt-5" onClick={fetchReport} disabled={reportLoading}>
                {reportLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Generate Report
              </Button>
            </div>
            <Button variant="outline" className="mt-5 gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </div>

          {reportLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reportData ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalOrders}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalTests}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{reportData.completedOrders}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.totalOrders > 0 
                      ? Math.round((reportData.completedOrders / reportData.totalOrders) * 100) 
                      : 0}%
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Test Frequency</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.testFrequency.map((f: any) => ({
                      name: LAB_TESTS.find(t => t.id === f.id)?.name || f.id,
                      count: f.count
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pending', value: reportData.statusDistribution.PENDING },
                          { name: 'Partial', value: reportData.statusDistribution.PARTIAL },
                          { name: 'Completed', value: reportData.statusDistribution.COMPLETED }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Select a date range and click "Generate Report"</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
