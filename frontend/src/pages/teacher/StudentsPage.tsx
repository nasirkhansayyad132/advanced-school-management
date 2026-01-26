import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Header, Card, DataTable, Badge, Button, Modal } from '../../components/ui';
import { studentsApi, classesApi } from '../../services/api';
import clsx from 'clsx';

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address?: string;
  guardians?: Array<{ name: string; phone: string; relationship: string }>;
  medicalInfo?: string;
  isActive: boolean;
  class: {
    id: string;
    name: string;
    section: string;
  };
  createdAt: string;
}

interface ClassOption {
  id: string;
  name: string;
  section: string;
  grade: string;
}

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [newStudent, setNewStudent] = useState({
    admissionNo: '',
    firstName: '',
    lastName: '',
    classId: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    address: '',
    bloodGroup: '',
    guardianName: '',
    guardianPhone: '',
  });

  // Fetch students from database
  const { data: studentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll({ limit: 100 }),
  });

  // Fetch classes for dropdown
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll({ limit: 100 }),
  });

  const students: Student[] = studentsData?.data || [];
  const classes: ClassOption[] = classesData?.data || [];

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAddModal(false);
      setNewStudent({
        admissionNo: '',
        firstName: '',
        lastName: '',
        classId: '',
        dateOfBirth: '',
        gender: 'MALE',
        address: '',
        bloodGroup: '',
        guardianName: '',
        guardianPhone: '',
      });
      alert('Student added successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add student');
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowEditModal(false);
      setEditingStudent(null);
      alert('Student updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update student');
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: studentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      alert('Student deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete student');
    },
  });

  const handleAddStudent = () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.classId || !newStudent.admissionNo) {
      alert('Please fill in all required fields');
      return;
    }
    
    createMutation.mutate({
      admissionNo: newStudent.admissionNo,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      classId: newStudent.classId,
      dateOfBirth: newStudent.dateOfBirth || new Date().toISOString().split('T')[0],
      gender: newStudent.gender,
      address: newStudent.address || undefined,
      bloodGroup: newStudent.bloodGroup || undefined,
      guardians: newStudent.guardianName ? [{
        name: newStudent.guardianName,
        phone: newStudent.guardianPhone || '',
        relationship: 'GUARDIAN',
      }] : undefined,
    });
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent({ ...student });
    setShowEditModal(true);
  };                                                                                                                                                                                                           

  const handleSaveEdit = () => {
    if (!editingStudent) return;
    
    updateMutation.mutate({
      id: editingStudent.id,
      data: {
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        dateOfBirth: editingStudent.dateOfBirth,
        gender: editingStudent.gender,
        classId: editingStudent.class.id,
        address: editingStudent.address || undefined,
        bloodGroup: editingStudent.bloodGroup || undefined,
        isActive: editingStudent.isActive,
      },
    });
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) {
      deleteMutation.mutate(student.id);
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const columns = [
    {
      key: 'admissionNo',
      label: 'Admission #',
      sortable: true,
      render: (student: Student) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{student.admissionNo}</span>
      ),
    },
    {
      key: 'name',
      label: 'Student Name',
      sortable: true,
      render: (student: Student) => (
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
            student.gender === 'MALE' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'
          )}>
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
            <p className="text-sm text-gray-500">{student.gender}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      render: (student: Student) => (
        <span className="text-gray-900">{student.class.name} - {student.class.section}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (student: Student) => (
        <Badge 
          variant={student.isActive ? 'success' : 'danger'}
          dot
        >
          {student.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading students from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Failed to load students</p>
          <p className="text-gray-600 mb-4">{(error as any).message}</p>
          <Button onClick={() => refetch()} icon={RefreshCw}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Students" 
        subtitle={`${students.length} students in database`}
      />

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Students</p>
                <p className="text-3xl font-bold mt-1">{students.length}</p>
              </div>
              <User className="w-10 h-10 text-blue-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Students</p>
                <p className="text-3xl font-bold mt-1">{students.filter(s => s.isActive).length}</p>
              </div>
              <User className="w-10 h-10 text-green-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Male Students</p>
                <p className="text-3xl font-bold mt-1">{students.filter(s => s.gender === 'MALE').length}</p>
              </div>
              <User className="w-10 h-10 text-purple-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">Female Students</p>
                <p className="text-3xl font-bold mt-1">{students.filter(s => s.gender === 'FEMALE').length}</p>
              </div>
              <User className="w-10 h-10 text-pink-200" />
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => refetch()} icon={RefreshCw}>
            Refresh
          </Button>
          <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Student
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          data={students}
          columns={columns}
          searchPlaceholder="Search students..."
          onRowClick={handleViewStudent}
          actions={(student) => (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleViewStudent(student); }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleEditStudent(student); }}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit Student"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student); }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Student"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </main>

      {/* View Student Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Student Details"
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={clsx(
                'w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl',
                selectedStudent.gender === 'MALE' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'
              )}>
                {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-gray-500">Admission #: {selectedStudent.admissionNo}</p>
                <Badge variant={selectedStudent.isActive ? 'success' : 'danger'} className="mt-2">
                  {selectedStudent.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="font-medium">{selectedStudent.gender}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="font-medium">{new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium">{selectedStudent.class.name} - {selectedStudent.class.section}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="font-medium">{selectedStudent.bloodGroup || 'N/A'}</p>
                </div>
              </div>
            </div>

            {selectedStudent.address && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="font-medium">{selectedStudent.address}</p>
              </div>
            )}

            {selectedStudent.guardians && selectedStudent.guardians.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Guardian Information</h4>
                {selectedStudent.guardians.map((guardian, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{guardian.name}</p>
                    <p className="text-sm text-gray-500">{guardian.phone} • {guardian.relationship}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button onClick={() => { setShowViewModal(false); handleEditStudent(selectedStudent); }}>
                Edit Student
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingStudent(null); }}
        title="Edit Student"
        size="lg"
      >
        {editingStudent && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input 
                  type="text"
                  value={editingStudent.firstName}
                  onChange={(e) => setEditingStudent({...editingStudent, firstName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input 
                  type="text"
                  value={editingStudent.lastName}
                  onChange={(e) => setEditingStudent({...editingStudent, lastName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select 
                  value={editingStudent.gender}
                  onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input 
                  type="date"
                  value={editingStudent.dateOfBirth?.split('T')[0]}
                  onChange={(e) => setEditingStudent({...editingStudent, dateOfBirth: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <input 
                  type="text"
                  value={editingStudent.bloodGroup || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, bloodGroup: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., A+, B-, O+"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={editingStudent.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditingStudent({...editingStudent, isActive: e.target.value === 'active'})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea 
                value={editingStudent.address || ''}
                onChange={(e) => setEditingStudent({...editingStudent, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => { setShowEditModal(false); setEditingStudent(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Student"
        size="lg"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddStudent(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admission No *</label>
              <input 
                type="text"
                value={newStudent.admissionNo}
                onChange={(e) => setNewStudent({...newStudent, admissionNo: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., STU2026001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select 
                value={newStudent.classId}
                onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.section} ({cls.grade})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input 
                type="text"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input 
                type="text"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select 
                value={newStudent.gender}
                onChange={(e) => setNewStudent({...newStudent, gender: e.target.value as any})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input 
                type="date"
                value={newStudent.dateOfBirth}
                onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <input 
                type="text"
                value={newStudent.bloodGroup}
                onChange={(e) => setNewStudent({...newStudent, bloodGroup: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., A+, B-, O+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
              <input 
                type="text"
                value={newStudent.guardianName}
                onChange={(e) => setNewStudent({...newStudent, guardianName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
              <input 
                type="tel"
                value={newStudent.guardianPhone}
                onChange={(e) => setNewStudent({...newStudent, guardianPhone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input 
                type="text"
                value={newStudent.address}
                onChange={(e) => setNewStudent({...newStudent, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
