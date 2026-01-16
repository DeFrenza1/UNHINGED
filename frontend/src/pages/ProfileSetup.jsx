import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, ChevronRight, ChevronLeft, Camera, Flag, Skull, Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { API } from "../App";

const ProfileSetup = ({ user, setUser, token }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [redFlagSuggestions, setRedFlagSuggestions] = useState([]);
  const [qualitySuggestions, setQualitySuggestions] = useState([]);
  const [promptSuggestions, setPromptSuggestions] = useState([]);
  
  const [profile, setProfile] = useState({
    age: user?.age || "",
    bio: user?.bio || "",
    location: user?.location || "",
    looking_for: user?.looking_for || "",
    red_flags: user?.red_flags || [],
    negative_qualities: user?.negative_qualities || [],
    photos: user?.photos || [],
    worst_photo_caption: user?.worst_photo_caption || "",
    prompts: user?.prompts || []
  });

  const [customRedFlag, setCustomRedFlag] = useState("");
  const [customQuality, setCustomQuality] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const [flagsRes, promptsRes] = await Promise.all([
        axios.get(`${API}/red-flags/suggestions`),
        axios.get(`${API}/prompts/suggestions`)
      ]);
      setRedFlagSuggestions(flagsRes.data.red_flags);
      setQualitySuggestions(flagsRes.data.negative_qualities);
      setPromptSuggestions(promptsRes.data.prompts);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const saveProfile = async (showToast = true) => {
    try {
      const response = await axios.put(`${API}/profile`, profile, { headers });
      setUser(response.data);
      if (showToast) toast.success("Profile updated!");
      return response.data;
    } catch (error) {
      toast.error("Failed to save profile");
      throw error;
    }
  };

  const handleNext = async () => {
    if (step === 1 && (!profile.age || !profile.bio)) {
      toast.error("Fill in the basics first!");
      return;
    }
    if (step === 2 && profile.red_flags.length === 0) {
      toast.error("Add at least one red flag. We know you have them.");
      return;
    }
    if (step === 3 && profile.photos.length === 0) {
      toast.error("Add at least one terrible photo!");
      return;
    }

    setLoading(true);
    try {
      await saveProfile(false);
      if (step < 4) {
        setStep(step + 1);
      } else {
        toast.success("Profile complete! Time to find your match made in chaos.");
        navigate("/discover");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addRedFlag = (flag) => {
    if (!profile.red_flags.includes(flag)) {
      setProfile({ ...profile, red_flags: [...profile.red_flags, flag] });
    }
  };

  const removeRedFlag = (flag) => {
    setProfile({ ...profile, red_flags: profile.red_flags.filter(f => f !== flag) });
  };

  const addQuality = (quality) => {
    if (!profile.negative_qualities.includes(quality)) {
      setProfile({ ...profile, negative_qualities: [...profile.negative_qualities, quality] });
    }
  };

  const removeQuality = (quality) => {
    setProfile({ ...profile, negative_qualities: profile.negative_qualities.filter(q => q !== quality) });
  };

  const addPhoto = () => {
    if (photoUrl && !profile.photos.includes(photoUrl)) {
      setProfile({ ...profile, photos: [...profile.photos, photoUrl] });
      setPhotoUrl("");
    }
  };

  const removePhoto = (url) => {
    setProfile({ ...profile, photos: profile.photos.filter(p => p !== url) });
  };

  const updatePrompt = (promptId, answer) => {
    const existing = profile.prompts.find(p => p.id === promptId);
    if (existing) {
      setProfile({
        ...profile,
        prompts: profile.prompts.map(p => p.id === promptId ? { ...p, answer } : p)
      });
    } else {
      const promptData = promptSuggestions.find(p => p.id === promptId);
      setProfile({
        ...profile,
        prompts: [...profile.prompts, { id: promptId, question: promptData.question, answer }]
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <AlertTriangle className="w-8 h-8 text-[#39FF14]" />
          <span className="text-2xl font-bold tracking-tighter text-[#39FF14]">UNHINGED</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 flex items-center justify-center border-2 font-bold ${
                  s === step
                    ? "bg-[#39FF14] border-[#39FF14] text-black"
                    : s < step
                    ? "bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]"
                    : "border-white/20 text-white/40"
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={`w-16 md:w-24 h-0.5 ${s < step ? "bg-[#39FF14]" : "bg-white/20"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-[#111] border-2 border-white/20 p-6 md:p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold uppercase mb-2">THE BASICS</h2>
                <p className="text-[#E0E0E0]/60 font-mono text-sm">Don't worry, it only gets worse from here.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#E0E0E0] uppercase text-sm">Age</Label>
                  <Input
                    type="number"
                    placeholder="How many years of chaos?"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || "" })}
                    className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none"
                    data-testid="profile-age-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#E0E0E0] uppercase text-sm">Location</Label>
                  <Input
                    placeholder="Where do you spread chaos?"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none"
                    data-testid="profile-location-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#E0E0E0] uppercase text-sm">Bio (Be Honest)</Label>
                  <Textarea
                    placeholder="Describe your disaster energy in 3 sentences or less..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="bg-black border-2 border-white/30 min-h-[120px] font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none resize-none"
                    data-testid="profile-bio-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#E0E0E0] uppercase text-sm">Looking For</Label>
                  <Input
                    placeholder="More chaos? Stability? A plant that survives?"
                    value={profile.looking_for}
                    onChange={(e) => setProfile({ ...profile, looking_for: e.target.value })}
                    className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none"
                    data-testid="profile-looking-for-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Red Flags */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold uppercase mb-2 flex items-center justify-center gap-2">
                  <Flag className="w-6 h-6 text-red-500" />
                  YOUR RED FLAGS
                </h2>
                <p className="text-[#E0E0E0]/60 font-mono text-sm">Select all that apply. We're not judging. Okay, we are.</p>
              </div>

              {/* Selected Red Flags */}
              {profile.red_flags.length > 0 && (
                <div className="mb-6">
                  <Label className="text-[#E0E0E0] uppercase text-sm mb-2 block">Your Flags ({profile.red_flags.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {profile.red_flags.map((flag, i) => (
                      <Badge
                        key={i}
                        className="bg-red-900/30 border border-red-500/50 text-red-400 px-3 py-1 font-mono cursor-pointer hover:bg-red-900/50"
                        onClick={() => removeRedFlag(flag)}
                        data-testid={`selected-flag-${i}`}
                      >
                        🚩 {flag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-2">
                <Label className="text-[#E0E0E0] uppercase text-sm">Pick Your Poison</Label>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 border border-white/10">
                  {redFlagSuggestions.filter(f => !profile.red_flags.includes(f)).map((flag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-white/30 text-[#E0E0E0]/70 px-3 py-1 font-mono cursor-pointer hover:bg-white/10 hover:border-red-500"
                      onClick={() => addRedFlag(flag)}
                    >
                      + {flag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom Flag */}
              <div className="space-y-2">
                <Label className="text-[#E0E0E0] uppercase text-sm">Add Custom Red Flag</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="My unique disaster trait..."
                    value={customRedFlag}
                    onChange={(e) => setCustomRedFlag(e.target.value)}
                    className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none"
                    data-testid="custom-flag-input"
                  />
                  <Button
                    onClick={() => {
                      if (customRedFlag) {
                        addRedFlag(customRedFlag);
                        setCustomRedFlag("");
                      }
                    }}
                    className="bg-red-600 text-white px-4 hover:bg-red-700 rounded-none"
                    data-testid="add-custom-flag-btn"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Negative Qualities */}
              <div className="border-t-2 border-white/10 pt-6 mt-6">
                <Label className="text-[#E0E0E0] uppercase text-sm mb-3 block">Negative Qualities (Optional)</Label>
                
                {profile.negative_qualities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.negative_qualities.map((q, i) => (
                      <Badge
                        key={i}
                        className="bg-[#FF00FF]/20 border border-[#FF00FF]/50 text-[#FF00FF] px-3 py-1 font-mono cursor-pointer"
                        onClick={() => removeQuality(q)}
                      >
                        💀 {q} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 border border-white/10">
                  {qualitySuggestions.filter(q => !profile.negative_qualities.includes(q)).map((quality, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-white/30 text-[#E0E0E0]/70 px-3 py-1 font-mono cursor-pointer hover:bg-white/10 hover:border-[#FF00FF]"
                      onClick={() => addQuality(quality)}
                    >
                      + {quality}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Bad Photos */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold uppercase mb-2 flex items-center justify-center gap-2">
                  <Camera className="w-6 h-6 text-[#39FF14]" />
                  YOUR WORST PHOTOS
                </h2>
                <p className="text-[#E0E0E0]/60 font-mono text-sm">Bad lighting? Double chin? Perfect. Show us your real self.</p>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-3 gap-2">
                {profile.photos.map((url, i) => (
                  <div key={i} className="relative aspect-square border-2 border-white/20 overflow-hidden group">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(url)}
                      className="absolute top-1 right-1 bg-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`remove-photo-${i}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {profile.photos.length < 6 && (
                  <div className="aspect-square border-2 border-dashed border-white/20 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white/30" />
                  </div>
                )}
              </div>

              {/* Add Photo URL */}
              <div className="space-y-2">
                <Label className="text-[#E0E0E0] uppercase text-sm">Add Photo URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://your-terrible-photo.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none"
                    data-testid="photo-url-input"
                  />
                  <Button
                    onClick={addPhoto}
                    className="bg-[#39FF14] text-black px-4 hover:bg-[#39FF14]/80 rounded-none"
                    data-testid="add-photo-btn"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-[#E0E0E0]/40 font-mono text-xs">Tip: Use image URLs from Imgur, Unsplash, or any hosting service</p>
              </div>

              {/* Worst Photo Caption */}
              <div className="space-y-2">
                <Label className="text-[#E0E0E0] uppercase text-sm">Caption Your Worst Photo</Label>
                <Input
                  placeholder="The story behind your most chaotic pic..."
                  value={profile.worst_photo_caption}
                  onChange={(e) => setProfile({ ...profile, worst_photo_caption: e.target.value })}
                  className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none"
                  data-testid="photo-caption-input"
                />
              </div>
            </div>
          )}

          {/* Step 4: Prompts */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold uppercase mb-2 flex items-center justify-center gap-2">
                  <Skull className="w-6 h-6 text-[#FF00FF]" />
                  CHAOS PROMPTS
                </h2>
                <p className="text-[#E0E0E0]/60 font-mono text-sm">Answer at least 2. Be unhinged about it.</p>
              </div>

              <div className="space-y-4">
                {promptSuggestions.slice(0, 5).map((prompt) => {
                  const existing = profile.prompts.find(p => p.id === prompt.id);
                  return (
                    <div key={prompt.id} className="space-y-2">
                      <Label className="text-[#39FF14] font-mono text-sm">{prompt.question}</Label>
                      <Textarea
                        placeholder="Type your unhinged response..."
                        value={existing?.answer || ""}
                        onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                        className="bg-black border-2 border-white/30 min-h-[80px] font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none resize-none"
                        data-testid={`prompt-${prompt.id}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t-2 border-white/10">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-2 border-white/30 text-[#E0E0E0] hover:bg-white/10 rounded-none"
                data-testid="profile-back-btn"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                BACK
              </Button>
            ) : (
              <div />
            )}
            
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-[#39FF14] text-black font-bold uppercase px-8 border-2 border-[#39FF14] hover:bg-black hover:text-[#39FF14] transition-all btn-brutal rounded-none"
              data-testid="profile-next-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === 4 ? (
                "UNLEASH CHAOS"
              ) : (
                <>
                  NEXT
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
