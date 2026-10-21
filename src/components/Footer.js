import { Shield, Facebook, Instagram, Linkedin } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#solutions" },
  { label: "Projects", href: "#portfolio" },
  { label: "Careers", href: "#careers" },
  { label: "Contact", href: "#contact" },
];

const serviceLinks = [
  "IT Consulting & Cybersecurity",
  "Cloud & Networking",
  "CCTV & Surveillance",
  "Access Control",
  "Electric Fencing & Gates",
  "Fire & Alarm Systems",
];

const Footer = () => {
  const handleScroll = (id) => {
    const element = document.querySelector(id);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="bg-ink text-white/70 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div
              className="flex items-center gap-2 mb-4 cursor-pointer"
              onClick={() => handleScroll("#home")}
            >
              <div className="bg-gradient-to-br from-signal to-forestDark p-2 rounded-full shadow-md">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-display font-semibold text-white">
                Tricore Technology Solutions
              </span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed max-w-[30ch] mb-4">
              Installation, maintenance and support for security systems and
              IT infrastructure across Tanzania.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com/tricoretechnologysolutions" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:scale-110 transition-transform"><Facebook className="h-5 w-5 text-[#1877F2]" /></a>
              <a href="https://x.com/tricoretechsol" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="hover:scale-110 transition-transform"><FaXTwitter className="h-5 w-5 text-black bg-white rounded-full p-[2px]" /></a>
              <a href="https://instagram.com/tricoretechnologysolutions" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:scale-110 transition-transform"><Instagram className="h-5 w-5 text-[#E4405F]" /></a>
              <a href="https://linkedin.com/company/tricoretechnologysolutions" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:scale-110 transition-transform"><Linkedin className="h-5 w-5 text-[#0077B5]" /></a>
              <a href="https://tiktok.com/@tricoretechnologysolutions" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:scale-110 transition-transform"><SiTiktok className="h-5 w-5 text-[#69C9D0]" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2.5 text-white/60 text-sm">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button onClick={() => handleScroll(link.href)} className="hover:text-white transition-colors">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-4 text-white">Services</h3>
            <ul className="space-y-2.5 text-white/60 text-sm">
              {serviceLinks.map((label) => (
                <li key={label}>
                  <button onClick={() => handleScroll("#services")} className="hover:text-white transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-4 text-white">Contact</h3>
            <ul className="space-y-2.5 text-white/60 text-sm">
              <li>Makumbusho, Dar es Salaam</li>
              <li>+255 787 555 779</li>
              <li>info@tricoretechsolutions.co.tz</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/40">
          <span>&copy; {new Date().getFullYear()} Tricore Technology Solutions. All rights reserved.</span>
          <span>Administrator: Frank Magai</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
