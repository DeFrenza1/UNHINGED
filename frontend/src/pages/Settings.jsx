import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { AlertTriangle, ArrowLeft, LogOut, Loader2, Sparkles, Edit2, X, Plus, Camera, User } from "lucide-react";
import { toast } from "sonner";
import { API } from "../App";

const Settings = ({ user, setUser, logout, token }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roastLoading, setRoastLoading] = useState(false);
  const [roast, setRoast] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  const [profile, setProfile] = useState({
    name: user?.name || "",
    age: user?.age || "",
    bio: user?.bio || "",
    location: user?.location || "",
    looking_for: user?.looking_for || "",
    red_flags: user?.red_flags || [],
    negative_qualities: user?.negative_qualities || [],
    photos: user?.photos || [],
    picture: user?.picture || ""
  });

  const [newFlag, setNewFlag] = useState("");
  const [newQuality, setNewQuality] = useState("");
  const [newPhoto, setNewPhoto] = useState("");

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const saveProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${API}/profile`, profile, { headers });
      setUser(response.data);
      toast.success("Profile updated!");
      setEditMode(false);
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const generateRoast = async () => {
    setRoastLoading(true);
    try {
      const response = await axios.post(`${API}/ai/roast`, {}, { headers });
      setRoast(response.data.roast);
    } catch (error) {
      toast.error("AI couldn't roast you. That's concerning.");
    } finally {
      setRoastLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("Logged out. The chaos continues without you.");
  };

  const addFlag = () => {
    if (newFlag && !profile.red_flags.includes(newFlag)) {
      setProfile({ ...profile, red_flags: [...profile.red_flags, newFlag] });
      setNewFlag("");
    }
  };

  const removeFlag = (flag) => {
    setProfile({ ...profile, red_flags: profile.red_flags.filter(f => f !== flag) });
  };

  const addQuality = () => {
    if (newQuality && !profile.negative_qualities.includes(newQuality)) {
      setProfile({ ...profile, negative_qualities: [...profile.negative_qualities, newQuality] });
      setNewQuality("");
    }
  };

  const removeQuality = (quality) => {
    setProfile({ ...profile, negative_qualities: profile.negative_qualities.filter(q => q !== quality) });
  };

  const addPhoto = () => {
    if (newPhoto && !profile.photos.includes(newPhoto)) {
      setProfile({ ...profile, photos: [...profile.photos, newPhoto] });
      setNewPhoto("");
    }
  };

  const removePhoto = (url) => {
  const handleDisableAccount = async () => {
    try {
      await axios.post(`${API}/users/me/disable`, {}, { headers });
      toast.success("Account disabled. You won't appear in discovery anymore.");
      navigate("/");
    } catch (error) {
      toast.error("Failed to disable account.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`${API}/users/me`, { headers });
      await logout();
      navigate("/");
      toast.success("Account deleted. Thanks for sharing your chaos.");
    } catch (error) {
      toast.error("Failed to delete account.");
    }
  };


    setProfile({ ...profile, photos: profile.photos.filter(p => p !== url) });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Navigation */}
      <nav className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/discover")}
              className="text-slate-600 hover:text-purple-500 hover:bg-purple-50"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-purple-500" />
              <span className="text-xl font-bold text-slate-900">Settings</span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-mono"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5 mr-2" />
            LOGOUT
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="card-soft p-6 mb-6 bg-white">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl border border-[hsl(var(--border))] overflow-hidden flex-shrink-0 bg-slate-100">
              {profile.photos?.[0] || profile.picture ? (
                <img
                  src={profile.photos?.[0] || profile.picture}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-slate-600 font-mono text-sm">{user?.email}</p>
              {user?.location && (
                <p className="text-slate-500 font-mono text-sm mt-1">{user?.location}</p>
              )}
              <div className="mt-2">
                <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-mono rounded-full">
                  {user?.profile_complete ? "CHAOS CERTIFIED" : "INCOMPLETE PROFILE"}
                </Badge>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditMode(!editMode)}
              className="border border-[hsl(var(--border))] text-slate-700 hover:bg-slate-100 rounded-full"
              data-testid="edit-profile-btn"
            >
              <Edit2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* AI Roast Section */}
        <div className="card-soft p-6 mb-6 bg-white border border-[hsl(var(--border))]">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-slate-900">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Get roasted by AI
          </h3>
          <p className="text-slate-600 font-mono text-sm mb-4">
            Let our AI generate a personalized roast based on your red flags. Share it with your matches (if they can handle it).
          </p>
          <Button
            onClick={generateRoast}
            disabled={roastLoading}
            className="btn-soft bg-purple-500 text-white px-6 py-2 text-sm font-semibold"
            data-testid="generate-roast-btn"
          >
            {roastLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            ROAST ME
          </Button>
          {roast && (
            <div className="mt-4 bg-purple-50 border border-purple-200 p-4 font-mono text-sm text-slate-800 rounded-2xl">
              &quot;{roast}&quot;
            </div>
          )}
        </div>

        {/* Edit Profile Form */}
        {editMode && (
          <div className="card-soft bg-white p-6 space-y-6">
            <h3 className="text-lg font-bold mb-4 border-b border-[hsl(var(--border))] pb-2 inline-block text-slate-900">
              Edit profile
            </h3>

            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm font-medium">Name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                  data-testid="settings-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm font-medium">Age</Label>
                <Input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || "" })}
                  className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                  data-testid="settings-age-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm font-medium">Bio</Label>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="bg-white border border-[hsl(var(--border))] min-h-[100px] font-mono text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-2xl resize-none"
                data-testid="settings-bio-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 text-sm font-medium">Location</Label>
              <Input
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                data-testid="settings-location-input"
              />
            </div>


            {/* Danger Zone */}
            <div className="mt-8 border-t border-[hsl(var(--border))] pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-red-600">Danger zone</h3>
              <p className="text-slate-500 font-mono text-xs max-w-md">
                You can temporarily hide your profile or permanently delete your account. Deleting is irreversible.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisableAccount}
                  className="border border-amber-400 text-amber-700 hover:bg-amber-50 rounded-full text-xs px-4 py-2"
                  data-testid="disable-account-btn"
                >
                  Disable account
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="border border-red-400 text-red-600 hover:bg-red-50 rounded-full text-xs px-4 py-2"
                      data-testid="delete-account-btn"
                    >
                      Delete account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border border-[hsl(var(--border))] rounded-2xl max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Delete your account?</DialogTitle>
                    </DialogHeader>
                    <p className="text-slate-600 font-mono text-xs mb-4">
                      This will permanently delete your profile, matches, and messages. This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border border-[hsl(var(--border))] text-slate-700 hover:bg-slate-100 rounded-full text-xs px-4 py-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="btn-soft bg-red-500 text-white text-xs px-4 py-2"
                        data-testid="confirm-delete-account-btn"
                      >
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Red Flags */}
            <div className="space-y-3">
              <Label className="text-red-400 uppercase text-sm">Red Flags</Label>
              <div className="flex flex-wrap gap-2">
                {profile.red_flags.map((flag, i) => (
                  <Badge
                    key={i}
                    className="bg-red-900/30 border border-red-500/50 text-red-400 px-2 py-1 font-mono cursor-pointer"
                    onClick={() => removeFlag(flag)}
                  >
                    🚩 {flag} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newFlag}
                  onChange={(e) => setNewFlag(e.target.value)}
                  placeholder="Add new red flag..."
                  className="bg-white border border-[hsl(var(--border))] h-10 font-mono text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                />
                <Button onClick={addFlag} className="bg-red-600 text-white px-3 hover:bg-red-700 rounded-none">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Negative Qualities */}
            <div className="space-y-3">
              <Label className="text-[#FF00FF] uppercase text-sm">Negative Qualities</Label>
              <div className="flex flex-wrap gap-2">
                {profile.negative_qualities.map((q, i) => (
                  <Badge
                    key={i}
                    className="bg-[#FF00FF]/20 border border-[#FF00FF]/50 text-[#FF00FF] px-2 py-1 font-mono cursor-pointer"
                    onClick={() => removeQuality(q)}
                  >
                    💀 {q} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newQuality}
                  onChange={(e) => setNewQuality(e.target.value)}
                  placeholder="Add negative quality..."
                  className="bg-white border border-[hsl(var(--border))] h-10 font-mono text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                />
                <Button onClick={addQuality} className="bg-[#FF00FF] text-white px-3 hover:bg-[#FF00FF]/80 rounded-none">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-3">
              <Label className="text-slate-700 text-sm font-medium flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photos
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {profile.photos.map((url, i) => (
                  <div key={i} className="relative aspect-square border-2 border-white/20 overflow-hidden group">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(url)}
                      className="absolute top-1 right-1 bg-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newPhoto}
                  onChange={(e) => setNewPhoto(e.target.value)}
                  placeholder="Photo URL..."
                  className="bg-white border border-[hsl(var(--border))] h-10 font-mono text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
                />
                <Button onClick={addPhoto} className="btn-soft bg-purple-500 text-white px-3 py-2 text-xs">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setEditMode(false)}
                className="flex-1 border border-[hsl(var(--border))] text-slate-700 hover:bg-slate-100 rounded-full"
              >
                CANCEL
              </Button>
              <Button
                onClick={saveProfile}
                disabled={loading}
                className="flex-1 btn-soft bg-purple-500 text-white font-semibold"
                data-testid="save-profile-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "SAVE CHANGES"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Profile Preview (when not editing) */}
        {!editMode && (
          <div className="card-soft bg-white p-6 space-y-4">
            <h3 className="text-lg font-bold mb-4 border-b border-[hsl(var(--border))] pb-2 inline-block text-slate-900">
              YOUR PROFILE
            </h3>

            {user?.bio && (
              <div>
                <Label className="text-slate-500 text-xs">Bio</Label>
                <p className="text-slate-700 font-mono">{user.bio}</p>
              </div>
            )}

            {user?.red_flags?.length > 0 && (
              <div>
                <Label className="text-red-400 uppercase text-xs">Red Flags</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.red_flags.map((flag, i) => (
                    <Badge key={i} className="bg-red-900/30 border border-red-500/50 text-red-400 font-mono text-xs">
                      🚩 {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {user?.negative_qualities?.length > 0 && (
              <div>
                <Label className="text-[#FF00FF] uppercase text-xs">Negative Qualities</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.negative_qualities.map((q, i) => (
                    <Badge key={i} className="bg-[#FF00FF]/20 border border-[#FF00FF]/50 text-[#FF00FF] font-mono text-xs">
                      💀 {q}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {user?.looking_for && (
              <div>
                <Label className="text-slate-500 text-xs">Looking for</Label>
                <p className="text-slate-700 font-mono">{user.looking_for}</p>
              </div>
            )}

            <Button
              onClick={() => navigate("/profile-setup")}
              variant="outline"
              className="w-full border border-purple-400 text-purple-600 hover:bg-purple-50 font-mono rounded-full mt-4"
              data-testid="edit-full-profile-btn"
            >
              EDIT FULL PROFILE
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
