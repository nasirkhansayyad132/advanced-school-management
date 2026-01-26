import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Users,
  BookOpen
} from 'lucide-react';
import { Header, Card, DataTable, Badge, Button, Modal } from '../../components/ui';
import { teachersApi } from '../../services/api';

interface Teacher {
  id: string;
  employeeId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
  phone?: string;
  address?: string;
  qualification?: string;
  dateOfJoining: string;
  classAssignments?: Array<{
    class: {
      id: string;
      name: string;
      section: string;
    };
    isPrimary: boolean;
  }>;
  createdAt: string;
}

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  
  const [newTeacher, setNewTeacher] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    qualification: '',
    address: '',
  });

  // Fetch teachers from database
  const { data: teachersData, isLoading, error, refetch } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersApi.getAll({ limit: 100 }),
  });

  const teachers: Teacher[] = teachersData?.data || [];

  // Create teacher mutation
  const createMutation = useMutation({
    mutationFn: teachersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setShowAddModal(false);
      setNewTeacher({
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        qualification: '',
        address: '',
      });
      alert('Teacher added successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add teacher');
    },
  });

  // Update teacher mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => teachersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setShowEditModal(false);
      setEditingTeacher(null);
      alert('Teacher updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update teacher');
    },
  });

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: teachersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      alert('Teacher deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete teacher');
    },
  });

  const handleAddTeacher = () => {
    if (!newTeacher.firstName || !newTeacher.lastName || !newTeacher.email || !newTeacher.employeeId || !newTeacher.password) {
      alert('Please fill in all required fields');
      return;
    }
    
    createMutation.mutate({
      employeeId: newTeacher.employeeId,
      firstName: newTeacher.firstName,
      lastName: newTeacher.lastName,
      email: newTeacher.email,
      password: newTeacher.password,
      phone: newTeacher.phone || undefined,
      qualification: newTeacher.qualification || undefined,
      address: newTeacher.address || undefined,
    });
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher({ ...teacher });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingTeacher) return;
    
    updateMutation.mutate({
      id: editingTeacher.id,
      data: {
        firstName: editingTeacher.user.firstName,
        lastName: editingTeacher.user.lastName,
        phone: editingTeacher.phone || undefined,
        qualification: editingTeacher.qualification || undefined,
        address: editingTeacher.address || undefined,
        isActive: editingTeacher.user.isActive,
      },
    });
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    if (confirm(`Are you sure you want to delete ${teacher.user.firstName} ${teacher.user.lastName}?`)) {
      deleteMutation.mutate(teacher.id);
    }
  };

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  const columns = [
    {
      key: 'employeeId',
      label: 'Employee ID',
      sortable: true,
      render: (teacher: Teacher) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{teacher.employeeId}</span>
      ),
    },
    {
      key: 'name',
      label: 'Teacher Name',
      sortable: true,
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {teacher.user.firstName[0]}{teacher.user.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{teacher.user.firstName} {teacher.user.lastName}</p>
            <p className="text-sm text-gray-500">{teacher.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (teacher: Teacher) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Mail className="w-3.5 h-3.5" />
            <span>{teacher.user.email}</span>
          </div>
          {teacher.phone && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Phone className="w-3.5 h-3.5" />
              <span>{teacher.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'qualification',
      label: 'Qualification',
      render: (teacher: Teacher) => (
        <span className="text-gray-600">{teacher.qualification || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (teacher: Teacher) => (
        <Badge 
          variant={teacher.user.isActive ? 'success' : 'danger'}
          dot
        >
          {teacher.user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading teachers from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Failed to load teachers</p>
          <p className="text-gray-600 mb-4">{(error as any).message}</p>
          <Button onClick={() => refetch()} icon={RefreshCw}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Teachers Management" 
        subtitle={`${teachers.length} teachers in database`}
      />

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Teachers</p>
                <p className="text-3xl font-bold mt-1">{teachers.length}</p>
              </div>
              <GraduationCap className="w-10 h-10 text-blue-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Teachers</p>
                <p className="text-3xl font-bold mt-1">{teachers.filter(t => t.user.isActive).length}</p>
              </div>
              <Users className="w-10 h-10 text-green-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">With Classes</p>
                <p className="text-3xl font-bold mt-1">
                  {teachers.filter(t => t.classAssignments && t.classAssignments.length > 0).length}
                </p>
              </div>
              <BookOpen className="w-10 h-10 text-purple-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Inactive</p>
                <p className="text-3xl font-bold mt-1">{teachers.filter(t => !t.user.isActive).length}</p>
              </div>
              <Users className="w-10 h-10 text-orange-200" />
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => refetch()} icon={RefreshCw}>
            Refresh
          </Button>
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Teacher
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          data={teachers}
          columns={columns}
          searchPlaceholder="Search teachers..."
          onRowClick={handleViewTeacher}
          actions={(teacher) => (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleViewTeacher(teacher); }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleEditTeacher(teacher); }}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit Teacher"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(teacher); }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Teacher"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </main>

      {/* View Teacher Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Teacher Details"
        size="lg"
      >
        {selectedTeacher && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {selectedTeacher.user.firstName[0]}{selectedTeacher.user.lastName[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedTeacher.user.firstName} {selectedTeacher.user.lastName}
                </h3>
                <p className="text-gray-500">Employee ID: {selectedTeacher.employeeId}</p>
                <Badge variant={selectedTeacher.user.isActive ? 'success' : 'danger'} className="mt-2">
                  {selectedTeacher.user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{selectedTeacher.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{selectedTeacher.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Qualification</p>
                  <p className="font-medium">{selectedTeacher.qualification || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Classes Assigned</p>
                  <p className="font-medium">{selectedTeacher.classAssignments?.length || 0}</p>
                </div>
              </div>
            </div>

            {selectedTeacher.classAssignments && selectedTeacher.classAssignments.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Assigned Classes</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.classAssignments.map((assignment, idx) => (
                    <Badge key={idx} variant={assignment.isPrimary ? 'success' : 'info'}>
                      {assignment.class.name} - {assignment.class.section}
                      {assignment.isPrimary && ' (Primary)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button onClick={() => { setShowViewModal(false); handleEditTeacher(selectedTeacher); }}>
                Edit Teacher
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingTeacher(null); }}
        title="Edit Teacher"
        size="lg"
      >
        {editingTeacher && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input 
                  type="text"
                  value={editingTeacher.user.firstName}
                  onChange={(e) => setEditingTeacher({
                    ...editingTeacher, 
                    user: {...editingTeacher.user, firstName: e.target.value}
                  })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input 
                  type="text"
                  value={editingTeacher.user.lastName}
                  onChange={(e) => setEditingTeacher({
                    ...editingTeacher, 
                    user: {...editingTeacher.user, lastName: e.target.value}
                  })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input 
                  type="tel"
                  value={editingTeacher.phone || ''}
                  onChange={(e) => setEditingTeacher({...editingTeacher, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input 
                  type="text"
                  value={editingTeacher.qualification || ''}
                  onChange={(e) => setEditingTeacher({...editingTeacher, qualification: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea 
                value={editingTeacher.address || ''}
                onChange={(e) => setEditingTeacher({...editingTeacher, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={editingTeacher.user.isActive ? 'active' : 'inactive'}
                onChange={(e) => setEditingTeacher({
                  ...editingTeacher, 
                  user: {...editingTeacher.user, isActive: e.target.value === 'active'}
                })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => { setShowEditModal(false); setEditingTeacher(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Teacher Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Teacher"
        size="lg"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddTeacher(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
              <input 
                type="text"
                value={newTeacher.employeeId}
                onChange={(e) => setNewTeacher({...newTeacher, employeeId: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., TCH001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input 
                type="email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="teacher@school.local"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input 
                type="text"
                value={newTeacher.firstName}
                onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input 
                type="text"
                value={newTeacher.lastName}
                onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input 
                type="password"
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input 
                type="tel"
                value={newTeacher.phone}
                onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input 
                type="text"
                value={newTeacher.qualification}
                onChange={(e) => setNewTeacher({...newTeacher, qualification: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., M.Sc Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input 
                type="text"
                value={newTeacher.address}
                onChange={(e) => setNewTeacher({...newTeacher, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Teacher'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
