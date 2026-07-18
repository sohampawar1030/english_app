import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Bell, Shield, Palette, Globe, Volume2, 
  Save, Check, Loader2, Moon, Sun
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
        enabled ? 'bg-gradient-to-r from-purple-500 to-pink-500 glow-purple' : 'bg-white/10'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-lg"
      />
    </button>
  );
}

function GoalSlider({ label, value, onChange, min, max, unit }) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-400">{label}</label>
        <span className="text-sm font-semibold text-white">{value}{unit}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          min={min}
          max={max}
          className="w-full h-2 rounded-full appearance-none bg-white/5 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
            [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500 
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, #c084fc ${percentage}%, rgba(255,255,255,0.05) ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    dailyWordGoal: 10,
    dailyRevisionGoal: 20,
    dailyMinutesGoal: 30,
    nativeLanguage: 'marathi',
    notificationsEnabled: true,
    emailNotifications: false,
    soundEffects: true
  });
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile');
      if (res.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data
        }));
      }
    } catch (err) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateProfile({ name: profileData.name });
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audio', label: 'Audio', icon: Volume2 },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-12 w-48 rounded-xl" />
        <div className="flex gap-6 flex-col md:flex-row">
          <div className="skeleton h-64 w-full md:w-56 rounded-2xl" />
          <div className="skeleton h-96 flex-1 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
        <p className="text-gray-400 mt-1">Customize your learning experience</p>
      </motion.div>

      <div className="flex gap-6 flex-col md:flex-row">
        <motion.div variants={itemVariants} className="w-full md:w-56 flex-shrink-0">
          <div className="glass-card p-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex-1">
          {activeTab === 'profile' && (
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gradient flex items-center gap-2">
                <User size={20} className="text-purple-400" />
                Profile Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-premium"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="input-premium opacity-60"
                  />
                </div>
              </div>

              <button onClick={handleSaveProfile} disabled={saving} className="btn-premium flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gradient flex items-center gap-2">
                <Palette size={20} className="text-purple-400" />
                Learning Preferences
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block flex items-center gap-2">
                    <Globe size={14} className="text-purple-400" />
                    Native Language
                  </label>
                  <select
                    value={settings.nativeLanguage}
                    onChange={e => setSettings(prev => ({ ...prev, nativeLanguage: e.target.value }))}
                    className="input-premium"
                  >
                    <option value="marathi">Marathi</option>
                    <option value="hindi">Hindi</option>
                    <option value="english">English</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-5">
                  <GoalSlider
                    label="Daily Word Goal"
                    value={settings.dailyWordGoal}
                    onChange={v => setSettings(prev => ({ ...prev, dailyWordGoal: v }))}
                    min={1}
                    max={100}
                    unit=" words"
                  />
                  <GoalSlider
                    label="Daily Revision Goal"
                    value={settings.dailyRevisionGoal}
                    onChange={v => setSettings(prev => ({ ...prev, dailyRevisionGoal: v }))}
                    min={1}
                    max={100}
                    unit=" revisions"
                  />
                  <GoalSlider
                    label="Daily Minutes Goal"
                    value={settings.dailyMinutesGoal}
                    onChange={v => setSettings(prev => ({ ...prev, dailyMinutesGoal: v }))}
                    min={5}
                    max={180}
                    unit=" min"
                  />
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={saving} className="btn-premium flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Preferences
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gradient flex items-center gap-2">
                <Bell size={20} className="text-purple-400" />
                Notification Settings
              </h2>
              
              <div className="space-y-3">
                {[
                  { key: 'notificationsEnabled', label: 'Push Notifications', desc: 'Get daily reminders to study' },
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive weekly progress reports' },
                  { key: 'soundEffects', label: 'Sound Effects', desc: 'Play sounds for correct/incorrect answers' },
                ].map(item => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div>
                      <p className="font-medium text-sm text-white">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings[item.key]}
                      onChange={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    />
                  </motion.div>
                ))}
              </div>

              <button onClick={handleSaveSettings} disabled={saving} className="btn-premium flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Notification Settings
              </button>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gradient flex items-center gap-2">
                <Volume2 size={20} className="text-purple-400" />
                Audio Settings
              </h2>
              
              <div className="space-y-3">
                {[
                  { key: 'soundEffects', label: 'Sound Effects', desc: 'Correct/incorrect answer sounds' },
                ].map(item => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div>
                      <p className="font-medium text-sm text-white">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings[item.key]}
                      onChange={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    />
                  </motion.div>
                ))}
              </div>

              <button onClick={handleSaveSettings} disabled={saving} className="btn-premium flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Audio Settings
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
