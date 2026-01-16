import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AlertTriangle, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API } from "../App";

const Register = ({ login }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match. Classic red flag behavior.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password too short. At least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      login(response.data.access_token, response.data.user);
      toast.success("Welcome to Unhinged! Let's set up your chaos profile.");
      navigate("/profile-setup");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed. The universe says no.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/discover';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <AlertTriangle className="w-10 h-10 text-emerald-500" />
          <span className="text-3xl font-bold tracking-tighter text-slate-900">UNHINGED</span>
        </div>

        {/* Card */}
        <div className="card-soft p-8">
          <h1 className="text-2xl font-bold mb-2 text-center text-slate-900">Create your profile</h1>
          <p className="text-slate-600 font-mono text-sm text-center mb-8">
            A few basics so we know who&apos;s behind the red flags.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 text-sm font-medium">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="How should we call you?"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white border border-[hsl(var(--border))] pl-10 h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                  required
                  data-testid="register-name-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white border border-[hsl(var(--border))] pl-10 h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                  required
                  data-testid="register-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white border border-[hsl(var(--border))] pl-10 h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                  required
                  data-testid="register-password-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 text-sm font-medium">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-white border border-[hsl(var(--border))] pl-10 h-12 font-mono text-slate-900 placeholder:text-slate-400 rounded-full"
                  required
                  data-testid="register-confirm-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-soft bg-emerald-500 text-white h-12 text-sm font-semibold mt-2"
              data-testid="register-submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign up"
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[hsl(var(--border))]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-slate-500 font-mono text-xs uppercase tracking-wide">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full btn-soft bg-white text-slate-900 border border-[hsl(var(--border))] h-12 text-sm font-semibold hover:bg-slate-50"
            data-testid="google-register-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            SIGN UP WITH GOOGLE
          </Button>

          <p className="text-center text-slate-600 font-mono text-sm mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 hover:underline" data-testid="login-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
