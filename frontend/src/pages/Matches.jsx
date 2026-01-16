import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { AlertTriangle, MessageCircle, Heart, Flag, Loader2, ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { API } from "../App";

const Matches = ({ user, token }) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API}/matches`, { headers });
      setMatches(response.data);
    } catch (error) {
      toast.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-purple-500" />
              <span className="text-xl font-bold text-slate-900">Matches</span>
            </div>
          </div>
          <div className="text-slate-500 font-mono text-sm">
            {matches.length} matches
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-slate-500 font-mono">Loading your matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Heart className="w-16 h-16 text-purple-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-slate-900">No matches yet</h2>
            <p className="text-slate-500 font-mono mb-6 max-w-md">
              Keep swiping in Discover to find people who can handle your red flags.
            </p>
            <Button
              onClick={() => navigate("/discover")}
              className="btn-soft bg-purple-500 text-white px-6 py-2 text-sm font-semibold"
              data-testid="back-to-discover-btn"
            >
              <Users className="w-5 h-5 mr-2" />
              FIND MATCHES
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.match_id}
                onClick={() => navigate(`/chat/${match.match_id}`)}
                className="card-soft p-4 flex items-center gap-4 cursor-pointer group"
                data-testid={`match-${match.match_id}`}
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl border border-[hsl(var(--border))] overflow-hidden flex-shrink-0">
                  {match.matched_user?.photos?.[0] || match.matched_user?.picture ? (
                    <img
                      src={match.matched_user?.photos?.[0] || match.matched_user?.picture}
                      alt={match.matched_user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                      <Flag className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-[#E0E0E0] truncate">
                      {match.matched_user?.name}
                    </h3>
                    {match.matched_user?.age && (
                      <span className="text-[#E0E0E0]/60 font-mono text-sm">
                        {match.matched_user?.age}
                      </span>
                    )}
                  </div>
                  
                  {/* Last message or red flags preview */}
                  {match.last_message ? (
                    <p className="text-[#E0E0E0]/60 font-mono text-sm truncate">
                      {match.last_message.sender_id === user?.user_id ? "You: " : ""}
                      {match.last_message.content}
                    </p>
                  ) : match.matched_user?.red_flags?.length > 0 ? (
                    <p className="text-red-400/70 font-mono text-xs truncate">
                      🚩 {match.matched_user.red_flags.slice(0, 2).join(" • ")}
                    </p>
                  ) : (
                    <p className="text-[#39FF14]/70 font-mono text-sm">
                      Start the chaos! Send a message.
                    </p>
                  )}
                </div>

                {/* Time & Action */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-[#E0E0E0]/40 font-mono text-xs">
                    {formatDate(match.created_at)}
                  </span>
                  <MessageCircle className="w-5 h-5 text-[#39FF14] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
