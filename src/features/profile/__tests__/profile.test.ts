import type { Guest } from '../../../api/schemas';
import { SAMPLE_PROFILES } from '../../../api/mock/fixtures';
import { rankDelta } from '../../../store/rankChangesStore';
import { useSession, resetSession } from '../../../store/sessionStore';
import { isStaleGuest } from '../conflict';
import { validateGuestInput } from '../formValidation';

const guest = (updatedAt: string, id = 'g1'): Guest => ({ ...SAMPLE_PROFILES[0].profile, id, updatedAt });

describe('updatedAt conflict rule', () => {
  it('treats older data for the same guest as stale', () => {
    expect(isStaleGuest(guest('2026-10-30T10:00:00Z'), guest('2026-10-30T10:00:05Z'))).toBe(true);
  });

  it('accepts newer or equal data', () => {
    expect(isStaleGuest(guest('2026-10-30T10:00:05Z'), guest('2026-10-30T10:00:00Z'))).toBe(false);
    expect(isStaleGuest(guest('2026-10-30T10:00:00Z'), guest('2026-10-30T10:00:00Z'))).toBe(false);
  });

  it('ignores the rule for a different guest, no current guest, or unparseable dates', () => {
    expect(isStaleGuest(guest('2026-10-30T10:00:00Z', 'g2'), guest('2026-10-31T00:00:00Z'))).toBe(false);
    expect(isStaleGuest(guest('2026-10-30T10:00:00Z'), null)).toBe(false);
    expect(isStaleGuest(guest('garbage'), guest('2026-10-30T10:00:00Z'))).toBe(false);
  });

  it('is enforced by the session store: never overwrites newer local data with older', () => {
    resetSession();
    useSession.getState().setGuest(guest('2026-10-30T10:00:05Z'));
    useSession.getState().setGuest({ ...guest('2026-10-30T10:00:00Z'), name: 'Old name' });
    expect(useSession.getState().guest?.name).toBe(SAMPLE_PROFILES[0].profile.name);
    useSession.getState().setGuest({ ...guest('2026-10-30T10:00:09Z'), name: 'New name' });
    expect(useSession.getState().guest?.name).toBe('New name');
  });
});

describe('rankDelta', () => {
  it('reports movement, new entries and no-comparison', () => {
    const prev = { a: 5, b: 1 };
    expect(rankDelta(prev, 'a', 2)).toBe(3);
    expect(rankDelta(prev, 'b', 3)).toBe(-2);
    expect(rankDelta(prev, 'c', 4)).toBe('new');
    expect(rankDelta(prev, 'a', 5)).toBe(0);
    expect(rankDelta(null, 'a', 1)).toBe(0);
  });
});

describe('form validation', () => {
  it('returns one message per invalid field', () => {
    const res = validateGuestInput({ ...SAMPLE_PROFILES[0].profile, name: ' ', interests: [], industry: '' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors).toEqual({
        name: 'Please enter your name',
        industry: 'Pick your industry',
        interests: 'Pick at least one interest',
      });
    }
  });

  it('passes every sample profile', () => {
    for (const s of SAMPLE_PROFILES) expect(validateGuestInput(s.profile).ok).toBe(true);
  });
});
