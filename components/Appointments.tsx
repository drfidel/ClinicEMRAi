import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Plus, Search, Clock, User, FileText, Loader2, List, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export const Appointments = ({ onViewChart }: { onViewChart?: (patientId: string) => void }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [isRecurring, setIsRecurring] = useState(false);
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
    
    const payload = {
      ...data,
      patient_id: parseInt(data.patient_id as string),
      appointment_date: data.date,
      appointment_time: data.time,
      recurring: isRecurring,
      frequency: data.frequency,
      occurrences: parseInt(data.occurrences as string) || 1,
    };
    
    try {
      if (editingAppointment) {
        await axios.patch(`/api/appointments/${editingAppointment.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Appointment updated successfully');
      } else {
        await axios.post('/api/appointments', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(isRecurring ? 'Recurring appointments scheduled successfully' : 'Appointment scheduled successfully');
      }
      setIsModalOpen(false);
      setEditingAppointment(null);
      setIsRecurring(false);
      fetchData();
    } catch (err) {
      toast.error(editingAppointment ? 'Failed to update appointment' : 'Failed to schedule appointment');
    }
  };

  const openEditModal = (appt: any) => {
    setEditingAppointment(appt);
    setIsModalOpen(true);
  };

  const filteredAppointments = (Array.isArray(appointments) ? appointments : [])
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

  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  };

  const renderCalendar = () => {
    const days = getCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-muted border rounded-lg overflow-hidden">
          {weekDays.map(day => (
            <div key={day} className="bg-background p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dayAppointments = filteredAppointments.filter(appt => {
              const apptDate = appt.appointment_date || format(new Date(appt.created_at), 'yyyy-MM-dd');
              try {
                return isSameDay(parseISO(apptDate), day);
              } catch (e) {
                return false;
              }
            });

            return (
              <div 
                key={i} 
                className={cn(
                  "bg-background min-h-[120px] p-2 transition-colors hover:bg-accent/50 border-r border-b last:border-r-0",
                  !isSameMonth(day, currentMonth) && "text-muted-foreground bg-muted/10"
                )}
              >
                <div className={cn(
                  "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                  isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 4).map(appt => {
                    const statusColors: Record<string, string> = {
                      'WAITING': 'bg-amber-100 text-amber-700 border-amber-200',
                      'TRIAGE': 'bg-orange-100 text-orange-700 border-orange-200',
                      'CONSULTATION': 'bg-blue-100 text-blue-700 border-blue-200',
                      'COMPLETED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      'CANCELLED': 'bg-rose-100 text-rose-700 border-rose-200',
                      'NOSHOW': 'bg-slate-100 text-slate-700 border-slate-200'
                    };
                    const colorClass = statusColors[appt.status] || 'bg-primary/10 text-primary border-primary/20';
                    
                    return (
                      <div 
                        key={appt.id} 
                        className={cn(
                          "text-[9px] p-1 rounded truncate cursor-pointer hover:opacity-80 border",
                          colorClass
                        )}
                        onClick={() => openEditModal(appt)}
                        title={`${appt.appointment_time} - ${patients.find(p => p.id === appt.patient_id)?.fullName} (${appt.status})`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{appt.appointment_time}</span>
                          {appt.recurring_group_id && <RefreshCcw className="w-2 h-2 text-primary" />}
                        </div>
                        <div className="truncate">{patients.find(p => p.id === appt.patient_id)?.fullName}</div>
                      </div>
                    );
                  })}
                  {dayAppointments.length > 4 && (
                    <div className="text-[9px] text-muted-foreground text-center">
                      + {dayAppointments.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md p-1 bg-muted/30">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-1"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" /> List
            </Button>
            <Button 
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-1"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="w-4 h-4" /> Calendar
            </Button>
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingAppointment(null);
            setIsRecurring(false);
          }
        }}>
          <DialogTrigger render={
            <Button className="gap-2" onClick={() => {
              setEditingAppointment(null);
              setIsRecurring(false);
            }}>
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

              {!editingAppointment && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="recurring" 
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="recurring" className="cursor-pointer">Recurring Appointment</Label>
                  </div>
                  
                  {isRecurring && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select name="frequency" defaultValue="WEEKLY">
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Occurrences</Label>
                        <Input 
                          name="occurrences" 
                          type="number" 
                          min="2" 
                          max="12" 
                          defaultValue="4" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

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
          ) : viewMode === 'calendar' ? (
            renderCalendar()
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
                              {appt.recurring_group_id && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 gap-1 border-primary/20 text-primary bg-primary/5">
                                  <RefreshCcw className="w-2 h-2" /> Recurring
                                </Badge>
                              )}
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
                            {onViewChart && patient && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary hover:text-primary hover:bg-primary/5 gap-1"
                                onClick={() => onViewChart(patient.patient_id)}
                              >
                                <FileText className="w-3 h-3" />
                                Chart
                              </Button>
                            )}
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
