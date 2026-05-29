const DISTRICTS = [
  { id: 'silt', name: 'The Silt', desc: 'Drowned tenements. Wild Grimkin spawn here at night.', tone: 'text-accent-toxic' },
  { id: 'gallows', name: 'Gallowmarket', desc: 'Open-air auction floors and faceless brokers.', tone: 'text-accent-gold' },
  { id: 'choir', name: 'The Choir', desc: 'Renderer slaughterhouses. Bring product, leave clean.', tone: 'text-accent-blood' },
  { id: 'bone', name: 'Bonebridge', desc: 'Pitmaster territory. Fights nightly. No questions.', tone: 'text-accent-blood' },
  { id: 'rookery', name: 'The Rookery', desc: 'Broodlord estates. Bloodlines for sale, if you can pay.', tone: 'text-accent-void' },
  { id: 'static', name: 'Static Row', desc: 'Underground couriers and rumor brokers.', tone: 'text-text-dim' },
];

export function World() {
  return (
    <div className="space-y-4">
      <div>
        <div className="label">// THE MURK</div>
        <h1 className="display-heading text-2xl mt-1">Districts</h1>
        <p className="text-xs text-text-dim mt-1">
          Six districts. Six economies. Whichever syndicate flies a banner here
          collects rent on every transaction.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DISTRICTS.map((d) => (
          <div key={d.id} className="panel p-4 crt-overlay">
            <div className={`label ${d.tone}`}>// {d.name.toUpperCase()}</div>
            <p className="text-xs text-text-dim mt-2">{d.desc}</p>
            <div className="mt-3 text-[0.6rem] uppercase tracking-widest text-text-dim border-t border-border pt-2">
              Controlled by: <span className="text-accent-blood">UNCLAIMED</span>
            </div>
          </div>
        ))}
      </div>
      <div className="panel p-4">
        <div className="label">// ACTIVE WORLD EVENTS</div>
        <p className="text-xs text-text-dim mt-2 italic">
          Events spawn on a server schedule. Watch the marquee at the top of every page.
        </p>
      </div>
    </div>
  );
}
