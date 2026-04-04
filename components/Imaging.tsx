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
import { Search, CheckCircle2, Clock, FileText, Camera, Eye, Activity, Loader2, BarChart3, Calendar, Download } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
  const [activeTab, setActiveTab] = useState('orders');
  const { token } = useAuthStore();

  // Reporting State
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

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

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get(`/api/imaging/reports/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to fetch imaging report');
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="orders" className="gap-2">
                <Camera className="w-4 h-4" /> Orders
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
            <Camera className="w-5 h-5 text-primary" />
            Pending Imaging Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
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
                  <TableCell>
                    <div className="font-medium">{order.patient_name}</div>
                    <div className="text-xs text-muted-foreground">{order.patient_id}</div>
                  </TableCell>
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
                          <DialogTitle>Imaging Findings - {order.patient_name} ({order.patient_id})</DialogTitle>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalRequests}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Reported Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.totalOrders > 0 
                      ? Math.round((reportData.statusDistribution.REPORTED / reportData.totalOrders) * 100) 
                      : 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.statusDistribution.REQUESTED + reportData.statusDistribution['IN PROGRESS']}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Modality Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.modalityFrequency}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Body Part Frequency</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.bodyPartFrequency} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={10} />
                      <YAxis dataKey="name" type="category" fontSize={10} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                  <CardTitle className="text-base">Status Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Requested', value: reportData.statusDistribution.REQUESTED },
                          { name: 'In Progress', value: reportData.statusDistribution['IN PROGRESS'] },
                          { name: 'Completed', value: reportData.statusDistribution.COMPLETED },
                          { name: 'Reported', value: reportData.statusDistribution.REPORTED }
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
