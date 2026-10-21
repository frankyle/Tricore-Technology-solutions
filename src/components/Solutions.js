import React from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";

const packages = [
  {
    tag: "Residential",
    title: "Smart Homes",
    description:
      "CCTV, access control, alarms and networking combined into one system you can monitor and control from your phone.",
  },
  {
    tag: "Commercial",
    title: "Smart Operations",
    description:
      "Security, connectivity and IT support integrated so your team, your site and your data stay covered under one plan.",
  },
  {
    tag: "Enterprise & Industrial",
    title: "Smart Systems",
    description:
      "Large-scale surveillance, perimeter protection, cloud infrastructure and cabling designed for multi-site operations.",
  },
];

const Solutions = () => {
  return (
    <section id="solutions" className="bg-ink py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-semibold tracking-wider uppercase text-brassLight">
            Integrated packages
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mt-2 leading-tight">
            Solutions tailored to how you'll actually use them
          </h2>
          <p className="text-white/60 mt-4 leading-relaxed">
            We package our services around the outcome you need, not just
            the hardware — combining systems from both domains above into
            one integrated setup.
          </p>
        </div>

        <motion.div
          className="grid md:grid-cols-3 gap-5"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {packages.map((pkg) => (
            <motion.div
              key={pkg.title}
              variants={fadeUpItem}
              whileHover={{ y: -4 }}
              className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 transition-colors hover:border-signal/60"
            >
              <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-brassLight">
                {pkg.tag}
              </span>
              <h4 className="text-white font-display text-xl mt-2.5 mb-3">
                {pkg.title}
              </h4>
              <p className="text-white/60 text-sm leading-relaxed">
                {pkg.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Solutions;
