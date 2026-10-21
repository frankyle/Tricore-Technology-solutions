import React from "react";
import { motion } from "framer-motion";
import { LayoutGrid, ShieldCheck, Sparkles, HeartHandshake } from "lucide-react";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";

const advantages = [
  {
    icon: LayoutGrid,
    title: "Infrastructure to security, end to end",
    description:
      "One team handles networking, cabling and IT alongside the physical security build — no gaps between contractors.",
  },
  {
    icon: ShieldCheck,
    title: "Experienced engineers on every site",
    description:
      "Every installation is led by technicians with 5+ years in the industry, not first-time crews.",
  },
  {
    icon: Sparkles,
    title: "Clean, professional workmanship",
    description:
      "Tidy cabling, tested systems and clear handover documentation on every project we deliver.",
  },
  {
    icon: HeartHandshake,
    title: "Service you can rely on",
    description:
      "Workmanship guarantees and responsive after-installation support back every system we put in.",
  },
];

const About = () => {
  return (
    <section id="about" className="bg-[#e4e9f1] py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-xl mb-16">
          <span className="text-xs font-semibold tracking-wider uppercase text-brass">
            About Tricore
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mt-2 leading-tight">
            Built by engineers who've been in the field for years
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-14 items-start">
          {/* Story + Mission/Vision */}
          <div>
            <p className="text-slateSoft leading-[1.75] mb-4">
              Tricore Technology Solutions was founded{" "}
              <strong className="text-ink">two years ago</strong> — but the
              company was built around a team of technical engineers and
              suppliers, based across Tanzania, who have each spent{" "}
              <strong className="text-ink">no less than five years</strong>{" "}
              in the security and automation industry before coming together
              under one roof.
            </p>
            <p className="text-slateSoft leading-[1.75] mb-8">
              That combination — a young, focused company backed by
              experienced hands — is what shapes how we work: fast to set up,
              but never inexperienced on site.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card border border-line border-l-[3px] border-l-signal rounded-lg p-5">
                <h4 className="font-display text-base font-semibold text-ink mb-2">
                  Our Mission
                </h4>
                <p className="text-sm text-slateSoft leading-relaxed">
                  To make reliable security and technology infrastructure
                  accessible to every home, business and institution in
                  Tanzania — installed right the first time.
                </p>
              </div>
              <div className="bg-card border border-line border-l-[3px] border-l-signal rounded-lg p-5">
                <h4 className="font-display text-base font-semibold text-ink mb-2">
                  Our Vision
                </h4>
                <p className="text-sm text-slateSoft leading-relaxed">
                  To be Tanzania's most trusted single partner for security
                  systems and IT infrastructure, known for engineering
                  quality and dependable support.
                </p>
              </div>
            </div>
          </div>

          {/* Advantages */}
          <div>
            <h3 className="font-display text-lg font-semibold text-ink mb-5">
              Why choose Tricore
            </h3>
            <motion.div
              className="flex flex-col"
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {advantages.map((adv, i) => {
                const Icon = adv.icon;
                return (
                  <motion.div
                    key={adv.title}
                    variants={fadeUpItem}
                    className={`flex gap-4 items-start py-5 ${
                      i !== advantages.length - 1 ? "border-b border-line" : ""
                    }`}
                  >
                    <div className="w-[38px] h-[38px] flex-shrink-0 rounded-[9px] bg-card border border-line flex items-center justify-center">
                      <Icon className="h-[18px] w-[18px] text-forest" strokeWidth={1.6} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-ink text-[0.98rem] mb-1">
                        {adv.title}
                      </h5>
                      <p className="text-[0.87rem] text-slateSoft leading-relaxed">
                        {adv.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
