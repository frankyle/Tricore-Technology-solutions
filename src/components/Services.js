import React from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";
import {
  MessageSquare,
  ShieldCheck,
  Cloud,
  Server,
  Headset,
  GraduationCap,
  // Camera,
  // Fingerprint,
  // BellRing,
  // Zap,
  // DoorOpen,
  // Flame,
} from "lucide-react";

const domains = [
  {
    label: "Domain 01",
    title: "IT & Technology Solutions",
    services: [
      {
        icon: MessageSquare,
        title: "IT Consulting",
        color: "#3b82f6",
        description:
          "Guidance on the right systems and infrastructure to streamline and secure your operations.",
      },
      {
        icon: ShieldCheck,
        title: "Cybersecurity",
        color: "#ef4444",
        description:
          "Protection against evolving digital threats, built around how your business actually works.",
      },
      {
        icon: Cloud,
        title: "Cloud Solutions",
        color: "#0ea5e9",
        description:
          "Cloud services that improve efficiency, security and scalability as your business grows.",
      },
      {
        icon: Server,
        title: "Networking & Structured Cabling",
        color: "#8b5cf6",
        description:
          "Secure, high-performance networks and cabling tailored to your site and requirements.",
      },
      {
        icon: Headset,
        title: "Managed IT Support",
        color: "#14b8a6",
        description:
          "Round-the-clock IT support and maintenance to keep operations running smoothly.",
      },
      {
        icon: GraduationCap,
        title: "Technical Training & Consultation",
        color: "#f59e0b",
        description:
          "Hands-on training so your team and technicians get the most from their systems.",
      },
    ],
  },
  // {
  //   label: "Domain 02",
  //   title: "Security Systems & Installation",
  //   services: [
  //     {
  //       icon: Camera,
  //       title: "CCTV & Video Surveillance",
  //       color: "#6366f1",
  //       description:
  //         "High-definition camera systems, professionally installed for real-time monitoring and playback.",
  //     },
  //     {
  //       icon: Fingerprint,
  //       title: "Access Control & Biometrics",
  //       color: "#10b981",
  //       description:
  //         "Fingerprint and card-based access systems that manage who enters a site, and when.",
  //     },
  //     {
  //       icon: BellRing,
  //       title: "Intruder & Alarm Systems",
  //       color: "#f43f5e",
  //       description:
  //         "Motion sensors and alarm systems that detect intrusions and trigger instant alerts.",
  //     },
  //     {
  //       icon: Zap,
  //       title: "Electric Fencing & Perimeter",
  //       color: "#f97316",
  //       description:
  //         "Perimeter fencing designed to deter unauthorised access around a property or site.",
  //     },
  //     {
  //       icon: DoorOpen,
  //       title: "Automated Gates",
  //       color: "#06b6d4",
  //       description:
  //         "Motorised gate automation for secure, convenient entry management.",
  //     },
  //     {
  //       icon: Flame,
  //       title: "Fire & Panic Alarm Systems",
  //       color: "#dc2626",
  //       description:
  //         "Smoke detection, siren networks and panic-button systems for fast emergency response.",
  //     },
  //   ],
  // },
];

const Services = () => {
  return (
    <section id="services" className="bg-paper py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink max-w-md leading-tight">
            What we build, install and protect
          </h2>
          <p className="text-slateSoft max-w-sm leading-relaxed">
            Two disciplines, one accountable team — so your systems and your
            security are never someone else's problem to solve.
          </p>
        </div>

        {domains.map((domain, dIndex) => (
          <div key={domain.title} className={dIndex > 0 ? "mt-16" : ""}>
            {/* Domain header */}
            <div className="flex items-baseline justify-between gap-4 flex-wrap pb-3.5 border-b-2 border-ink mb-7">
              <h3 className="font-display text-xl md:text-2xl font-semibold text-ink">
                {domain.title}
              </h3>
              <span className="text-sm text-slateSoft">
                {domain.services.length} services
              </span>
            </div>

            {/* Services grid */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
            >
              {domain.services.map((service) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    variants={fadeUpItem}
                    whileHover={{ y: -4 }}
                    className="bg-card border border-line rounded-2xl p-6 transition-colors duration-300 hover:border-signal hover:shadow-[0_16px_32px_-20px_rgba(11,21,36,0.35)]"
                  >
                    <div
                      className="w-11 h-11 rounded-[10px] mb-4 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${service.color}, ${service.color}cc)`,
                        boxShadow: `0 8px 16px -8px ${service.color}80`,
                      }}
                    >
                      <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                    </div>
                    <h4 className="font-display text-base font-semibold text-ink mb-2">
                      {service.title}
                    </h4>
                    <p className="text-sm text-slateSoft leading-relaxed">
                      {service.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
