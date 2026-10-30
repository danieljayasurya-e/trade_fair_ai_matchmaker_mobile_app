import { guestInputSchema, recommendationSchema, recommendationsResponseSchema } from '../schemas';

const validRec = {
  rank: 1,
  exhibitor: {
    id: 'ex-1',
    name: 'Kinetix',
    description: 'PLCs',
    products: ['PLC'],
    industries: ['Manufacturing'],
    hall: 'A',
    booth: 'A-2',
  },
  score: 87,
  matchedOn: ['Industrial Automation'],
  factors: { semantic: 0.8, interest: 0.9, intent: 0.7, buyerFit: 1, g2e: 0.8, e2g: 1 },
  reason: 'Offers PLCs.',
};

describe('recommendation schema', () => {
  it('accepts a valid recommendation', () => {
    expect(recommendationSchema.safeParse(validRec).success).toBe(true);
  });

  it.each([
    ['score above 100', { ...validRec, score: 120 }],
    ['negative score', { ...validRec, score: -1 }],
    ['NaN score', { ...validRec, score: NaN }],
    ['fractional score', { ...validRec, score: 87.5 }],
    ['factor above 1', { ...validRec, factors: { ...validRec.factors, semantic: 1.2 } }],
    ['missing exhibitor', { ...validRec, exhibitor: undefined }],
    ['missing booth', { ...validRec, exhibitor: { ...validRec.exhibitor, booth: undefined } }],
  ])('rejects %s', (_label, value) => {
    expect(recommendationSchema.safeParse(value).success).toBe(false);
  });

  it('accepts an empty matchedOn list', () => {
    expect(recommendationSchema.safeParse({ ...validRec, matchedOn: [] }).success).toBe(true);
  });

  it('validates the full response envelope', () => {
    expect(recommendationsResponseSchema.safeParse({ results: [validRec], latencyMs: 180, total: 1 }).success).toBe(true);
    expect(recommendationsResponseSchema.safeParse({ results: [validRec] }).success).toBe(false);
  });
});

describe('guest input schema', () => {
  const base = {
    name: 'Asha',
    industry: 'Manufacturing',
    jobRole: 'Buyer',
    seniority: 'Manager',
    companySize: '51-200',
    region: 'West India',
    interests: ['Robotics'],
    freeText: '',
  };

  it('accepts empty free text', () => {
    expect(guestInputSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ['emoji', 'Need cobots 🤖🦾 asap!!'],
    ['Hindi', 'हमें पैकेजिंग मशीनें चाहिए'],
    ['HTML-like text', '<script>alert(1)</script> & <b>bold</b>'],
    ['exactly 1000 chars', 'x'.repeat(1000)],
  ])('accepts free text with %s', (_label, freeText) => {
    const parsed = guestInputSchema.safeParse({ ...base, freeText });
    expect(parsed.success).toBe(true);
    // Stored verbatim, never sanitised into something else.
    if (parsed.success) expect(parsed.data.freeText).toBe(freeText);
  });

  it('rejects free text over 1000 chars', () => {
    expect(guestInputSchema.safeParse({ ...base, freeText: 'x'.repeat(1001) }).success).toBe(false);
  });

  it('rejects whitespace-only names', () => {
    expect(guestInputSchema.safeParse({ ...base, name: '   ' }).success).toBe(false);
  });
});
