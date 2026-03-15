import Link from "next/link";


export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background radial gradient decoration */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, var(--primary) 0%, transparent 40%)",
          opacity: 0.15,
        }}
      />

      <main className="z-10 flex flex-col items-center justify-center text-center max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent mb-6 drop-shadow-sm">
          Welcome to ScholarX
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          The premium learning platform for the next generation of engineers,
          designers, and creators.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          >
            Explore Courses
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-full bg-secondary px-8 py-3.5 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95"
          >
            Learn More
          </Link>
        </div>
      </main>
    </div>
  );
}
