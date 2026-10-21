import React from "react";
import { motion } from "framer-motion";
import { Home, Building2, HardHat, Cross, Sprout, Users } from "lucide-react";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";

const industries = [
  { icon: Home, label: "Residential" },
  { icon: Building2, label: "Commercial & Business" },
  { icon: HardHat, label: "Construction" },
  { icon: Cross, label: "Hospitals & Healthcare" },
  { icon: Sprout, label: "Agriculture" },
  { icon: Users, label: "NGOs & Institutions" },
];

const Industries = () => {
  return (
    <section id="industries" className="bg-paper py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-semibold tracking-wider uppercase text-brass">
            Who we work with
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mt-2 leading-tight">
            Industries we serve
          </h2>
          <p className="text-slateSoft mt-4 leading-relaxed">
            From single homes to multi-site institutions, our systems are
            built around each sector's specific risks and operating needs.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {industries.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                variants={fadeUpItem}
                className="bg-card border border-line rounded-xl px-4 py-6 text-center transition-all hover:-translate-y-1 hover:border-signal"
              >
                <Icon className="h-6 w-6 text-forest mx-auto mb-3" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-ink">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        <p className="mt-7 text-sm text-slateSoft">
          Based in Dar es Salaam and installing{" "}
          <strong className="text-ink">
            nationwide across Tanzania's regions
          </strong>{" "}
          — from single properties to multi-branch organisations.
        </p>
      </div>
    </section>
  );
};

export default Industries;
