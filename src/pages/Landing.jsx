import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="display-heading text-5xl md:text-7xl text-accent-blood tracking-widest animate-flicker">
          DARKMON
        </div>
        <div className="mt-2 text-text-dim uppercase tracking-[0.4em] text-xs">
          // run the underground
        </div>

        <p className="mt-10 text-text-primary leading-relaxed">
          You don't collect monsters to be the very best.
          <br />
          You exploit them to be the very richest.
        </p>

        <p className="mt-6 text-text-dim text-sm leading-relaxed">
          The Murk is a rain-soaked city built on a failed utopia. Grimkin were once
          worshipped. Now they're livestock. Breeders mill them. Pitmasters bleed them.
          Renderers carve them for parts. You decide what they're worth.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/hub" className="btn btn-blood">ENTER THE MURK</Link>
          <Link to="/world" className="btn">SURVEY THE DISTRICTS</Link>
        </div>

        <div className="mt-16 text-[0.6rem] uppercase tracking-[0.3em] text-text-dim">
          // The Murk has standards. So should you.
        </div>
      </div>
    </div>
  );
}
