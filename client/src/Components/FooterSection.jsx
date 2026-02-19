import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, Phone, MapPin, Globe } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa";

const FooterSection = () => {
  const quickLinks = [
    { label: "About the initiative", href: "#mysuru", kind: "anchor" },
    { label: "Core objectives", href: "#objectives", kind: "anchor" },
    { label: "Participation", href: "#participation", kind: "anchor" },
    { label: "Rules & regulations", href: "/rules", kind: "route" },
    { label: "Submission portal", href: "/submit", kind: "route" },
    { label: "Contact", href: "#contact", kind: "anchor" },
  ];

  return (
    <footer
      id="contact"
      className="relative overflow-hidden border-2 rounded-4xl border-[var(--bg)] bg-[#050505] pt-24 pb-12 text-zinc-300"
    >
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-start flex flex-col gap-3">
              <span className="text-xl font-bold tracking-tighter text-white uppercase">
                Vision Mysuru <span className="text-yellow-400">2050</span>
              </span>
              <span className="text-sm  tracking-tighter text-white ">
                Key connects
                <p>
                  M.S. Shrivathsa 98457 43337 <br />
                  H.R. Badarinath 82773 48958 <br />
                  R. Thejas 77952 84171
                </p>
              </span>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Platform
            </h3>
            <ul className="mt-6 space-y-4">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {item.kind === "route" ? (
                    <Link
                      to={item.href}
                      className="group flex items-center text-sm transition-colors hover:text-yellow-400"
                    >
                      <span className="relative">
                        {item.label}
                        <span className="absolute -bottom-1 left-0 h-px w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full" />
                      </span>
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="group flex items-center text-sm transition-colors hover:text-yellow-400"
                    >
                      <span className="relative">
                        {item.label}
                        <span className="absolute -bottom-1 left-0 h-px w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full" />
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Connect
            </h3>
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm leading-6">
                  Shri Dharmasthala Manjunatheshwara <br />
                  Institute for Management Development{" "}
                </span>
                <span className="text-sm leading-6">
                  SDMIMD No. 1, Chamundi Hill Rd, Post, Siddhartha Layout,
                  <br />
                  Mysuru, Karnataka 570010
                </span>
              </div>

              <a
                href="mailto: visionmysuru2050@gmail.com"
                className="group flex items-center gap-4 hover:text-yellow-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 group-hover:border-yellow-500/50 transition-colors">
                  <Mail className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm">visionmysuru2050@gmail.com</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0" />
              </a>

              <div className="group flex items-center gap-4 hover:text-yellow-400 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg  border border-zinc-800 group-hover:border-yellow-500/50 transition-colors">
                  <Phone className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm">0821 2429 722</span>
                <span className="text-sm">0821 2420 490</span>
              </div>
              <a
                href="https://www.instagram.com/visionmysuru2050"
                className="group flex items-center gap-4 hover:text-yellow-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg  border border-zinc-800 group-hover:border-yellow-500/50 transition-colors">
                  <FaInstagram className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm">Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61588072445207"
                className="group flex items-center gap-4 hover:text-yellow-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg  border border-zinc-800 group-hover:border-yellow-500/50 transition-colors">
                  <FaFacebook className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm">Facebook</span>
              </a>
              <a
                href="https://www.linkedin.com/company/vision-mysuru-2050/"
                className="group flex items-center gap-4 hover:text-yellow-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg  border border-zinc-800 group-hover:border-yellow-500/50 transition-colors">
                  <FaLinkedin className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-zinc-900 pt-8 md:flex-row">
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
            © 2026 Vision Mysuru 2050 · Future Ready
          </p>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
              <div className="h-5 w-[1px] bg-zinc-700" />
              <span className="text-[10px] font-bold tracking-tighter text-white">
                SDMIMD
              </span>
            </div>
            <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
              <div className="h-5 w-[1px] bg-zinc-700" />
              <span className="text-[10px] font-bold tracking-tighter text-white text-yellow-500">
                Govt of Karnataka
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
