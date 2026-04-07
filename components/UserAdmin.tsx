import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, UserPlus, Shield, Key, Trash2, Edit2, 
  Loader2, Search, RefreshCcw, UserCheck, UserX 
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/src/lib/store';
import { toast } from 'sonner';

export const UserAdmin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token, user: currentUser } = useAuthStore();

  // New User Modal State
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'NURSE'
  });

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({
    fullName: '',
    role: '',
    password: '' // Optional password reset
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleCreateUser = async () => {
    if (!newUserForm.username || !newUserForm.password || !newUserForm.fullName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/users', newUserForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      setIsNewUserModalOpen(false);
      setNewUserForm({ username: '', password: '', fullName: '', role: 'NURSE' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = { 
        fullName: editUserForm.fullName, 
        role: editUserForm.role 
      };
      if (editUserForm.password) {
        payload.password = editUserForm.password;
      }

      await axios.patch(`/api/users/${editingUser.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await axios.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditUserForm({
      fullName: user.fullName,
      role: user.role,
      password: ''
    });
    setIsEditModalOpen(true);
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">ADMIN</Badge>;
      case 'DOCTOR': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">DOCTOR</Badge>;
      case 'NURSE': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">NURSE</Badge>;
      case 'LAB_TECH': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">LAB TECH</Badge>;
      case 'PHARMACIST': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">PHARMACIST</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Administration</h1>
          <p className="text-muted-foreground">Manage clinic staff accounts and permissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isNewUserModalOpen} onOpenChange={setIsNewUserModalOpen}>
            <DialogTrigger render={
              <Button size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" /> Add New User
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Staff Account</DialogTitle>
                <DialogDescription>Enter the details for the new staff member.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-fullName">Full Name</Label>
                  <Input 
                    id="new-fullName" 
                    placeholder="e.g. Dr. Jane Smith" 
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm({...newUserForm, fullName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-username">Username</Label>
                    <Input 
                      id="new-username" 
                      placeholder="janesmith" 
                      value={newUserForm.username}
                      onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-role">Role</Label>
                    <Select 
                      value={newUserForm.role} 
                      onValueChange={(val) => setNewUserForm({...newUserForm, role: val})}
                    >
                      <SelectTrigger id="new-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                        <SelectItem value="NURSE">NURSE</SelectItem>
                        <SelectItem value="LAB_TECH">LAB TECH</SelectItem>
                        <SelectItem value="PHARMACIST">PHARMACIST</SelectItem>
                        <SelectItem value="RECEPTIONIST">RECEPTIONIST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Initial Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewUserModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateUser} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Create Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>View and manage all registered users.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.fullName}</div>
                      {u.id === currentUser?.id && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.username}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditModal(u)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Account</DialogTitle>
            <DialogDescription>Update details for {editingUser?.username}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name</Label>
              <Input 
                id="edit-fullName" 
                value={editUserForm.fullName}
                onChange={(e) => setEditUserForm({...editUserForm, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={editUserForm.role} 
                onValueChange={(val) => setEditUserForm({...editUserForm, role: val})}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="DOCTOR">DOCTOR</SelectItem>
                  <SelectItem value="NURSE">NURSE</SelectItem>
                  <SelectItem value="LAB_TECH">LAB TECH</SelectItem>
                  <SelectItem value="PHARMACIST">PHARMACIST</SelectItem>
                  <SelectItem value="RECEPTIONIST">RECEPTIONIST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 border-t">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 mb-2">
                <Key className="w-3 h-3" /> Reset Password (Optional)
              </Label>
              <Input 
                id="edit-password" 
                type="password" 
                placeholder="Leave blank to keep current password" 
                value={editUserForm.password}
                onChange={(e) => setEditUserForm({...editUserForm, password: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
