import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, Phone, MapPin, Globe } from "lucide-react";

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
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tighter text-white uppercase">
                MysuruVisison <span className="text-yellow-400">2050</span>
              </span>
            </div>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-zinc-400">
              A strategic blueprint for urban evolution. We are redefining
              Mysuru’s landscape through sustainable infrastructure and
              citizen-centric governance.
            </p>
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
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                  <MapPin className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm leading-6">
                  SDMIMD, Chamundi Hill Road,
                  <br />
                  Siddharthanagar, Mysuru, KA
                </span>
              </div>

              <a
                href="mailto:vision2050@sdmimd.ac.in"
                className="group flex items-center gap-4 hover:text-yellow-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-yellow-500/50 transition-colors">
                  <Mail className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm">vision2050@sdmimd.ac.in</span>
                <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0" />
              </a>

              <a
                href="tel:+918212425820"
                className="group flex items-center gap-4 hover:text-yellow-400 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-yellow-500/50 transition-colors">
                  <Phone className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="text-sm">+91 821 2425 820</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-zinc-900 pt-8 md:flex-row">
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
            © 2026 Mysuru Vision 2050 · Future Ready
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
