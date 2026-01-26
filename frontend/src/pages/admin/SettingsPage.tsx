import { useState } from 'react';
import { 
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Mail,
  Smartphone,
  Clock,
  Calendar,
  Save,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Header, Card, CardHeader, Badge, Button } from '../../components/ui';
import clsx from 'clsx';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: typeof User;
  color: string;
}

const settingSections: SettingSection[] = [
  { id: 'profile', title: 'Profile Settings', description: 'Manage your personal information', icon: User, color: 'blue' },
  { id: 'notifications', title: 'Notifications', description: 'Configure notification preferences', icon: Bell, color: 'yellow' },
  { id: 'security', title: 'Security', description: 'Password and authentication', icon: Shield, color: 'red' },
  { id: 'appearance', title: 'Appearance', description: 'Customize the look and feel', icon: Palette, color: 'purple' },
  { id: 'school', title: 'School Settings', description: 'Configure school-wide settings', icon: Globe, color: 'green' },
  { id: 'data', title: 'Data & Backup', description: 'Manage data and backups', icon: Database, color: 'gray' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Settings" 
        subtitle="Manage your account and application settings"
      />

      <main className="p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0">
            <Card className="sticky top-6">
              <nav className="space-y-1">
                {settingSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left',
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <div className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      activeSection === section.id
                        ? `bg-${section.color}-100`
                        : 'bg-gray-100'
                    )}>
                      <section.icon className={clsx(
                        'w-5 h-5',
                        activeSection === section.id
                          ? `text-${section.color}-600`
                          : 'text-gray-400'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'font-medium truncate',
                        activeSection === section.id ? 'text-blue-600' : 'text-gray-900'
                      )}>
                        {section.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{section.description}</p>
                    </div>
                    <ChevronRight className={clsx(
                      'w-4 h-4 flex-shrink-0 transition-transform',
                      activeSection === section.id ? 'text-blue-600 rotate-90' : 'text-gray-300'
                    )} />
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Save Notification */}
            {saved && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 animate-fade-in">
                <CheckCircle2 className="w-5 h-5" />
                <span>Settings saved successfully!</span>
              </div>
            )}

            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <Card>
                <CardHeader title="Profile Settings" subtitle="Update your personal information" />
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      AD
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Change Photo</Button>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input 
                        type="text"
                        defaultValue="Admin"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input 
                        type="text"
                        defaultValue="User"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email"
                      defaultValue="admin@school.local"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel"
                      defaultValue="+1 234-567-8900"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input 
                      type="text"
                      defaultValue="Administrator"
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button icon={Save} onClick={handleSave}>Save Changes</Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <Card>
                <CardHeader title="Notification Preferences" subtitle="Choose how you want to be notified" />
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Email Notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3 ml-8">
                      {['Daily attendance summary', 'Chronic absentee alerts', 'System updates', 'Weekly reports'].map((item) => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                          <span className="text-sm text-gray-600">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Push Notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3 ml-8">
                      {['Real-time attendance alerts', 'Emergency notifications', 'Parent messages'].map((item) => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                          <span className="text-sm text-gray-600">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button icon={Save} onClick={handleSave}>Save Preferences</Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader title="Change Password" subtitle="Update your password regularly for security" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <Button icon={Shield}>Update Password</Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Two-Factor Authentication" subtitle="Add an extra layer of security" />
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Two-factor authentication is disabled</p>
                        <p className="text-sm text-gray-500">Protect your account with 2FA</p>
                      </div>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Active Sessions" subtitle="Manage your active sessions" />
                  <div className="space-y-3">
                    {[
                      { device: 'Chrome on MacBook Pro', location: 'New York, US', current: true, lastActive: 'Now' },
                      { device: 'Safari on iPhone', location: 'New York, US', current: false, lastActive: '2 hours ago' },
                      { device: 'Firefox on Windows', location: 'Los Angeles, US', current: false, lastActive: '3 days ago' },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{session.device}</p>
                              {session.current && <Badge variant="success" size="sm">Current</Badge>}
                            </div>
                            <p className="text-sm text-gray-500">{session.location} • {session.lastActive}</p>
                          </div>
                        </div>
                        {!session.current && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <Card>
                <CardHeader title="Appearance" subtitle="Customize the look and feel of the application" />
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'light', name: 'Light', active: true },
                        { id: 'dark', name: 'Dark', active: false },
                        { id: 'system', name: 'System', active: false },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          className={clsx(
                            'p-4 border-2 rounded-xl transition-all duration-200',
                            theme.active
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className={clsx(
                            'w-full h-20 rounded-lg mb-3',
                            theme.id === 'light' && 'bg-white border border-gray-200',
                            theme.id === 'dark' && 'bg-gray-800',
                            theme.id === 'system' && 'bg-gradient-to-r from-white to-gray-800'
                          )} />
                          <span className={clsx(
                            'text-sm font-medium',
                            theme.active ? 'text-blue-600' : 'text-gray-600'
                          )}>
                            {theme.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Primary Color</label>
                    <div className="flex gap-3">
                      {['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500'].map((color, i) => (
                        <button
                          key={color}
                          className={clsx(
                            'w-10 h-10 rounded-full transition-transform hover:scale-110',
                            color,
                            i === 0 && 'ring-2 ring-offset-2 ring-blue-500'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">Compact Sidebar</p>
                      <p className="text-sm text-gray-500">Use a smaller sidebar for more content space</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button icon={Save} onClick={handleSave}>Save Preferences</Button>
                  </div>
                </div>
              </Card>
            )}

            {/* School Settings */}
            {activeSection === 'school' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader title="School Information" subtitle="Basic school details" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                      <input 
                        type="text"
                        defaultValue="Advanced High School"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>2023-2024</option>
                          <option>2024-2025</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>America/New_York (EST)</option>
                          <option>America/Los_Angeles (PST)</option>
                          <option>Europe/London (GMT)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Attendance Settings" subtitle="Configure attendance rules" />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Start Time</label>
                        <input 
                          type="time"
                          defaultValue="08:00"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Late Threshold (minutes)</label>
                        <input 
                          type="number"
                          defaultValue="15"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Absentee Threshold (%)</label>
                        <input 
                          type="number"
                          defaultValue="75"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Lock Time</label>
                        <input 
                          type="time"
                          defaultValue="14:00"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <Button icon={Save} onClick={handleSave}>Save Settings</Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Data & Backup */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader title="Data Export" subtitle="Export your school data" />
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Export all your data</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Download a complete backup of all students, teachers, classes, and attendance records.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline">Export as CSV</Button>
                      <Button variant="outline">Export as Excel</Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Automatic Backups" subtitle="Schedule automatic data backups" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">Enable Automatic Backups</p>
                        <p className="text-sm text-gray-500">Backup your data automatically every day</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Backup Time</label>
                      <input 
                        type="time"
                        defaultValue="02:00"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period</label>
                      <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>7 days</option>
                        <option>14 days</option>
                        <option>30 days</option>
                        <option>90 days</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardHeader 
                    title="Danger Zone" 
                    subtitle="Irreversible actions"
                  />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">Reset All Data</p>
                        <p className="text-sm text-gray-500">This will permanently delete all data</p>
                      </div>
                      <Button variant="danger">Reset Data</Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
