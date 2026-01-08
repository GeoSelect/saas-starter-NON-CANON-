import { describe, it, expect } from 'vitest';
import { TIER_REQUIREMENTS, TIER_ORDER, isTierSufficient, getMinimumTierFor } from '../lib/contracts/ccp05/entitlements';

describe('CCP-10 Entitlement Configuration', () => {
  it('CCP-10 is mapped to portfolio tier', () => {
    const ccp10Tier = TIER_REQUIREMENTS['ccp-10:collaboration'];
    expect(ccp10Tier).toBe('portfolio');
  });

  it('portfolio tier is sufficient for CCP-10', () => {
    const isAllowed = isTierSufficient('portfolio', 'portfolio');
    expect(isAllowed).toBe(true);
  });

  it('enterprise tier is sufficient for CCP-10', () => {
    const isAllowed = isTierSufficient('enterprise', 'portfolio');
    expect(isAllowed).toBe(true);
  });

  it('free tier is NOT sufficient for CCP-10', () => {
    const isAllowed = isTierSufficient('free', 'portfolio');
    expect(isAllowed).toBe(false);
  });

  it('pro tier is NOT sufficient for CCP-10', () => {
    const isAllowed = isTierSufficient('pro', 'portfolio');
    expect(isAllowed).toBe(false);
  });

  it('pro_plus tier is NOT sufficient for CCP-10', () => {
    const isAllowed = isTierSufficient('pro_plus', 'portfolio');
    expect(isAllowed).toBe(false);
  });

  it('tier hierarchy is ordered correctly', () => {
    expect(TIER_ORDER.free).toBeLessThan(TIER_ORDER.pro);
    expect(TIER_ORDER.pro).toBeLessThan(TIER_ORDER.pro_plus);
    expect(TIER_ORDER.pro_plus).toBeLessThan(TIER_ORDER.portfolio);
    expect(TIER_ORDER.portfolio).toBeLessThan(TIER_ORDER.enterprise);
  });

  it('getMinimumTierFor returns correct tier for CCP-10', () => {
    const minTier = getMinimumTierFor('ccp-10:collaboration');
    expect(minTier).toBe('portfolio');
  });

  it('CCP-12 (basic sharing) requires free tier', () => {
    const ccp12Tier = TIER_REQUIREMENTS['ccp-12:sharing'];
    expect(ccp12Tier).toBe('free');
  });

  it('CCP-10 requires higher tier than CCP-12', () => {
    const ccp10Tier = TIER_REQUIREMENTS['ccp-10:collaboration'];
    const ccp12Tier = TIER_REQUIREMENTS['ccp-12:sharing'];
    expect(TIER_ORDER[ccp10Tier]).toBeGreaterThan(TIER_ORDER[ccp12Tier]);
  });
});

describe('Plan Entitlements', () => {
  it('Home plan does not include CCP-10', async () => {
    const { PLAN_DEFINITIONS } = await import('../lib/plans/definitions');
    const homePlan = PLAN_DEFINITIONS.home;
    expect(homePlan.entitlements.can_share_collaboration).toBe(false);
    expect(homePlan.ccps).not.toContain('ccp-10');
  });

  it('Studio plan does not include CCP-10', async () => {
    const { PLAN_DEFINITIONS } = await import('../lib/plans/definitions');
    const studioPlan = PLAN_DEFINITIONS.studio;
    expect(studioPlan.entitlements.can_share_collaboration).toBe(false);
    expect(studioPlan.ccps).not.toContain('ccp-10');
  });

  it('Portfolio plan includes CCP-10', async () => {
    const { PLAN_DEFINITIONS } = await import('../lib/plans/definitions');
    const portfolioPlan = PLAN_DEFINITIONS.portfolio;
    expect(portfolioPlan.entitlements.can_share_collaboration).toBe(true);
    expect(portfolioPlan.ccps).toContain('ccp-10');
  });

  it('Portfolio plan is at least $199/month', async () => {
    const { PLAN_DEFINITIONS } = await import('../lib/plans/definitions');
    const portfolioPlan = PLAN_DEFINITIONS.portfolio;
    expect(portfolioPlan.price).toBeGreaterThanOrEqual(199);
  });

  it('Portfolio plan includes collaboration features', async () => {
    const { PLAN_DEFINITIONS } = await import('../lib/plans/definitions');
    const portfolioPlan = PLAN_DEFINITIONS.portfolio;
    const featureText = portfolioPlan.features.join(' ').toLowerCase();
    expect(featureText).toContain('collaboration');
  });

  it('Home and Studio plans are cheaper than Portfolio', async () => {
    const { PLAN_DEFINITIONS } = await import('../lib/plans/definitions');
    expect(PLAN_DEFINITIONS.home.price).toBeLessThan(PLAN_DEFINITIONS.portfolio.price);
    expect(PLAN_DEFINITIONS.studio.price).toBeLessThan(PLAN_DEFINITIONS.portfolio.price);
  });
});

describe('Feature Matrix', () => {
  it('Portfolio plan includes share-link-management feature', async () => {
    const { FEATURE_MATRIX } = await import('../lib/features/index');
    const portfolioFeatures = FEATURE_MATRIX.portfolio;
    expect(portfolioFeatures).toContain('share-link-management');
  });

  it('Home plan does not include share-link-management', async () => {
    const { FEATURE_MATRIX } = await import('../lib/features/index');
    const homeFeatures = FEATURE_MATRIX.home;
    expect(homeFeatures).not.toContain('share-link-management');
  });

  it('Studio plan does not include share-link-management', async () => {
    const { FEATURE_MATRIX } = await import('../lib/features/index');
    const studioFeatures = FEATURE_MATRIX.studio;
    expect(studioFeatures).not.toContain('share-link-management');
  });

  it('share-link-management feature requires portfolio plan', async () => {
    const { FEATURES } = await import('../lib/features/index');
    const shareLinkFeature = FEATURES['share-link-management'];
    expect(shareLinkFeature).toBeDefined();
    expect(shareLinkFeature.minPlanRequired).toBe('portfolio');
  });

  it('team-collaboration feature requires portfolio plan', async () => {
    const { FEATURES } = await import('../lib/features/index');
    const teamCollabFeature = FEATURES['team-collaboration'];
    expect(teamCollabFeature).toBeDefined();
    expect(teamCollabFeature.minPlanRequired).toBe('portfolio');
  });
});
