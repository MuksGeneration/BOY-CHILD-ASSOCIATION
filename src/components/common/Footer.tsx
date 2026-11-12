import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, PhoneCall, Heart, MapPin, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1B365D] text-slate-300 pt-16 pb-12 border-t border-[#005A9C]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Brand & Core Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Screenshot_20260801_081145_WhatsApp__1__8a50926e.jpg"
                alt="Boy Child Association Official Logo"
                className="w-12 h-12 object-contain rounded-full shadow-sm bg-white shrink-0"
              />
              <div>
                <span className="font-heading text-lg font-bold tracking-tight text-white block leading-none">
                  BOY CHILD ASSOCIATION
                </span>
                <span className="text-[11px] font-bold text-[#60C1E5] tracking-wider uppercase">
                  Standing Up As A Man
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Supporting, uniting, guiding and empowering the boy child across Uganda through community circles, vetted mentorship and practical life skills.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#60C1E5]">
              <ShieldCheck className="w-4 h-4 text-[#60C1E5] shrink-0" />
              <span>Registered Non-Profit Organisation · Uganda</span>
            </div>
          </div>

          {/* Column 2: Four Pillars & Programmes */}
          <div>
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-white mb-4">
              Our 4 Pillars
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="font-semibold text-white">Support:</span> Trauma-informed wellbeing and safe expression.
              </li>
              <li>
                <span className="font-semibold text-white">Unite:</span> Community circles where boys hold each other up.
              </li>
              <li>
                <span className="font-semibold text-white">Guide:</span> Elder mentors providing principled direction.
              </li>
              <li>
                <span className="font-semibold text-white">Empower:</span> Hands-on skills in solar, STEM and leadership.
              </li>
            </ul>
          </div>

          {/* Column 3: Safeguarding & Compliance */}
          <div>
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-white mb-4">
              Safeguarding &amp; Law
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/safeguarding" className="hover:text-white transition-colors">
                  Child Safeguarding Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy (Uganda DPPA 2019)
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service &amp; Consent
                </Link>
              </li>
              <li>
                <Link to="/programmes" className="hover:text-white transition-colors">
                  Programmes Catalogue
                </Link>
              </li>
              <li>
                <Link to="/join" className="hover:text-white transition-colors">
                  Join as Volunteer or Mentor
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Uganda Helplines */}
          <div className="space-y-3">
            <h3 className="font-heading text-sm font-bold tracking-wider uppercase text-white mb-4">
              Community &amp; Helplines
            </h3>
            
            {/* WhatsApp Community Box */}
            <a
              href="https://wa.me/256732320190?text=Hello%20Boy%20Child%20Association%2C%20I%20am%20reaching%20out%20to%20join%20the%20boys%20group"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-emerald-950/60 hover:bg-emerald-900/80 rounded-xl border border-emerald-500/30 space-y-1 text-xs transition-colors"
            >
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span>WhatsApp Group &amp; Line</span>
                <span className="font-mono text-white text-xs">0732320190</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-snug">
                Connect with our boys social brotherhood group for guidance and session updates.
              </p>
            </a>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-white">
                <PhoneCall className="w-4 h-4 text-[#60C1E5]" />
                <span className="font-semibold">Sauti Child Helpline: 116</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Free 24/7 toll-free emergency call from any network in Uganda.
              </p>
            </div>

            <div className="pt-2 text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#60C1E5] shrink-0" />
                <span>Kampala Headquarters, Uganda</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#60C1E5] shrink-0" />
                <span>safeguarding@boychild.org</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright and Safeguarding Statement */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Boy Child Association Uganda. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Built with respect &amp; care for every boy in Uganda</span>
            <Heart className="w-3.5 h-3.5 text-[#60C1E5]" />
          </div>
        </div>
      </div>
    </footer>
  );
};
