import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Solutions from "./components/Solutions";
import Industries from "./components/Industries";
import About from "./components/About";
import Portfolio from "./components/Portfolio";
import FAQ from "./components/FAQ";
import Careers from "./components/Careers";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

const fadeInSection = (delay = 0) => ({
  initial: { y: 40, opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  transition: { duration: 0.7, delay },
  viewport: { once: true },
});

const Home = () => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="min-h-screen bg-paper text-slate"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <Header />

        <div className="pt-20 md:pt-24">
          <section id="home">
            <Hero />
          </section>

          <motion.section id="services" {...fadeInSection()}>
            <Services />
          </motion.section>

          <motion.section id="solutions" {...fadeInSection(0.1)}>
            <Solutions />
          </motion.section>

          <motion.section id="industries" {...fadeInSection(0.1)}>
            <Industries />
          </motion.section>

          <motion.section id="about" {...fadeInSection(0.1)}>
            <About />
          </motion.section>

          <motion.section id="portfolio" {...fadeInSection(0.1)}>
            <Portfolio />
          </motion.section>

          <motion.section id="faq" {...fadeInSection(0.1)}>
            <FAQ />
          </motion.section>

          <motion.section id="careers" {...fadeInSection(0.1)}>
            <Careers />
          </motion.section>

          <motion.section id="contact" {...fadeInSection(0.1)}>
            <Contact />
          </motion.section>
        </div>

        <Footer />
        <WhatsAppButton />
      </motion.div>
    </AnimatePresence>
  );
};

export default Home;
