export const SCENARIO_NAMES = {
  0: 'Scenario A — Per Acre',
  1: 'Scenario B — Annual SaaS',
  2: 'Scenario C — Custom',
};

export function createDefaultScenario(pricingModel = 'annualSaas', name = 'Scenario A') {
  return {
    name,
    pricingModel,
    inputs: null,
  };
}
