const NAV_LINKS = [
  "Collections",
  "Journal",
  "Our Ethos",
  "Member Directory",
  "Privacy",
];

export default function Footer() {
  return (
    <footer className="w-full bg-secondary border-t border-primary/10">
      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-headline italic text-primary text-xl">Bibliotheca</p>
          <p className="text-neutral/40 text-[10px] tracking-[0.18em] mt-1 uppercase">
            © 2024 The Bibliophile&apos;s Exchange. Printed in Digits.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-neutral/50 text-[10px] tracking-[0.18em] uppercase hover:text-primary transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
