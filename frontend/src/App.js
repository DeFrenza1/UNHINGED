import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Axios defaults
axios.defaults.withCredentials = true;

// Auth Context
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const checkAuth = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/auth/me`, { headers });
      setUser(response.data);
    } catch (error) {
      setUser(null);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return { user, setUser, loading, token, login, logout, checkAuth };
};

// Protected Route
const ProtectedRoute = ({ children, user, loading }) => {
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-purple-500 font-mono text-xl animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Auth Callback for Google OAuth
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const AuthCallback = ({ login }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        try {
          const response = await axios.post(
            `${API}/auth/session`,
            {},
            { headers: { "X-Session-ID": sessionId } }
          );
          
          if (response.data.session_token && response.data.user) {
            login(response.data.session_token, response.data.user);
            toast.success("Welcome to the chaos!");
            
            // Check if profile is complete
            if (!response.data.user.profile_complete) {
              navigate("/profile-setup", { replace: true });
            } else {
              navigate("/discover", { replace: true });
            }
          }
        } catch (error) {
          console.error("Auth error:", error);
          toast.error("Authentication failed. Try again.");
          navigate("/login", { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
      <div className="text-purple-500 font-mono text-xl animate-pulse">AUTHENTICATING...</div>
    </div>
  );
};

// App Router
function AppRouter({ auth }) {
  const location = useLocation();
  const { user, loading, login, logout, setUser, token } = auth;

  // Check for session_id in URL hash (Google OAuth callback)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback login={login} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? (user.profile_complete ? <Navigate to="/discover" replace /> : <Navigate to="/profile-setup" replace />) : <Login login={login} />} />
      <Route path="/register" element={user ? (user.profile_complete ? <Navigate to="/discover" replace /> : <Navigate to="/profile-setup" replace />) : <Register login={login} />} />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <ProfileSetup user={user} setUser={setUser} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discover"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <Discover user={user} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <Matches user={user} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:matchId"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <Chat user={user} token={token} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <Settings user={user} setUser={setUser} logout={logout} token={token} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const auth = useAuth();

  return (
    <div className="App min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <BrowserRouter>
        <AppRouter auth={auth} />
      </BrowserRouter>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(222, 28%, 13%)',
            color: 'hsl(210, 40%, 96%)',
            borderRadius: '9999px',
            border: '1px solid hsl(215, 25%, 22%)',
            fontFamily: 'Space Mono, monospace',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.5)',
          },
        }}
      />
    </div>
  );
}

export default App;
