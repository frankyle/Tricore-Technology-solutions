import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, UserCircle } from "lucide-react";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";

// TODO: confirm this is the exact WhatsApp/phone number (digits only, no +)
const WHATSAPP_NUMBER = "255787555779";

const propertyTypes = [
  "Residential",
  "Commercial / Business",
  "Construction site",
  "Hospital / Healthcare",
  "Agricultural",
  "NGO / Institution",
  "Other",
];

const Contact = () => {
  const [form, setForm] = useState({
    fullName: "",
    company: "",
    phone: "",
    email: "",
    location: "",
    propertyType: propertyTypes[0],
    message: "",
  });

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    let text = `New enquiry from the website:\n`;
    text += `Name: ${form.fullName}\n`;
    if (form.company) text += `Company: ${form.company}\n`;
    text += `Phone: ${form.phone}\n`;
    if (form.email) text += `Email: ${form.email}\n`;
    text += `Location: ${form.location}\n`;
    text += `Property type: ${form.propertyType}\n`;
    if (form.message) text += `Message: ${form.message}\n`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <section id="contact" className="bg-paper py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-semibold tracking-wider uppercase text-brass">
            Get in touch
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mt-2 leading-tight">
            Tell us about your site
          </h2>
          <p className="text-slateSoft mt-4 leading-relaxed">
            Fill in the form and it opens directly in WhatsApp so we can
            respond fast — no waiting on email.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-card border border-line rounded-2xl p-7 md:p-8"
          >
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Field label="Full name">
                <input
                  required
                  value={form.fullName}
                  onChange={update("fullName")}
                  placeholder="Jane Mushi"
                  className="input"
                />
              </Field>
              <Field label="Company (optional)">
                <input
                  value={form.company}
                  onChange={update("company")}
                  placeholder="Company name"
                  className="input"
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Field label="Phone number">
                <input
                  required
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+255 7XX XXX XXX"
                  className="input"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@email.com"
                  className="input"
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Field label="Location / region">
                <input
                  required
                  value={form.location}
                  onChange={update("location")}
                  placeholder="e.g. Dar es Salaam"
                  className="input"
                />
              </Field>
              <Field label="Property type">
                <select
                  value={form.propertyType}
                  onChange={update("propertyType")}
                  className="input"
                >
                  {propertyTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Message">
              <textarea
                rows={4}
                value={form.message}
                onChange={update("message")}
                placeholder="Tell us what you need..."
                className="input resize-none"
              />
            </Field>

            <button
              type="submit"
              className="mt-2 w-full bg-[#25D366] hover:brightness-95 text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2.5 transition"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Send via WhatsApp
            </button>
          </form>

          {/* Contact info */}
          <motion.div
            className="flex flex-col gap-5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={fadeUpItem}>
              <InfoCard
                icon={MapPin}
                title="Office address"
                text="Makumbusho, Dar es Salaam, Tanzania"
              />
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <InfoCard
                icon={Phone}
                title="Phone & WhatsApp"
                text="+255 787 555 779 — call or message directly"
              />
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <InfoCard
                icon={Mail}
                title="Email"
                text="info@tricoretechsolutions.co.tz"
              />
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <InfoCard
                icon={UserCircle}
                title="Administrator"
                text="Frank Magai — main point of contact"
              />
            </motion.div>
            <motion.div
              variants={fadeUpItem}
              className="rounded-2xl overflow-hidden border border-line h-56"
            >
              <iframe
                title="Tricore office location"
                src="https://www.google.com/maps?q=Makumbusho,+Dar+es+Salaam,+Tanzania&output=embed"
                loading="lazy"
                className="w-full h-full border-0"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .input {
          border: 1px solid #d7dde6;
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 0.92rem;
          font-family: 'Inter', sans-serif;
          background: #fff;
          color: #2b3646;
          outline: none;
          width: 100%;
        }
        .input:focus { border-color: #2f6fed; }
      `}</style>
    </section>
  );
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[0.82rem] font-semibold text-ink">{label}</label>
    {children}
  </div>
);

const InfoCard = ({ icon: Icon, title, text }) => (
  <div className="bg-card border border-line rounded-2xl p-5 flex gap-3.5 items-start">
    <div className="w-[38px] h-[38px] flex-shrink-0 rounded-[9px] bg-white border border-line flex items-center justify-center">
      <Icon className="h-[18px] w-[18px] text-forest" strokeWidth={1.6} />
    </div>
    <div>
      <h5 className="text-[0.92rem] font-semibold text-ink mb-0.5">
        {title}
      </h5>
      <p className="text-[0.88rem] text-slateSoft leading-snug">{text}</p>
    </div>
  </div>
);

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.4-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Z" />
  </svg>
);

export default Contact;
