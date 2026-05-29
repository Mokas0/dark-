import { NavLink, Outlet } from 'react-router-dom';
import { GoldDisplay } from './GoldDisplay.jsx';
import { HeatMeter } from './HeatMeter.jsx';
import { FactionBadge } from './FactionBadge.jsx';
import { useGameStore } from '../state/useGameStore.js';
import { TickerFeed } from './TickerFeed.jsx';
import { HeatOverlay } from './HeatOverlay.jsx';

const NAV = [
  { to: '/hub', label: 'HUB' },
  { to: '/hub/kennel', label: 'KENNEL' },
  { to: '/hub/breeding', label: 'BREEDING' },
  { to: '/hub/inventory', label: 'INVENTORY' },
  { to: '/hub/shop', label: 'SHOP' },
  { to: '/market', label: 'MARKET' },
  { to: '/black-market', label: 'BLACK' },
  { to: '/bounties', label: 'BOUNTIES' },
  { to: '/arena', label: 'ARENA' },
  { to: '/raids', label: 'RAIDS' },
  { to: '/loans', label: 'LOANS' },
  { to: '/world', label: 'WORLD' },
];

export function Layout() {
  const player = useGameStore((s) => s.player);

  return (
    <div className="min-h-screen flex flex-col text-text-primary">
      <header className="border-b border-border bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-6">
          <NavLink to="/hub" className="display-heading text-accent-blood text-xl tracking-widest">
            DARK<span className="text-text-primary">MON</span>
          </NavLink>
          <nav className="hidden md:flex items-center gap-1 text-[0.7rem] uppercase tracking-widest">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/hub'}
                className={({ isActive }) =>
                  `px-2 py-1 border-b border-transparent ${
                    isActive
                      ? 'text-accent-blood border-accent-blood'
                      : 'text-text-dim hover:text-text-primary'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <FactionBadge faction={player.faction} />
            <HeatMeter heat={player.heat_level} />
            <GoldDisplay gold={player.gold} />
            <NavLink
              to={`/profile/${player.id}`}
              className="text-[0.7rem] uppercase tracking-widest text-text-dim hover:text-text-primary"
            >
              {player.username}
            </NavLink>
          </div>
        </div>
        <TickerFeed />
      </header>
      <HeatOverlay />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-bg-surface/60 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 py-3 text-[0.65rem] uppercase tracking-widest text-text-dim flex justify-between">
          <span>// THE MURK NEVER SLEEPS</span>
          <span>v0.1 · run the underground</span>
        </div>
      </footer>
    </div>
  );
}
