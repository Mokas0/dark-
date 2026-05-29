// District definitions + control logic.

export const DISTRICTS = [
  { id: 'silt',      name: 'The Silt',     description: 'Drowned tenements. Stray spawn zone.',           passive_income_per_hour: 60 },
  { id: 'gallows',   name: 'Gallowmarket', description: 'Open-air auction floors and faceless brokers.',  passive_income_per_hour: 180 },
  { id: 'choir',     name: 'The Choir',    description: 'Renderer slaughterhouses.',                       passive_income_per_hour: 240 },
  { id: 'bonebridge',name: 'Bonebridge',   description: 'Pitmaster turf. Nightly fights.',                 passive_income_per_hour: 280 },
  { id: 'rookery',   name: 'The Rookery',  description: 'Broodlord estates. High-purity bloodlines.',      passive_income_per_hour: 320 },
  { id: 'static',    name: 'Static Row',   description: 'Couriers and rumor brokers.',                     passive_income_per_hour: 100 },
];

export const FACTION_DEFAULT_CONTROL = {
  silt: 'unclaimed',
  gallows: 'unclaimed',
  choir: 'renderers',
  bonebridge: 'pitmasters',
  rookery: 'broodlords',
  static: 'unclaimed',
};

export function defaultDistrictState() {
  return DISTRICTS.map((d) => ({
    id: d.id,
    controller: FACTION_DEFAULT_CONTROL[d.id],
    contested_since: null,
    last_income_at: Date.now(),
  }));
}

export function districtById(id) {
  return DISTRICTS.find((d) => d.id === id);
}
