/**
 * Trois gestes lisibles : sortir, rester hors champ, revenir avec une bouchée.
 * Les changements de géométrie se font au milieu du plateau hors champ.
 * Toutes les poses sont calculées depuis la progression, sans état accumulé :
 * le scroll arrière et les commandes rendent exactement le même mouvement.
 */
export const MEAL_TRIPS = [
  {
    depart: 0.65,
    outside: 0.685,
    biteAt: 0.695,
    returnAt: 0.71,
    rest: 0.745,
    bite: 2,
    roll: 0.1,
    twist: -0.08,
  },
  {
    depart: 0.755,
    outside: 0.79,
    biteAt: 0.8,
    returnAt: 0.815,
    rest: 0.85,
    bite: 4,
    roll: 0.15,
    twist: 0.06,
  },
  {
    depart: 0.86,
    outside: 0.895,
    biteAt: 0.905,
    returnAt: 0.92,
    rest: 0.95,
    bite: 5,
    roll: 0.08,
    twist: -0.04,
  },
] as const;

export function easeRange(progress: number, from: number, to: number) {
  const t = Math.min(1, Math.max(0, (progress - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function mealPose(progress: number) {
  const index = MEAL_TRIPS.reduce(
    (last, trip, candidate) => (progress >= trip.depart ? candidate : last),
    -1,
  );
  const trip = index >= 0 ? MEAL_TRIPS[index] : undefined;
  const outward = trip ? easeRange(progress, trip.depart, trip.outside) : 0;
  const returning = trip ? easeRange(progress, trip.returnAt, trip.rest) : 0;
  const travel = outward - returning;
  const bite = MEAL_TRIPS.filter((step) => progress >= step.biteAt).at(-1)?.bite ?? 0;
  const exit = easeRange(progress, 0.96, 0.985);
  let phase = "pickup";
  if (trip) {
    if (progress < trip.outside) phase = "outward";
    else if (progress < trip.returnAt) phase = "outside";
    else if (progress < trip.rest) phase = "returning";
    else phase = bite === 5 ? "empty" : "presenting";
  }
  if (exit > 0) phase = "exit";
  return {
    bite,
    trip: index + 1,
    travel: Math.max(travel, exit),
    // Une légère rotation différente au retour évite un aller-retour mécanique.
    roll: trip ? trip.roll * (travel + Math.sin(returning * Math.PI) * 0.35) : 0,
    twist: trip ? trip.twist * (travel - Math.sin(returning * Math.PI) * 0.5) : 0,
    release: easeRange(progress, 0.92, 0.95),
    phase,
  };
}

/** La fin de la piste accueille le retour au cadrage éditorial vu du dessus. */
export const STORY_END = 0.86;
export function storyProgress(progress: number) {
  return Math.min(1, Math.max(0, progress / STORY_END));
}
