export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Kyle Naranjo
        </h1>
        <p className="mt-4 text-lg text-foreground/70 max-w-xl">
          Data Engineering Consultant building data platforms, ML pipelines, and
          GenAI applications.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            href="https://github.com/teslakoile"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-foreground/20 px-5 py-2 text-sm hover:bg-foreground/5 transition"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/kyle-naranjo"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-foreground/20 px-5 py-2 text-sm hover:bg-foreground/5 transition"
          >
            LinkedIn
          </a>
          <a
            href="mailto:kyle@teslakoile.dev"
            className="rounded-full border border-foreground/20 px-5 py-2 text-sm hover:bg-foreground/5 transition"
          >
            Email
          </a>
        </div>
      </section>

      {/* About */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold mb-4">About</h2>
        <p className="text-foreground/70 leading-relaxed">
          I&apos;m a data engineering consultant at Thinking Machines Data
          Science. I work on designing and building data infrastructure, ML
          systems, and GenAI-powered applications. I enjoy solving hard
          engineering problems and shipping things that matter.
        </p>
      </section>

      {/* Projects */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold mb-6">Projects</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Project One",
              description:
                "A data pipeline that processes millions of records daily.",
            },
            {
              title: "Project Two",
              description:
                "An ML-powered application for automated document processing.",
            },
            {
              title: "Project Three",
              description:
                "A GenAI chatbot built with retrieval-augmented generation.",
            },
          ].map((project) => (
            <div
              key={project.title}
              className="rounded-xl border border-foreground/10 p-5 hover:border-foreground/25 transition"
            >
              <h3 className="font-medium mb-1">{project.title}</h3>
              <p className="text-sm text-foreground/60">
                {project.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-foreground/40">
        &copy; {new Date().getFullYear()} Kyle Naranjo
      </footer>
    </main>
  );
}
