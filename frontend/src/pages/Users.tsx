import React, { useEffect, useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon,
  XMarkIcon,
  UsersIcon,
  CogIcon,
  KeyIcon,
  AtSymbolIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { usersApi } from '../utils/api';
import { User, CreateUserData } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    role: 'tagger'
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await usersApi.create(formData);
      fetchUsers();
      setShowModal(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'tagger'
      });
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await usersApi.toggleActive(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await usersApi.delete(userId);
        fetchUsers();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Error deleting user');
      }
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'tagger':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'tagger':
        return 'Tagger';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soccer-green"></div>
          <UsersIcon className="h-12 w-12 text-soccer-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <UsersIcon className="h-10 w-10 text-yellow-300" />
                <h1 className="text-4xl font-bold">User Management</h1>
              </div>
              <p className="text-purple-100 text-lg mb-4">Manage user accounts and permissions</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  👥 {users.length} Total Users
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  ✅ {users.filter(u => u.is_active).length} Active
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  🛡️ {users.filter(u => u.role === 'super_admin').length} Admins
                </Badge>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <Button
                onClick={() => setShowModal(true)}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {users.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <UsersIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No users found</h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">Create your first user account to get started</p>
            <Button
              onClick={() => setShowModal(true)}
              size="lg"
              className="shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, index) => {
            const gradients = [
              'from-blue-500 to-indigo-600',
              'from-emerald-500 to-teal-600',
              'from-purple-500 to-pink-600',
              'from-orange-500 to-red-600',
              'from-cyan-500 to-blue-600',
              'from-rose-500 to-pink-600',
            ];
            const gradient = gradients[index % gradients.length];

            return (
              <Card
                key={user.id}
                className="border-0 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                {/* User Header */}
                <div className={`bg-gradient-to-br ${gradient} p-6 text-white relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{user.username}</h3>
                          <div className="flex items-center space-x-1 text-white/90">
                            <AtSymbolIcon className="h-4 w-4" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </div>
                      </div>
                      {user.role === 'super_admin' && (
                        <ShieldCheckIcon className="h-6 w-6 text-yellow-300" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant={getRoleBadgeVariant(user.role) as any}
                        className="bg-white/20 text-white border-white/30"
                      >
                        {user.role === 'super_admin' ? '🛡️ ' : '👤 '}
                        {getRoleDisplayName(user.role)}
                      </Badge>

                      <div className="flex items-center space-x-1">
                        {user.is_active ? (
                          <EyeIcon className="h-4 w-4 text-green-300" />
                        ) : (
                          <EyeSlashIcon className="h-4 w-4 text-red-300" />
                        )}
                        <span className="text-sm text-white/90">
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* User Info */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Account Status</span>
                      <Badge
                        variant={user.is_active ? 'success' : 'destructive'}
                        className="text-xs"
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Created</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleToggleActive(user.id)}
                      variant={user.is_active ? "outline" : "default"}
                      size="sm"
                      className="flex-1"
                    >
                      {user.is_active ? (
                        <>
                          <EyeSlashIcon className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleDeleteUser(user.id)}
                      variant="ghost"
                      size="sm"
                      className="px-3 hover:bg-red-50 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-gray-900">
                    <UserGroupIcon className="h-5 w-5 text-purple-600" />
                    <span>Create New User</span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Add a new user account to the system
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Username
                  </label>
                  <Input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="Enter username"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    <AtSymbolIcon className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <Input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    <KeyIcon className="h-4 w-4 inline mr-1" />
                    Password
                  </label>
                  <Input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    <CogIcon className="h-4 w-4 inline mr-1" />
                    Role
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'super_admin' | 'tagger' })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="tagger">👤 Tagger</option>
                    <option value="super_admin">🛡️ Super Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setError('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Users;