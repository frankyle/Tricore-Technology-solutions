import React from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";

import cctvImg from "../assets/services/cctv-surveillance1.jpg";
import gateImg from "../assets/services/motor-gate1.jpg";
import gpsImg from "../assets/services/gps-tracking.jpg";
import accessImg from "../assets/services/biometric-access.jpg";
import fenceImg from "../assets/services/electric-fence1.jpg";
import fireImg from "../assets/services/fire-alarm.jpg";

const projects = [
  { tag: "CCTV", title: "Surveillance Installation", image: cctvImg },
  { tag: "Access", title: "Automated Motor Gate", image: gateImg },
  { tag: "Tracking", title: "GPS/GPRS Fleet Tracking", image: gpsImg },
  { tag: "Access Control", title: "Biometric Access System", image: accessImg },
  { tag: "Perimeter", title: "Electric Fence Installation", image: fenceImg },
  { tag: "Fire & Safety", title: "Fire Alarm System", image: fireImg },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="bg-paper py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-semibold tracking-wider uppercase text-brass">
            Our work
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mt-2 leading-tight">
            Recent projects
          </h2>
          <p className="text-slateSoft mt-4 leading-relaxed">
            A look at installations across our core service lines.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {projects.map((p) => (
            <motion.div
              key={p.title}
              variants={fadeUpItem}
              className="relative rounded-2xl overflow-hidden h-56 bg-ink group"
            >
              <img
                src={p.image}
                alt={p.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
              <div className="absolute left-4 bottom-4 text-white">
                <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-brassLight">
                  {p.tag}
                </span>
                <h4 className="font-display text-base mt-1">{p.title}</h4>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Portfolio;
