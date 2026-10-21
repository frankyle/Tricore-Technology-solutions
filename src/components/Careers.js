import React from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";

const scrollToContact = () => {
  const el = document.querySelector("#contact");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const paths = [
  {
    title: "Internships",
    description:
      "Structured, hands-on placements for students in electrical, IT and security engineering.",
    cta: "Apply now",
  },
  {
    title: "Technical Training",
    description:
      "Practical training in CCTV, access control, networking and system installation.",
    cta: "Request training",
  },
  {
    title: "Field Service Roles",
    description:
      "Opportunities for technicians ready to work on live installation and maintenance sites.",
    cta: "Apply now",
  },
  {
    title: "Job Applications",
    description:
      "Open applications for engineering, sales and support roles across our team.",
    cta: "Send application",
  },
];

const Careers = () => {
  return (
    <section
      id="careers"
      className="bg-gradient-to-b from-forestDark to-ink py-24 md:py-28"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-semibold tracking-wider uppercase text-brassLight">
            Grow with us
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-white mt-2 leading-tight">
            Building careers in security &amp; automation
          </h2>
          <p className="text-white/60 mt-4 leading-relaxed">
            Alongside client projects, we train students and technicians
            through real, hands-on scenarios. If you're looking to start or
            grow a career in this field, we'd like to hear from you.
          </p>
        </div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {paths.map((path) => (
            <motion.div
              key={path.title}
              variants={fadeUpItem}
              whileHover={{ y: -4 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 transition-colors hover:border-white/25"
            >
              <h4 className="text-white font-display text-base mb-2">
                {path.title}
              </h4>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                {path.description}
              </p>
              <button
                onClick={scrollToContact}
                className="text-sm font-semibold text-[#7fa4ff] hover:underline"
              >
                {path.cta} →
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Careers;
