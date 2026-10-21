import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { staggerContainer, fadeUpItem } from "../utils/motionVariants";

const faqs = [
  {
    q: "How long does a typical installation take?",
    a: "Most residential systems (CCTV, alarms, access control) are completed within 1–3 days. Larger commercial or multi-building sites are scoped individually after a site survey.",
  },
  {
    q: "Do you offer support after installation?",
    a: "Yes — every installation includes a workmanship guarantee, and we offer ongoing maintenance and managed IT support plans for clients who want us on call.",
  },
  {
    q: "Can you combine security and IT systems into one project?",
    a: "Yes, that's our core setup — one team handles networking, cabling and IT infrastructure alongside CCTV, access control and alarm systems, so nothing falls between two contractors.",
  },
  {
    q: "Do you work outside Dar es Salaam?",
    a: "Yes, we install and support clients across Tanzania's regions. Travel and logistics are scoped as part of your quote.",
  },
  {
    q: "How do I get a quote?",
    a: "Fill in the form below with your property type and requirements, or message us directly on WhatsApp — we'll follow up to schedule a site survey.",
  },
];

const FAQItem = ({ item, isOpen, onToggle }) => (
  <motion.div variants={fadeUpItem} className="border-b border-line py-5">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 text-left"
    >
      <span className="font-display font-semibold text-ink text-base">
        {item.q}
      </span>
      <motion.span
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0"
      >
        {isOpen ? (
          <Minus className="h-4 w-4 text-signal" />
        ) : (
          <Plus className="h-4 w-4 text-signal" />
        )}
      </motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <p className="text-sm text-slateSoft leading-relaxed mt-3 max-w-2xl">
            {item.a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-[#e4e9f1] py-24 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-xl mb-12">
          <span className="text-xs font-semibold tracking-wider uppercase text-brass">
            Good to know
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mt-2 leading-tight">
            Frequently asked questions
          </h2>
        </div>

        <motion.div
          className="max-w-3xl"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {faqs.map((item, index) => (
            <FAQItem
              key={item.q}
              item={item}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
