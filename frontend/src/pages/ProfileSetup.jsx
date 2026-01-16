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
    // Identity & basics
    name: user?.name || "",
    display_name: user?.display_name || user?.name || "",
    age: user?.age || "",
    bio: user?.bio || "",
    gender_identity: user?.gender_identity || "",
    pronouns: user?.pronouns || "",
    sexuality: user?.sexuality || "",
    interested_in: user?.interested_in || [],
    // Location
    location: user?.location || "",
    city: user?.city || "",
    country: user?.country || "",
    // Lifestyle
    height_cm: user?.height_cm || "",
    drinking: user?.drinking || "",
    smoking: user?.smoking || "",
    cannabis: user?.cannabis || "",
    drugs: user?.drugs || "",
    religion: user?.religion || "",
    politics: user?.politics || "",
    exercise: user?.exercise || "",
    diet: user?.diet || "",
    has_kids: user?.has_kids || "",
    wants_kids: user?.wants_kids || "",
    relationship_type: user?.relationship_type || "",
    // Red flags & prompts
    red_flags: user?.red_flags || [],
    dealbreaker_red_flags: user?.dealbreaker_red_flags || [],
    negative_qualities: user?.negative_qualities || [],
    photos: user?.photos || [],
    worst_photo_caption: user?.worst_photo_caption || "",
    prompts: user?.prompts || [],
    // What they are looking for
    looking_for: user?.looking_for || "",
    // Match preferences
    pref_age_min: user?.pref_age_min || "",
    pref_age_max: user?.pref_age_max || "",
    pref_genders: user?.pref_genders || [],
    pref_distance_km: user?.pref_distance_km || "",
    pref_wants_kids: user?.pref_wants_kids || "",
    pref_relationship_type: user?.pref_relationship_type || "",
  });

  const [customRedFlag, setCustomRedFlag] = useState("");
  const [customQuality, setCustomQuality] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [dealbreakerSelection, setDealbreakerSelection] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const url = `${NOMINATIM_URL}?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`;

          const res = await fetch(url, {
            headers: {
              "Accept": "application/json",
            },
          });

          if (!res.ok) {
            throw new Error(`Location lookup failed (${res.status})`);
          }

          const data = await res.json();
          const address = data.address || {};
          const city = address.city || address.town || address.village || address.suburb || "";
          const country = address.country || "";

          setProfile((prev) => ({
            ...prev,
            city: city || prev.city,
            country: country || prev.country,
          }));
        } catch (err) {
          console.error(err);
          setGeoError("Couldn&apos;t auto-detect your location. You can still type it manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      (error) => {
        let msg = "Failed to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. You can still type your city & country manually.";
        }
        setGeoError(msg);
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

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
      // Clean up empty strings and convert to null for backend validation
      const cleanProfile = Object.fromEntries(
        Object.entries(profile).map(([key, value]) => {
          if (value === "" || value === undefined) {
            return [key, null];
          }
          return [key, value];
        })
      );
      
      // Combine city/country into location string for backward compatibility
      const payload = {
        ...cleanProfile,
        location:
          cleanProfile.location ||
          [cleanProfile.city, cleanProfile.country].filter(Boolean).join(", ") ||
          null,
      };
      
      const response = await axios.put(`${API}/profile`, payload, { headers });
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
    <div className="min-h-screen bg-[hsl(var(--background))] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <AlertTriangle className="w-8 h-8 text-purple-500" />
          <span className="text-2xl font-bold tracking-tighter text-slate-900">UNHINGED</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 flex items-center justify-center border-2 font-bold ${
                  s === step
                    ? "bg-purple-500 border-purple-500 text-white"
                    : s < step
                    ? "bg-purple-100 border-purple-500 text-purple-700"
                    : "border-white/20 text-white/40"
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={`w-16 md:w-24 h-0.5 ${s < step ? "bg-purple-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="card-soft p-6 md:p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 text-slate-900">The basics</h2>
                <p className="text-slate-600 font-mono text-sm">A few details so we can find people who can handle your worst.</p>
              </div>

              <div className="space-y-4">
                {/* Name & display name */}
                <div className="space-y-2">
                  <Label className="text-slate-700 text-sm font-medium">Name</Label>
                  <Input
                    placeholder="What should we call you?"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                    data-testid="profile-display-name-input"
                  />
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label className="text-slate-700 text-sm font-medium">Age</Label>
                  <Input
                    type="number"
                    placeholder="How many years of chaos?"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || "" })}
                    className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                    data-testid="profile-age-input"
                  />
                </div>

                {/* Gender & pronouns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">Gender identity</Label>
                    <select
                      value={profile.gender_identity}
                      onChange={(e) => setProfile({ ...profile, gender_identity: e.target.value })}
                      className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] focus:border-[#39FF14] rounded-none px-3"
                      data-testid="profile-gender-input"
                    >
                      <option value="">Select your vibe</option>
                      <option value="woman">Woman</option>
                      <option value="man">Man</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="trans">Trans</option>
                      <option value="other">Other</option>
                      <option value="prefer_not">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">Pronouns</Label>
                    <select
                      value={profile.pronouns}
                      onChange={(e) => setProfile({ ...profile, pronouns: e.target.value })}
                      className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] focus:border-[#39FF14] rounded-none px-3"
                      data-testid="profile-pronouns-input"
                    >
                      <option value="">Select your chaos</option>
                      <option value="she/her">she/her</option>
                      <option value="he/him">he/him</option>
                      <option value="they/them">they/them</option>
                      <option value="she/they">she/they</option>
                      <option value="he/they">he/they</option>
                      <option value="custom">It&apos;s complicated</option>
                    </select>
                  </div>
                </div>

                {/* Sexuality / Interested in */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">Sexuality</Label>
                    <select
                      value={profile.sexuality}
                      onChange={(e) => setProfile({ ...profile, sexuality: e.target.value })}
                      className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] focus:border-[#39FF14] rounded-none px-3"
                      data-testid="profile-sexuality-input"
                    >
                      <option value="">Select your label</option>
                      <option value="straight">Straight</option>
                      <option value="gay">Gay</option>
                      <option value="lesbian">Lesbian</option>
                      <option value="bisexual">Bisexual</option>
                      <option value="pansexual">Pansexual</option>
                      <option value="queer">Queer</option>
                      <option value="asexual">Asexual</option>
                      <option value="questioning">Questioning</option>
                      <option value="prefer_not">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium">Interested in</Label>
                    <select
                      multiple
                      value={profile.pref_genders}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          pref_genders: Array.from(e.target.selectedOptions, (o) => o.value),
                        })
                      }
                      className="bg-black border-2 border-white/30 min-h-[3rem] font-mono text-[#E0E0E0] focus:border-[#39FF14] rounded-none px-3"
                      data-testid="profile-interested-in-input"
                    >
                      <option value="woman">Women</option>
                      <option value="man">Men</option>
                      <option value="non-binary">Non-binary people</option>
                      <option value="everyone">Everyone</option>
                    </select>
                    <p className="text-slate-500 font-mono text-xs">Tip: Hold Ctrl / Cmd to select multiple</p>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3 border-t-2 border-white/10 pt-4 mt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-slate-700 text-sm font-medium">Location</Label>
                      <p className="text-slate-500 font-mono text-xs">
                        We&apos;ll use your GPS (with permission) to guess your city &amp; country.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseLocation}
                      className="border border-purple-500 text-purple-600 hover:bg-purple-50 rounded-full text-xs px-3 py-2"
                      disabled={geoLoading}
                      data-testid="use-location-btn"
                    >
                      {geoLoading ? "LOCATING..." : "USE MY LOCATION"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 text-sm font-medium">City</Label>
                      <Input
                        placeholder="City of chaos"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                        data-testid="profile-city-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 text-sm font-medium">Country</Label>
                      <Input
                        placeholder="Country (optional)"
                        value={profile.country}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                        data-testid="profile-country-input"
                      />
                    </div>
                  </div>

                  {geoError && (
                    <p className="text-red-400 font-mono text-xs" data-testid="geo-error">
                      {geoError}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label className="text-slate-700 text-sm font-medium">Bio (be honest)</Label>
                  <Textarea
                    placeholder="Describe your disaster energy in 3 sentences or less..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="bg-black border-2 border-white/30 min-h-[120px] font-mono text-[#E0E0E0] placeholder:text-white/30 focus:border-[#39FF14] rounded-none resize-none"
                    data-testid="profile-bio-input"
                  />
                </div>

                {/* Looking for */}
                <div className="space-y-2">
                  <Label className="text-slate-700 text-sm font-medium">Looking for</Label>
                  <select
                    value={profile.looking_for}
                    onChange={(e) => setProfile({ ...profile, looking_for: e.target.value })}
                    className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] focus:border-[#39FF14] rounded-none px-3"
                    data-testid="profile-looking-for-input"
                  >
                    <option value="">Choose your bad idea</option>
                    <option value="chaos_only">Chaos only (no stability pls)</option>
                    <option value="short_term">Short-term fun</option>
                    <option value="long_term">Long-term relationship</option>
                    <option value="open_to_anything">Open to anything</option>
                    <option value="friends_first">Friends first</option>
                    <option value="situationships">Situationships</option>
                    <option value="still_figuring_it_out">Still figuring it out</option>
                  </select>
                </div>

                {/* Lifestyle & match prefs (preview) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[hsl(var(--border))] pt-4 mt-4"
                  <div className="space-y-2">
                    <Label className="text-[#E0E0E0] uppercase text-sm">Drinking</Label>
                    <select
                      value={profile.drinking}
                      onChange={(e) => setProfile({ ...profile, drinking: e.target.value })}
                      className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] focus:border-[#39FF14] rounded-none px-3"
                    >
                      <option value="">Select</option>
                      <option value="never">Never</option>
                      <option value="rarely">Rarely</option>
                      <option value="socially">Socially</option>
                      <option value="often">Frequently</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E0E0E0] uppercase text-sm">Smoking</Label>
                    <select
                      value={profile.smoking}
                      onChange={(e) => setProfile({ ...profile, smoking: e.target.value })}
                      className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] focus:border-[#39FF14] rounded-none px-3"
                    >
                      <option value="">Select</option>
                      <option value="no">No</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="socially">Socially</option>
                      <option value="regularly">Regularly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E0E0E0] uppercase text-sm">Exercise</Label>
                    <select
                      value={profile.exercise}
                      onChange={(e) => setProfile({ ...profile, exercise: e.target.value })}
                      className="bg-black border-2 border-white/30 h-12 font-mono text-[#E0E0E0] focus:border-[#39FF14] rounded-none px-3"
                    >
                      <option value="">Select</option>
                      <option value="never">Never</option>
                      <option value="sometimes">Sometimes</option>
                      <option value="often">Often</option>
                    </select>
                  </div>
                </div>

                {/* Match age range */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[hsl(var(--border))] pt-4 mt-4"
                  <div className="space-y-2">
                    <Label className="text-[#E0E0E0] uppercase text-sm">Pref Age Min</Label>
                    <Input
                      type="number"
                      value={profile.pref_age_min}
                      onChange={(e) => setProfile({ ...profile, pref_age_min: parseInt(e.target.value) || "" })}
                      className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E0E0E0] uppercase text-sm">Pref Age Max</Label>
                    <Input
                      type="number"
                      value={profile.pref_age_max}
                      onChange={(e) => setProfile({ ...profile, pref_age_max: parseInt(e.target.value) || "" })}
                      className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#E0E0E0] uppercase text-sm">Max Distance (km)</Label>
                    <Input
                      type="number"
                      value={profile.pref_distance_km}
                      onChange={(e) => setProfile({ ...profile, pref_distance_km: parseInt(e.target.value) || "" })}
                      className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                    />
                  </div>
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
                <p className="text-[#E0E0E0]/60 font-mono text-sm">Select all that apply. We&apos;re not judging. Okay, we are.</p>
              </div>

              {/* Selected Red Flags */}
              {profile.red_flags.length > 0 && (
                <div className="mb-6">
                  <Label className="text-slate-700 text-sm font-medium mb-2 block">Your flags ({profile.red_flags.length})</Label>
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

              {/* Dealbreaker Red Flags */}
              {profile.red_flags.length > 0 && (
                <div className="mt-4">
                  <Label className="text-[#E0E0E0] uppercase text-sm mb-2 block">Mark Dealbreakers (optional)</Label>
                  <p className="text-[#E0E0E0]/40 font-mono text-xs mb-2">These are the chaos levels you absolutely won&apos;t tolerate.</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.red_flags.map((flag, i) => {
                      const isDealbreaker = profile.dealbreaker_red_flags.includes(flag);
                      return (
                        <Badge
                          key={`deal-${i}`}
                          className={`px-3 py-1 font-mono cursor-pointer border ${
                            isDealbreaker
                              ? "bg-red-900/80 border-red-500 text-red-100"
                              : "bg-transparent border-white/30 text-[#E0E0E0]/70"
                          }`}
                          onClick={() => {
                            if (isDealbreaker) {
                              setProfile({
                                ...profile,
                                dealbreaker_red_flags: profile.dealbreaker_red_flags.filter((f) => f !== flag),
                              });
                            } else {
                              setProfile({
                                ...profile,
                                dealbreaker_red_flags: [...profile.dealbreaker_red_flags, flag],
                              });
                            }
                          }}
                        >
                          {isDealbreaker ? "☠️ Dealbreaker: " : "⚠️ Maybe not: "}
                          {flag}
                        </Badge>
                      );
                    })}
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
                    className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
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
                    className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
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
