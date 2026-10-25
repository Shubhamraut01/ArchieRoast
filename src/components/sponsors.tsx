import Image from "next/image";

const SPONSORS = [
  {
    name: "JarvisLabs",
    logo: "/sponsors/jarvislabs.jpg",
    href: "https://jarvislabs.ai",
  },
  { name: "Kepler", logo: "/sponsors/kepler.png" },
  { name: "Temporal", logo: "/sponsors/temporal.png" },
] as const;

export function Sponsors() {
  return (
    <div className="text-muted-foreground relative z-10 border-b border-white/5 bg-black/20 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-2.5 text-xs">
        <span className="tracking-wide uppercase">Sponsored by</span>
        {SPONSORS.map((s) => {
          const content = (
            <>
              <Image
                src={s.logo}
                alt=""
                width={20}
                height={20}
                className="size-5 rounded-sm object-cover"
              />
              <span>{s.name}</span>
            </>
          );
          const className = "flex items-center gap-1.5";
          return "href" in s ? (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className={`${className} hover:text-foreground transition-colors`}
            >
              {content}
            </a>
          ) : (
            <span key={s.name} className={className}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
