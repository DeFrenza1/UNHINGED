import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AlertTriangle, ArrowLeft, Send, Loader2, Sparkles, Flag } from "lucide-react";
import { toast } from "sonner";
import { API } from "../App";

const Chat = ({ user, token }) => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [messages, setMessages] = useState([]);
  const [matchedUser, setMatchedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingIcebreaker, setGeneratingIcebreaker] = useState(false);
  const messagesEndRef = useRef(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchMessages();
    fetchMatchInfo();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMatchInfo = async () => {
    try {
      const response = await axios.get(`${API}/matches`, { headers });
      const match = response.data.find(m => m.match_id === matchId);
      if (match) {
        setMatchedUser(match.matched_user);
      }
    } catch (error) {
      console.error("Failed to fetch match info:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/matches/${matchId}/messages`, { headers });
      setMessages(response.data);
    } catch (error) {
      if (loading) toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await axios.post(
        `${API}/matches/${matchId}/messages`,
        { content: newMessage },
        { headers }
      );
      setMessages([...messages, response.data]);
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const generateIcebreaker = async () => {
    if (!matchedUser) return;
    
    setGeneratingIcebreaker(true);
    try {
      const response = await axios.post(
        `${API}/ai/icebreaker/${matchedUser.user_id}`,
        {},
        { headers }
      );
      setNewMessage(response.data.icebreaker);
      toast.success("AI icebreaker generated!");
    } catch (error) {
      toast.error("AI couldn't handle the chaos");
    } finally {
      setGeneratingIcebreaker(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/matches")}
            className="text-slate-600 hover:text-purple-500 hover:bg-purple-50"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          {matchedUser && (
            <div className="flex items-center gap-3 flex-grow">
              <div className="w-10 h-10 rounded-full border border-[hsl(var(--border))] overflow-hidden bg-slate-100">
                {matchedUser.photos?.[0] || matchedUser.picture ? (
                  <img
                    src={matchedUser.photos?.[0] || matchedUser.picture}
                    alt={matchedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <Flag className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{matchedUser.name}</h2>
                <p className="text-slate-500 font-mono text-xs">
                  {matchedUser.red_flags?.[0] ? `🚩 ${matchedUser.red_flags[0]}` : "Chaotic match"}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
              <p className="text-slate-500 font-mono text-sm">Loading your chat...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertTriangle className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-slate-900">Say hi</h3>
              <p className="text-slate-500 font-mono text-sm mb-6 max-w-sm">
                You matched! Break the ice with something a little unhinged (or let AI help).
              </p>
              <Button
                onClick={generateIcebreaker}
                disabled={generatingIcebreaker}
                className="btn-soft bg-purple-500 text-white px-6 py-2 text-sm font-semibold"
                data-testid="generate-icebreaker-btn"
              >
                {generatingIcebreaker ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI ICEBREAKER
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-4">
                    <span className="text-slate-500 font-mono text-xs bg-white px-3 py-1 border border-[hsl(var(--border))] rounded-full">
                      {date}
                    </span>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-2">
                    {dateMessages.map((message) => {
                      const isMe = message.sender_id === user?.user_id;
                      return (
                        <div
                          key={message.message_id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={
                              isMe
                                ? "chat-bubble-me"
                                : "chat-bubble-them"
                            }
                            data-testid={`message-${message.message_id}`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? "text-black/60" : "text-white/40"}`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t-2 border-white/10 bg-[#0a0a0a] flex-shrink-0">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={generateIcebreaker}
              disabled={generatingIcebreaker}
              className="text-[#00FFFF] hover:bg-[#00FFFF]/10 flex-shrink-0"
              title="Generate AI icebreaker"
              data-testid="icebreaker-btn"
            >
              {generatingIcebreaker ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type something unhinged..."
              className="bg-white border border-[hsl(var(--border))] h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full flex-grow"
              data-testid="message-input"
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="btn-soft bg-purple-500 text-white px-4 flex-shrink-0"
              data-testid="send-btn"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
