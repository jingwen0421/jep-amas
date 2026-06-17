import { useState } from 'react';
import { User, Bell, Lock, Palette, Globe } from 'lucide-react';
import logo from '../../imports/501660136_122109878822875527_8989073406723948038_n.jpg';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ color: '#284342' }}>Settings</h1>
        <p style={{ color: '#6b6b6b' }}>Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: activeTab === tab.id ? 'rgba(40, 67, 66, 0.1)' : 'transparent',
                      color: activeTab === tab.id ? '#284342' : '#6b6b6b',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ color: '#284342' }}>Profile Settings</h2>
                  <p style={{ color: '#6b6b6b' }}>Update your personal information</p>
                </div>

                <div className="flex items-center gap-4">
                  <img src={logo} alt="Profile" className="w-20 h-20 rounded-full object-cover" style={{ background: '#284342' }} />
                  <div>
                    <button
                      className="px-4 py-2 rounded-xl transition-all hover:opacity-90 mb-2"
                      style={{ background: '#284342', color: '#e9da95' }}
                    >
                      Change Photo
                    </button>
                    <p className="text-sm" style={{ color: '#6b6b6b' }}>JPG, PNG or GIF. Max size 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2" style={{ color: '#284342' }}>First Name</label>
                    <input
                      type="text"
                      defaultValue="Admin"
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2" style={{ color: '#284342' }}>Last Name</label>
                    <input
                      type="text"
                      defaultValue="User"
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2" style={{ color: '#284342' }}>Email Address</label>
                  <input
                    type="email"
                    defaultValue="admin@beautyacademy.com"
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                  />
                </div>

                <div>
                  <label className="block mb-2" style={{ color: '#284342' }}>Phone Number</label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                  />
                </div>

                <div>
                  <label className="block mb-2" style={{ color: '#284342' }}>Bio</label>
                  <textarea
                    rows={4}
                    defaultValue="Academy Administrator"
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                  />
                </div>

                <button
                  className="px-6 py-3 rounded-xl transition-all hover:opacity-90"
                  style={{ background: '#284342', color: '#e9da95' }}
                >
                  Save Changes
                </button>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ color: '#284342' }}>Notification Preferences</h2>
                  <p style={{ color: '#6b6b6b' }}>Manage how you receive notifications</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'New Student Enrollment', description: 'Get notified when a new student enrolls' },
                    { label: 'Payment Received', description: 'Alerts for successful payments' },
                    { label: 'Low Attendance Alerts', description: 'Notifications for students with low attendance' },
                    { label: 'Course Completion', description: 'When a student completes a course' },
                    { label: 'System Updates', description: 'Important system announcements' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: 'rgba(233, 218, 149, 0.1)' }}
                    >
                      <div>
                        <p style={{ color: '#284342' }}>{item.label}</p>
                        <p className="text-sm" style={{ color: '#6b6b6b' }}>{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ background: '#284342' }}></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ color: '#284342' }}>Security Settings</h2>
                  <p style={{ color: '#6b6b6b' }}>Manage your account security</p>
                </div>

                <div>
                  <h3 style={{ color: '#284342' }}>Change Password</h3>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block mb-2" style={{ color: '#284342' }}>Current Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: '#284342' }}>New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                      />
                    </div>
                    <div>
                      <label className="block mb-2" style={{ color: '#284342' }}>Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
                      />
                    </div>
                    <button
                      className="px-6 py-3 rounded-xl transition-all hover:opacity-90"
                      style={{ background: '#284342', color: '#e9da95' }}
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
                  <h3 className="mb-4" style={{ color: '#284342' }}>Two-Factor Authentication</h3>
                  <p className="mb-4" style={{ color: '#6b6b6b' }}>Add an extra layer of security to your account</p>
                  <button
                    className="px-6 py-3 rounded-xl transition-all hover:opacity-90"
                    style={{ background: 'rgba(40, 67, 66, 0.1)', color: '#284342' }}
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ color: '#284342' }}>Appearance Settings</h2>
                  <p style={{ color: '#6b6b6b' }}>Customize the look and feel</p>
                </div>

                <div>
                  <h3 className="mb-4" style={{ color: '#284342' }}>Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Light', 'Dark', 'Auto'].map((theme) => (
                      <div
                        key={theme}
                        className="p-4 rounded-xl border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: theme === 'Light' ? '#284342' : 'rgba(40, 67, 66, 0.2)',
                          background: theme === 'Light' ? 'rgba(40, 67, 66, 0.05)' : 'transparent',
                        }}
                      >
                        <div className="aspect-video rounded-lg mb-3" style={{ background: theme === 'Dark' ? '#1a1a1a' : '#f8f8f6' }} />
                        <p className="text-center" style={{ color: '#284342' }}>{theme}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4" style={{ color: '#284342' }}>Brand Colors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: 'Primary', color: '#284342' },
                      { name: 'Accent', color: '#e9da95' },
                      { name: 'Background', color: '#f8f8f6' },
                      { name: 'Text', color: '#1a1a1a' },
                    ].map((item) => (
                      <div key={item.name} className="text-center">
                        <div
                          className="w-full h-20 rounded-xl mb-2"
                          style={{ background: item.color }}
                        />
                        <p style={{ color: '#284342' }}>{item.name}</p>
                        <p className="text-sm" style={{ color: '#6b6b6b' }}>{item.color}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ color: '#284342' }}>System Preferences</h2>
                  <p style={{ color: '#6b6b6b' }}>Customize your experience</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2" style={{ color: '#284342' }}>Language</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2" style={{ color: '#284342' }}>Timezone</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
                    >
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2" style={{ color: '#284342' }}>Date Format</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
                    >
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2" style={{ color: '#284342' }}>Currency</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'rgba(40, 67, 66, 0.2)', color: '#284342' }}
                    >
                      <option>MYR (RM)</option>
                      <option>USD ($)</option>
                      <option>SGD (S$)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>

                  <button
                    className="px-6 py-3 rounded-xl transition-all hover:opacity-90"
                    style={{ background: '#284342', color: '#e9da95' }}
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
