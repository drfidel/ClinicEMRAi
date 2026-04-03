import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Plus, Search, Clock, User, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const Appointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const { token } = useAuthStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptsRes, patientsRes] = await Promise.all([
        axios.get('/api/appointments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/patients', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAppointments(apptsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSchedule = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      if (editingAppointment) {
        await axios.patch(`/api/appointments/${editingAppointment.id}`, {
          ...data,
          patient_id: parseInt(data.patient_id as string),
          appointment_date: data.date,
          appointment_time: data.time,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Appointment updated successfully');
      } else {
        await axios.post('/api/appointments', {
          ...data,
          patient_id: parseInt(data.patient_id as string),
          appointment_date: data.date,
          appointment_time: data.time,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Appointment scheduled successfully');
      }
      setIsModalOpen(false);
      setEditingAppointment(null);
      fetchData();
    } catch (err) {
      toast.error(editingAppointment ? 'Failed to update appointment' : 'Failed to schedule appointment');
    }
  };

  const openEditModal = (appt: any) => {
    setEditingAppointment(appt);
    setIsModalOpen(true);
  };

  const filteredAppointments = appointments
    .filter(appt => {
      const patient = patients.find(p => p.id === appt.patient_id);
      const searchStr = `${patient?.fullName || ''} ${appt.reason || ''} ${appt.status || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const dateA = a.appointment_date || format(new Date(a.created_at), 'yyyy-MM-dd');
      const dateB = b.appointment_date || format(new Date(b.created_at), 'yyyy-MM-dd');
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      
      const timeA = a.appointment_time || format(new Date(a.created_at), 'HH:mm');
      const timeB = b.appointment_time || format(new Date(b.created_at), 'HH:mm');
      return timeA.localeCompare(timeB);
    });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, className: string }> = {
      'WAITING': { 
        label: 'Waiting', 
        className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100' 
      },
      'TRIAGE': { 
        label: 'Triage', 
        className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100' 
      },
      'CONSULTATION': { 
        label: 'Consultation', 
        className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100' 
      },
      'COMPLETED': { 
        label: 'Completed', 
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
      },
      'CANCELLED': { 
        label: 'Cancelled', 
        className: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100' 
      },
      'NOSHOW': { 
        label: 'No Show', 
        className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100' 
      }
    };

    const config = statusMap[status] || { label: status, className: 'bg-secondary text-secondary-foreground' };

    return (
      <Badge 
        variant="outline" 
        className={cn(
          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
          config.className
        )}
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">Schedule and manage patient visits</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingAppointment(null);
        }}>
          <DialogTrigger render={
            <Button className="gap-2" onClick={() => setEditingAppointment(null)}>
              <Plus className="w-4 h-4" /> Schedule Appointment
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
            </DialogHeader>
            <form key={editingAppointment?.id || 'new'} onSubmit={handleSchedule} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Patient</Label>
                <select 
                  name="patient_id" 
                  required 
                  defaultValue={editingAppointment?.patient_id || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.patient_id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    name="date" 
                    type="date" 
                    required 
                    defaultValue={editingAppointment?.appointment_date || format(new Date(), 'yyyy-MM-dd')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input 
                    name="time" 
                    type="time" 
                    required 
                    defaultValue={editingAppointment?.appointment_time || "09:00"} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason for Visit</Label>
                <Input 
                  name="reason" 
                  placeholder="e.g., Routine Checkup, Fever, etc." 
                  required 
                  defaultValue={editingAppointment?.reason || ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input 
                  name="notes" 
                  placeholder="Additional information..." 
                  defaultValue={editingAppointment?.notes || ""}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsModalOpen(false);
                  setEditingAppointment(null);
                }}>Cancel</Button>
                <Button type="submit">{editingAppointment ? 'Update' : 'Schedule'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Appointment Queue</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search appointments..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No appointments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appt) => {
                    const patient = patients.find(p => p.id === appt.patient_id);
                    return (
                      <TableRow key={appt.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{patient?.fullName || 'Unknown Patient'}</span>
                            <span className="text-xs text-muted-foreground">{patient?.patient_id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                              {appt.appointment_date || format(new Date(appt.created_at), 'yyyy-MM-dd')}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {appt.appointment_time || format(new Date(appt.created_at), 'HH:mm')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{appt.reason}</TableCell>
                        <TableCell>{getStatusBadge(appt.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(appt)}>Edit</Button>
                            <Button variant="ghost" size="sm">View</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
