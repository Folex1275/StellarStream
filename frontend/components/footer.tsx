"use client";

import Link from "next/link";

// Footer navigation links organized by column
const footerLinks = {
  product: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/streams", label: "Streams" },
    { href: "/dashboard/create-stream", label: "Create Stream" },
    { href: "#", label: "Analytics" },
  ],
  resources: [
    { href: "#", label: "Documentation" },
    { href: "#", label: "API Reference" },
    { href: "#", label: "Tutorials" },
    { href: "#", label: "FAQ" },
  ],
  company: [
    { href: "#", label: "About" },
    { href: "#", label: "Blog" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Contact" },
  ],
  legal: [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Cookie Policy" },
  ],
};

// Social media links configuration
const socialLinksConfig = [
  { href: "https://twitter.com/stellarstream", label: "Twitter", iconName: "twitter" },
  { href: "https://github.com/stellarstream", label: "GitHub", iconName: "github" },
  { href: "https://discord.gg/stellarstream", label: "Discord", iconName: "discord" },
  { href: "https://t.me/stellarstream", label: "Telegram", iconName: "telegram" },
];

// Icon components
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

// Stellar logo SVG component
function StellarLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="250" cy="250" r="250" fill="currentColor" />
      <path
        d="M394 165c-8 0-15 4-19 10L266 291l-69-55c-4-3-9-5-14-5s-10 2-14 5L106 285v-35l63-50c9-7 21-7 30 0l54 43 19-15-54-43c-18-14-42-14-60 0l-52 41v24l-25 20c-6 5-6 14 0 19 3 2 6 3 9 3s7-1 9-3l25-20 63 50c4 3 9 5 14 5s10-2 14-5l63-50 19 15-63 50c-9 7-21 7-30 0l-54-43-19 15 54 43c9 7 19 11 30 11s21-4 30-11l63-50v35l-63 50c-9 7-21 7-30 0l-54-43-19 15 54 43c9 7 19 11 30 11s21-4 30-11l63-50 25 20c3 2 6 3 9 3s7-1 9-3c6-5 6-14 0-19l-25-20v-24l52-41c18-14 42-14 60 0l63 50v35l-63-50c-4-3-9-5-14-5z"
        fill="#030303"
      />
    </svg>
  );
}

// Social icon renderer
function SocialIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "twitter":
      return <TwitterIcon className={className} />;
    case "github":
      return <GitHubIcon className={className} />;
    case "discord":
      return <DiscordIcon className={className} />;
    case "telegram":
      return <TelegramIcon className={className} />;
    default:
      return null;
  }
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-white/10 bg-black/40 backdrop-blur-3xl">
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Main footer content - 4 column layout */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {/* Column 1: Brand & Description */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-white font-bold tracking-tighter text-lg">
                StellarStream
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/40 leading-relaxed max-w-xs">
              Non-custodial, second-by-second asset streaming protocol built on
              Soroban. Money as a Stream.
            </p>

            {/* Built on Stellar Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <StellarLogo className="w-4 h-4 text-[#00F5FF]" />
              <span className="text-xs font-medium text-white/60">
                Built on Stellar
              </span>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-4">
              {socialLinksConfig.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white/80 transition-colors duration-200"
                  aria-label={social.label}
                >
                  <SocialIcon name={social.iconName} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-sm font-semibold text-white/80">Product</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white/80 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white/80">Resources</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white/80 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white/80">Company</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white/80 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 text-sm font-semibold text-white/80">Legal</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white/80 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-white/40">
              © {currentYear} StellarStream. All rights reserved.
            </p>
            <p className="text-xs text-white/40">
              Powered by{" "}
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00F5FF]/60 hover:text-[#00F5FF] transition-colors"
              >
                Stellar Network
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
