import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { AlertTriangle, X, Heart, Flag, MapPin, Sparkles, MessageCircle, Loader2, RefreshCw, Users, Settings } from "lucide-react";
import { toast } from "sonner";
import { API } from "../App";

const Discover = ({ user, token }) => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchModal, setMatchModal] = useState(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const [compatibility, setCompatibility] = useState(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/discover`, { headers });
      setProfiles(response.data);
      setCurrentIndex(0);
    } catch (error) {
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action) => {
    if (swiping || currentIndex >= profiles.length) return;
    
    const targetUser = profiles[currentIndex];
    setSwiping(true);

    try {
      const response = await axios.post(
        `${API}/swipe`,
        { target_user_id: targetUser.user_id, action },
        { headers }
      );

      if (response.data.match_created) {
        setMatchModal(response.data.match);
        toast.success("IT'S A MATCH! Two disasters, one chaos.");
      }

      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      toast.error("Swipe failed. The universe intervened.");
    } finally {
      setSwiping(false);
    }
  };

  const analyzeCompatibility = async (targetUserId) => {
    setCompatibilityLoading(true);
    try {
      const response = await axios.post(
        `${API}/ai/analyze-compatibility/${targetUserId}`,
        {},
        { headers }
      );
      setCompatibility(response.data.analysis);
    } catch (error) {
      toast.error("AI is also confused by this chaos");
    } finally {
      setCompatibilityLoading(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Navigation */}
      <nav className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/discover")}>
            <AlertTriangle className="w-6 h-6 text-emerald-500" />
            <span className="text-xl font-bold text-slate-900">UNHINGED</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/matches")}
              className="text-slate-600 hover:text-emerald-500 hover:bg-emerald-50 relative"
              data-testid="nav-matches-btn"
            >
              <Users className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              data-testid="nav-settings-btn"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-500 font-mono">Finding people who match your flavor of chaos...</p>
          </div>
        ) : profiles.length === 0 || currentIndex >= profiles.length ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Flag className="w-16 h-16 text-emerald-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-slate-900">You&apos;re all caught up</h2>
            <p className="text-slate-500 font-mono mb-6">
              You&apos;ve seen everyone for now. Check back soon for more beautifully flawed humans.
            </p>
            <Button
              onClick={fetchProfiles}
              className="btn-soft bg-emerald-500 text-white px-6 py-2 text-sm font-semibold"
              data-testid="refresh-profiles-btn"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              REFRESH
            </Button>
          </div>
        ) : currentProfile && (
          <>
            {/* Profile Card */}
            <div className="card-soft overflow-hidden" data-testid="profile-card">
              {/* Photo */}
              <div className="relative aspect-[3/4] bg-[#1a1a1a]">
                {currentProfile.photos && currentProfile.photos.length > 0 ? (
                  <img
                    src={currentProfile.photos[0]}
                    alt={currentProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Flag className="w-20 h-20 text-white/20" />
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                {/* Name & Age */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-3xl font-bold text-white">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  {currentProfile.location && (
                    <p className="text-white/70 font-mono text-sm flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {currentProfile.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Bio */}
                {currentProfile.bio && (
                  <p className="text-[#E0E0E0]/80 font-mono text-sm">{currentProfile.bio}</p>
                )}

                {/* Red Flags */}
                {currentProfile.red_flags && currentProfile.red_flags.length > 0 && (
                  <div>
                    <h3 className="text-[#FF3B30] font-bold uppercase text-sm mb-2 flex items-center gap-1">
                      <Flag className="w-4 h-4" />
                      RED FLAGS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.red_flags.slice(0, 5).map((flag, i) => (
                        <Badge
                          key={i}
                          className="bg-red-900/30 border border-red-500/50 text-red-400 px-2 py-0.5 font-mono text-xs"
                        >
                          🚩 {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Negative Qualities */}
                {currentProfile.negative_qualities && currentProfile.negative_qualities.length > 0 && (
                  <div>
                    <h3 className="text-[#FF00FF] font-bold uppercase text-sm mb-2">NEGATIVE QUALITIES</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.negative_qualities.slice(0, 4).map((q, i) => (
                        <Badge
                          key={i}
                          className="bg-[#FF00FF]/20 border border-[#FF00FF]/50 text-[#FF00FF] px-2 py-0.5 font-mono text-xs"
                        >
                          💀 {q}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompts */}
                {currentProfile.prompts && currentProfile.prompts.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    {currentProfile.prompts.slice(0, 2).map((prompt, i) => (
                      <div key={i} className="mb-3">
                        <p className="text-[#39FF14] font-mono text-xs mb-1">{prompt.question}</p>
                        <p className="text-[#E0E0E0] font-mono text-sm">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Compatibility Button */}
                <Button
                  variant="outline"
                  onClick={() => analyzeCompatibility(currentProfile.user_id)}
                  disabled={compatibilityLoading}
                  className="w-full border-2 border-[#00FFFF]/50 text-[#00FFFF] hover:bg-[#00FFFF]/10 font-mono rounded-none"
                  data-testid="analyze-compatibility-btn"
                >
                  {compatibilityLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  ANALYZE CHAOS COMPATIBILITY
                </Button>

                {/* Compatibility Result */}
                {compatibility && (
                  <div className="bg-[#00FFFF]/10 border border-[#00FFFF]/30 p-3 font-mono text-sm text-[#00FFFF]">
                    {compatibility}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6 mt-6">
              <Button
                onClick={() => handleSwipe("pass")}
                disabled={swiping}
                className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-red-500/50 hover:bg-red-500/20 hover:border-red-500 transition-all"
                data-testid="pass-btn"
              >
                <X className="w-8 h-8 text-red-500" />
              </Button>
              <Button
                onClick={() => handleSwipe("like")}
                disabled={swiping}
                className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-[#39FF14]/50 hover:bg-[#39FF14]/20 hover:border-[#39FF14] transition-all"
                data-testid="like-btn"
              >
                <Heart className="w-8 h-8 text-[#39FF14]" />
              </Button>
            </div>

            {/* Counter */}
            <p className="text-center text-[#E0E0E0]/40 font-mono text-sm mt-4">
              {currentIndex + 1} / {profiles.length} disasters viewed
            </p>
          </>
        )}
      </div>

      {/* Match Modal */}
      <Dialog open={!!matchModal} onOpenChange={() => setMatchModal(null)}>
        <DialogContent className="bg-[#111] border-2 border-[#39FF14] text-[#E0E0E0] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="text-[#39FF14] text-4xl font-bold uppercase mb-2 neon-text">IT&apos;S A MATCH!</div>
              <p className="text-[#E0E0E0]/60 font-mono text-sm">Two beautiful disasters, united in chaos</p>
            </DialogTitle>
          </DialogHeader>
          
          {matchModal && (
            <div className="text-center py-4">
              <div className="flex justify-center items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full border-2 border-[#39FF14] overflow-hidden">
                  <img
                    src={user?.picture || "https://via.placeholder.com/80"}
                    alt="You"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Heart className="w-8 h-8 text-[#FF00FF] animate-pulse" />
                <div className="w-20 h-20 rounded-full border-2 border-[#FF00FF] overflow-hidden">
                  <img
                    src={matchModal.matched_user?.photos?.[0] || matchModal.matched_user?.picture || "https://via.placeholder.com/80"}
                    alt={matchModal.matched_user?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <p className="font-mono text-lg mb-6">
                You and <span className="text-[#39FF14]">{matchModal.matched_user?.name}</span> have matched!
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setMatchModal(null)}
                  className="flex-1 border-2 border-white/30 text-[#E0E0E0] hover:bg-white/10 rounded-none"
                >
                  KEEP SWIPING
                </Button>
                <Button
                  onClick={() => {
                    setMatchModal(null);
                    navigate(`/chat/${matchModal.match_id}`);
                  }}
                  className="flex-1 bg-[#39FF14] text-black font-bold hover:bg-[#39FF14]/80 rounded-none"
                  data-testid="send-message-btn"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  SEND MESSAGE
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discover;
