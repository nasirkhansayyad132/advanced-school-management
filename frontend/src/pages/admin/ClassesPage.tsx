import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit,
  Trash2,
  Eye,
  Users,
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Building
} from 'lucide-react';
import { Header, Card, DataTable, Badge, Button, Modal } from '../../components/ui';
import { classesApi } from '../../services/api';

interface ClassInfo {
  id: string;
  name: string;
  section?: string;
  grade: string;
  academicYear: string;
  isActive: boolean;
  studentCount: number;
  teachers: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
  createdAt: string;
}

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [newClass, setNewClass] = useState({
    name: '',
    section: '',
    grade: '',
    academicYear: new Date().getFullYear().toString(),
  });

  // Fetch classes from database
  const { data: classesData, isLoading, error, refetch } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.getAll({ limit: 100 }),
  });

  const classes: ClassInfo[] = classesData?.data || [];

  // Create class mutation
  const createMutation = useMutation({
    mutationFn: classesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setShowAddModal(false);
      setNewClass({
        name: '',
        section: '',
        grade: '',
        academicYear: new Date().getFullYear().toString(),
      });
      alert('Class added successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add class');
    },
  });

  // Update class mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => classesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setShowEditModal(false);
      setEditingClass(null);
      alert('Class updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update class');
    },
  });

  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: classesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      alert('Class deleted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete class');
    },
  });

  const handleAddClass = () => {
    if (!newClass.name || !newClass.grade || !newClass.academicYear) {
      alert('Please fill in all required fields');
      return;
    }
    
    createMutation.mutate({
      name: newClass.name,
      section: newClass.section || undefined,
      grade: newClass.grade,
      academicYear: newClass.academicYear,
    });
  };

  const handleEditClass = (classInfo: ClassInfo) => {
    setEditingClass({ ...classInfo });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingClass) return;
    
    updateMutation.mutate({
      id: editingClass.id,
      data: {
        name: editingClass.name,
        section: editingClass.section || undefined,
        grade: editingClass.grade,
        isActive: editingClass.isActive,
      },
    });
  };

  const handleDeleteClass = (classInfo: ClassInfo) => {
    if (confirm(`Are you sure you want to delete ${classInfo.name} - ${classInfo.section || 'No Section'}?`)) {
      deleteMutation.mutate(classInfo.id);
    }
  };

  const handleViewClass = (classInfo: ClassInfo) => {
    setSelectedClass(classInfo);
    setShowViewModal(true);
  };

  const getStudentCount = (classInfo: ClassInfo) => {
    return classInfo.studentCount || 0;
  };

  const columns = [
    {
      key: 'name',
      label: 'Class',
      sortable: true,
      render: (classInfo: ClassInfo) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {classInfo.name[0]}{classInfo.section?.[0] || ''}
          </div>
          <div>
            <p className="font-medium text-gray-900">{classInfo.name} {classInfo.section && `- ${classInfo.section}`}</p>
            <p className="text-sm text-gray-500">Grade: {classInfo.grade}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'academicYear',
      label: 'Academic Year',
      sortable: true,
      render: (classInfo: ClassInfo) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{classInfo.academicYear}</span>
        </div>
      ),
    },
    {
      key: 'students',
      label: 'Students',
      render: (classInfo: ClassInfo) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{getStudentCount(classInfo)}</span>
        </div>
      ),
    },
    {
      key: 'teacher',
      label: 'Primary Teacher',
      render: (classInfo: ClassInfo) => {
        const primary = classInfo.teachers?.find(t => t.isPrimary);
        return primary ? (
          <span className="text-gray-900">
            {primary.name}
          </span>
        ) : (
          <span className="text-gray-400 italic">Not assigned</span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (classInfo: ClassInfo) => (
        <Badge 
          variant={classInfo.isActive ? 'success' : 'danger'}
          dot
        >
          {classInfo.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading classes from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Failed to load classes</p>
          <p className="text-gray-600 mb-4">{(error as any).message}</p>
          <Button onClick={() => refetch()} icon={RefreshCw}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Classes Management" 
        subtitle={`${classes.length} classes in database`}
      />

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Classes</p>
                <p className="text-3xl font-bold mt-1">{classes.length}</p>
              </div>
              <BookOpen className="w-10 h-10 text-purple-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Classes</p>
                <p className="text-3xl font-bold mt-1">{classes.filter(c => c.isActive).length}</p>
              </div>
              <GraduationCap className="w-10 h-10 text-green-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Students</p>
                <p className="text-3xl font-bold mt-1">
                  {classes.reduce((sum, c) => sum + getStudentCount(c), 0)}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Academic Year</p>
                <p className="text-3xl font-bold mt-1">{new Date().getFullYear()}</p>
              </div>
              <Calendar className="w-10 h-10 text-orange-200" />
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'list' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} icon={RefreshCw}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Class
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classInfo) => (
              <Card 
                key={classInfo.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleViewClass(classInfo)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {classInfo.name[0]}{classInfo.section?.[0] || ''}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {classInfo.name} {classInfo.section && `- ${classInfo.section}`}
                      </h3>
                      <p className="text-sm text-gray-500">Grade: {classInfo.grade}</p>
                    </div>
                  </div>
                  <Badge variant={classInfo.isActive ? 'success' : 'danger'} dot>
                    {classInfo.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{getStudentCount(classInfo)} Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{classInfo.academicYear}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-gray-500">
                    {classInfo.teachers?.find(t => t.isPrimary) ? (
                      <span>
                        Teacher: {classInfo.teachers.find(t => t.isPrimary)?.name}
                      </span>
                    ) : (
                      <span className="italic">No teacher assigned</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditClass(classInfo); }}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(classInfo); }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* List View - Data Table */
          <DataTable
            data={classes}
            columns={columns}
            searchPlaceholder="Search classes..."
            onRowClick={handleViewClass}
            actions={(classInfo) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleViewClass(classInfo); }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEditClass(classInfo); }}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Class"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteClass(classInfo); }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Class"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        )}
      </main>

      {/* View Class Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Class Details"
        size="lg"
      >
        {selectedClass && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {selectedClass.name[0]}{selectedClass.section?.[0] || ''}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedClass.name} {selectedClass.section && `- ${selectedClass.section}`}
                </h3>
                <p className="text-gray-500">Grade: {selectedClass.grade}</p>
                <Badge variant={selectedClass.isActive ? 'success' : 'danger'} className="mt-2">
                  {selectedClass.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Academic Year</p>
                  <p className="font-medium">{selectedClass.academicYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Students</p>
                  <p className="font-medium">{getStudentCount(selectedClass)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Teachers Assigned</p>
                  <p className="font-medium">{selectedClass.teachers?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-medium">{new Date(selectedClass.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {selectedClass.teachers && selectedClass.teachers.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Assigned Teachers</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClass.teachers.map((teacher, idx) => (
                    <Badge key={idx} variant={teacher.isPrimary ? 'success' : 'info'}>
                      {teacher.name}
                      {teacher.isPrimary && ' (Primary)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button onClick={() => { setShowViewModal(false); handleEditClass(selectedClass); }}>
                Edit Class
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingClass(null); }}
        title="Edit Class"
        size="md"
      >
        {editingClass && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                <input 
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input 
                  type="text"
                  value={editingClass.section || ''}
                  onChange={(e) => setEditingClass({...editingClass, section: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
              <input 
                type="text"
                value={editingClass.grade}
                onChange={(e) => setEditingClass({...editingClass, grade: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={editingClass.isActive ? 'active' : 'inactive'}
                onChange={(e) => setEditingClass({...editingClass, isActive: e.target.value === 'active'})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" type="button" onClick={() => { setShowEditModal(false); setEditingClass(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Class Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Class"
        size="md"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddClass(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
              <input 
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Class 5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <input 
                type="text"
                value={newClass.section}
                onChange={(e) => setNewClass({...newClass, section: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., A, B, C"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
              <input 
                type="text"
                value={newClass.grade}
                onChange={(e) => setNewClass({...newClass, grade: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5th Grade"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <input 
                type="text"
                value={newClass.academicYear}
                onChange={(e) => setNewClass({...newClass, academicYear: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2024"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Class'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
