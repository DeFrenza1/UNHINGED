import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { AlertTriangle, Heart, Skull, Zap, MessageCircle, Camera, Flag } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Flag className="w-8 h-8" />,
      title: "FLAUNT YOUR FLAGS",
      description: "Finally, a place where your red flags are your best feature."
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "BAD PHOTOS ONLY",
      description: "Double chin? Blurry? Perfect. Your worst photo is your profile pic."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "CHAOS MATCHING",
      description: "Our algorithm finds people whose flaws complement yours. Opposites attract."
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "UNHINGED CHAT",
      description: "AI-powered icebreakers and roasts to keep conversations chaotic."
    }
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 text-[#39FF14]/10 text-9xl font-bold rotate-12">🚩</div>
          <div className="absolute bottom-40 right-20 text-[#FF00FF]/10 text-8xl font-bold -rotate-12">💀</div>
          <div className="absolute top-1/2 left-1/3 text-[#00FFFF]/10 text-7xl font-bold rotate-6">⚡</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-20 relative z-10">
          {/* Nav */}
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-emerald-500" />
              <span className="text-2xl font-bold tracking-tighter text-slate-900">UNHINGED</span>
            </div>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="text-[#E0E0E0] hover:text-[#39FF14] hover:bg-transparent font-mono uppercase"
                onClick={() => navigate("/login")}
                data-testid="nav-login-btn"
              >
                Login
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-[#FF00FF] text-black px-4 py-1 font-bold text-sm uppercase mb-6 rotate-1">
              ANTI-DATING APP
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight text-slate-900">
              <span className="block">If you can&apos;t handle</span>
              <span className="block text-emerald-500">my worst red flags,</span>
              <span className="block text-slate-700 text-2xl md:text-3xl mt-2">you don&apos;t deserve my slightly better selfies.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 font-mono mb-10 max-w-2xl mx-auto">
              The dating app where your red flags are features, not bugs.
              Match with people who like you messy and still show up for your best.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="btn-soft bg-emerald-500 text-white px-10 py-4 text-base"
                onClick={() => navigate("/register")}
                data-testid="cta-enter-chaos-btn"
              >
                <Skull className="w-5 h-5 mr-2" />
                Start your disaster arc
              </Button>
              <Button
                variant="outline"
                className="btn-soft bg-white text-slate-900 border border-slate-200 px-10 py-4 text-base hover:bg-slate-50"
                onClick={() => navigate("/login")}
                data-testid="cta-make-mistake-btn"
              >
                <Zap className="w-5 h-5 mr-2 text-emerald-500" />
                I already have an account
              </Button>
            </div>
          </div>

          {/* Marquee */}
          <div className="mt-20 border-y-2 border-[#333] py-4 overflow-hidden">
            <div className="flex animate-marquee whitespace-nowrap">
              {[...Array(10)].map((_, i) => (
                <span key={i} className="mx-8 text-[#39FF14]/50 font-mono uppercase">
                  🚩 RED FLAGS WELCOME • 💀 CHAOTIC ENERGY • ⚡ UNFILTERED MATCHES • 
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-5xl font-bold uppercase mb-4 border-b-4 border-[#39FF14] inline-block pb-2">
            HOW IT WORKS
          </h2>
          <p className="text-[#E0E0E0]/60 font-mono mb-12">(Spoiler: It&apos;s a beautiful disaster)</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-white/20">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 border-white/20 border-b-2 md:border-r-2 last:border-r-0 hover:bg-[#111] transition-colors group"
                data-testid={`feature-card-${index}`}
              >
                <div className="text-[#39FF14] mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold uppercase mb-2 text-[#E0E0E0]">
                  {feature.title}
                </h3>
                <p className="text-[#E0E0E0]/60 font-mono text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Red Flags Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-5xl font-bold uppercase mb-12 text-center">
            <span className="bg-[#FF3B30] text-white px-4">POPULAR RED FLAGS</span>
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              "I reply 3 days later",
              "My ex is my best friend",
              "Mattress on floor",
              "Never watched The Office",
              "I double text... a lot",
              "47 unread books",
              "Thinks astrology is real",
              "Reply guy on Twitter"
            ].map((flag, i) => (
              <div
                key={i}
                className="red-flag-badge hover:bg-red-800/30 transition-colors cursor-default"
                style={{ transform: `rotate(${(i % 3 - 1) * 2}deg)` }}
              >
                🚩 {flag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Ready for people who like you at your worst?
          </h2>
          <p className="text-slate-600 font-mono mb-8 text-lg">
            Join other gloriously flawed humans finding matches who can handle the chaos and enjoy the glow-up.
          </p>
          <Button
            className="btn-soft bg-emerald-500 text-white px-10 py-4 text-base"
            onClick={() => navigate("/register")}
            data-testid="bottom-cta-btn"
          >
            Claim your chaotic era
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t-2 border-[#333]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#39FF14]" />
            <span className="font-bold text-[#39FF14]">UNHINGED</span>
          </div>
          <p className="text-[#E0E0E0]/40 font-mono text-sm">
            © 2024 Unhinged. All chaos reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
