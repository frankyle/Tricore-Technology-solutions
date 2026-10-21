import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield,
  ArrowUpRight,
  Home,
  BriefcaseBusiness,
  Grid2X2,
  Users,
  Info,
  UserRound,
  LogIn,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { name: "Home", href: "#home", icon: Home },
  { name: "Services", href: "#services", icon: BriefcaseBusiness },
  { name: "Solutions", href: "#solutions", icon: Grid2X2 },
  { name: "About", href: "#about", icon: Info },
  { name: "Projects", href: "#portfolio", icon: BriefcaseBusiness },
  { name: "Careers", href: "#careers", icon: BriefcaseBusiness },
  { name: "Technicians", href: "/technicians", icon: BriefcaseBusiness },
  { name: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { name: "Contact", href: "#contact", icon: Mail },
];

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (id) => {
    if (id.startsWith("/")) return navigate(id);
    const el = document.querySelector(id);

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <>
      {/* =========================
          MAIN HEADER
      ========================== */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-ink/95 backdrop-blur-xl shadow-2xl"
            : "bg-ink/75 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-4 md:px-10">
          <div className="flex justify-between items-center h-[72px] md:h-16">
            
            {/* =========================
                LOGO / COMPANY NAME
            ========================== */}
            <motion.button
              onClick={() => handleScrollTo("#home")}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 text-left group"
            >
              {/* Shield Logo */}
              <motion.div
                whileHover={{ rotate: 12, scale: 1.08 }}
                className="relative flex-shrink-0"
              >
                <div className="absolute inset-0 bg-signal blur-lg opacity-40 rounded-full" />

                <div className="relative w-11 h-11 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-signal to-signalDark flex items-center justify-center shadow-lg border border-white/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </motion.div>

              {/* Brand Name */}
              <div className="leading-none">
                <div className="flex items-center gap-2">
                  <span className="text-white font-extrabold text-[17px] sm:text-lg md:text-xl tracking-[0.08em]">
                    TRICORE
                  </span>

                  <span className="hidden sm:block w-6 h-[2px] bg-signal rounded-full" />
                </div>

                <span className="block mt-1 text-[8px] sm:text-[9px] md:text-xs text-white/55 font-semibold tracking-[0.18em] uppercase">
                  Technology Solutions
                </span>
              </div>
            </motion.button>

            {/* =========================
                ACCOUNT BUTTONS + QUOTE
            ========================== */}
            <div className="flex items-center gap-2 md:gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 bg-signal hover:bg-signalDark text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-black/20"
                >
                  <UserRound className="w-4 h-4" /> Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-white/30 hover:bg-white/10 transition"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    className="text-white text-sm font-bold px-3.5 py-2.5 rounded-xl bg-signal hover:bg-signalDark shadow-lg shadow-black/20 transition"
                  >
                    <span className="sm:hidden">Join</span>
                    <span className="hidden sm:inline">Sign up</span>
                  </Link>
                </>
              )}

              <motion.button
                onClick={() => handleScrollTo("#contact")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="hidden md:flex group relative overflow-hidden items-center gap-2 border border-brass/60 text-brassLight hover:bg-brass/10 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
              >
                Get a Quote
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* =========================
            DESKTOP NAVIGATION
        ========================== */}
        <div
          className={`hidden md:flex justify-center items-center gap-8 py-3 transition-all duration-500 ${
            scrolled
              ? "bg-forestDark/70 backdrop-blur-xl border-t border-white/10"
              : "bg-transparent"
          }`}
        >
          {navLinks.map((link) => (
            <motion.button
              key={link.name}
              onClick={() => handleScrollTo(link.href)}
              whileHover={{ y: -2 }}
              className="
                relative text-white/70 hover:text-white
                font-medium transition-colors duration-200
                after:absolute after:left-0 after:-bottom-1
                after:w-0 after:h-[2px]
                after:bg-signal
                after:transition-all after:duration-300
                hover:after:w-full
              "
            >
              {link.name}
            </motion.button>
          ))}
        </div>
      </header>

      {/* =========================
          MOBILE BOTTOM NAVIGATION
      ========================== */}
      <motion.nav
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="
          fixed bottom-3 left-3 right-3 z-50 md:hidden
          bg-ink/90 backdrop-blur-2xl
          border border-white/10
          rounded-3xl
          shadow-2xl
        "
      >
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { name: "Home", href: "#home", icon: Home },
            { name: "Services", href: "#services", icon: Grid2X2 },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <motion.button
                key={link.name}
                onClick={() => handleScrollTo(link.href)}
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center justify-center gap-1 min-w-[58px] py-1.5 rounded-2xl text-white/60 hover:text-white transition-all duration-300"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-xl">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[10px] font-medium">{link.name}</span>
              </motion.button>
            );
          })}

          {/* Contact highlight */}
          <motion.button
            onClick={() => handleScrollTo("#contact")}
            whileTap={{ scale: 0.88 }}
            className="flex flex-col items-center justify-center gap-1 min-w-[58px] py-1.5 rounded-2xl text-signal"
          >
            <div className="w-9 h-9 -mt-5 rounded-2xl bg-signal text-white flex items-center justify-center shadow-lg border-4 border-ink">
              <Mail className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold">Quote</span>
          </motion.button>

          <motion.button
            onClick={() => navigate("/technicians")}
            whileTap={{ scale: 0.85 }}
            className="flex flex-col items-center justify-center gap-1 min-w-[58px] py-1.5 rounded-2xl text-white/60 hover:text-white transition-all duration-300"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-xl">
              <Users className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[10px] font-medium">Technicians</span>
          </motion.button>

          <motion.button
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            whileTap={{ scale: 0.85 }}
            className="flex flex-col items-center justify-center gap-1 min-w-[58px] py-1.5 rounded-2xl text-white/60 hover:text-white transition-all duration-300"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-xl">
              {user ? <UserRound className="w-[18px] h-[18px]" /> : <LogIn className="w-[18px] h-[18px]" />}
            </div>
            <span className="text-[10px] font-medium">{user ? "Account" : "Sign in"}</span>
          </motion.button>
        </div>
      </motion.nav>
    </>
  );
};

export default Header;