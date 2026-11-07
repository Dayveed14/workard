import { useEffect, useState } from 'react';
import { PLANS } from '../config/plans.js';
import { api } from '../api/client.js';
import { getPreloaded } from '../data/preload.js';

// Today's plan prices (the super admin can change them without a deploy).
// Starts from the prices baked into the page / config/plans.js, then asks the API.
let live = null; // shared by every component once loaded
let request = null;

const merge = (prices) => PLANS.map((p) => ({ ...p, prices: prices?.find((x) => x.id === p.id)?.prices || p.prices }));

export function usePlans() {
  const [plans, setPlans] = useState(() => live || merge(getPreloaded('plans')));
  const [trialDays, setTrialDays] = useState(() => getPreloaded('trialDays') ?? 14);

  useEffect(() => {
    if (!request) request = api('/api/site/plans').catch(() => null);
    let on = true;
    request.then((r) => {
      if (!r || !on) return;
      live = merge(r.plans);
      setPlans(live);
      setTrialDays(r.trialDays);
    });
    return () => {
      on = false;
    };
  }, []);

  return { plans, trialDays };
}

// The biggest yearly saving across the plans ("save up to 13%")
export const yearlySaving = (plans) => Math.max(...plans.map((p) => Math.round((1 - p.prices.yearly / (p.prices.monthly * 12)) * 100)));
