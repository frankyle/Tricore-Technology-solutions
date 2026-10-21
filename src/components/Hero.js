import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";
import heroImg from "../assets/hero-security.jpg";

const chips = [
  { label: "🏠 Home security", href: "#services" },
  { label: "🏢 Business & IT", href: "#services" },
  { label: "⚙️ Smart automation", href: "#solutions" },
  { label: "💬 I need a quote", href: "#contact" },
];

const scrollTo = (id) => {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-ink py-24 md:py-32 min-h-[640px] flex items-center">
      {/* Background photo — a monitoring/control room, visible mainly on the right */}
      <div className="absolute inset-0">
        <motion.img
          src={heroImg}
          alt="Security operations control room with live CCTV monitoring screens"
          className="w-full h-full object-cover"
          style={{ objectPosition: "70% center" }}
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: "easeOut" }}
        />
        {/* Dark gradient: solid over the text on the left, fading out to reveal the photo on the right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #0b1524 0%, #0b1524 32%, rgba(11,21,36,0.88) 48%, rgba(11,21,36,0.45) 68%, rgba(11,21,36,0.15) 85%, rgba(11,21,36,0.05) 100%)",
          }}
        />
        {/* Soft bottom fade so the photo blends into the next section */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-ink" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brassLight/35 bg-brassLight/[0.06] mb-6">
            <Shield className="h-4 w-4 text-brassLight" />
            <span className="text-sm font-medium text-brassLight">
              Installation · IT infrastructure · 24/7 support
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-white">
            One partner for your{" "}
            <span className="text-signal/90" style={{ color: "#7fa4ff" }}>
              systems
            </span>{" "}
            and your{" "}
            <span style={{ color: "#7fa4ff" }}>site security</span>.
          </h1>

          <p className="mt-6 text-lg text-white/70 leading-relaxed">
            Tricore Technology Solutions designs, installs and maintains the
            technology and physical security infrastructure businesses run
            on — from CCTV and access control to networks, cloud and managed
            IT support, across Tanzania.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => scrollTo("#contact")}
              className="bg-signal hover:bg-signalDark text-white px-7 py-3.5 rounded-md font-semibold shadow-md transition"
            >
              Talk to Us
            </button>
            <button
              onClick={() => scrollTo("#services")}
              className="border border-white/25 text-white px-7 py-3.5 rounded-md font-semibold hover:bg-white/10 transition"
            >
              Explore Our Services
            </button>
          </div>

          <div className="mt-9 pt-7 border-t border-white/10">
            <span className="text-sm text-white/55">
              Not sure where to start? Tell us what you need —
            </span>
            <motion.div
              className="flex flex-wrap gap-2.5 mt-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              transition={{ delayChildren: 0.5 }}
            >
              {chips.map((chip) => (
                <motion.button
                  key={chip.label}
                  variants={fadeUpItem}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => scrollTo(chip.href)}
                  className="bg-white/[0.06] border border-white/15 text-white px-4 py-2 rounded-full text-sm hover:bg-signal/25 hover:border-signal transition"
                >
                  {chip.label}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
