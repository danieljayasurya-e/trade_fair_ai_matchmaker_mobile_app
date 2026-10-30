import { z } from 'zod';

// Shared API contract. Keep in sync with docs/mobile-api-contract.md.

export const FREE_TEXT_MAX = 1000;

export const healthSchema = z.object({
  ok: z.boolean(),
  db: z.union([z.boolean(), z.string()]),
  model: z.union([z.boolean(), z.string()]),
});
export type Health = z.infer<typeof healthSchema>;

export const guestInputSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(80, 'Keep it under 80 characters'),
  industry: z.string().min(1, 'Pick your industry'),
  jobRole: z.string().trim().min(1, 'Enter your job role').max(80, 'Keep it under 80 characters'),
  seniority: z.string().min(1, 'Pick your seniority'),
  companySize: z.string().min(1, 'Pick your company size'),
  region: z.string().min(1, 'Pick your region'),
  interests: z.array(z.string()).min(1, 'Pick at least one interest'),
  freeText: z.string().max(FREE_TEXT_MAX, `Keep it under ${FREE_TEXT_MAX} characters`),
  optIn: z.boolean().optional(),
});
export type GuestInput = z.infer<typeof guestInputSchema>;

export const guestSchema = guestInputSchema.extend({
  id: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type Guest = z.infer<typeof guestSchema>;

export const sampleProfileSchema = z.object({
  id: z.string(),
  label: z.string(),
  profile: guestInputSchema,
});
export type SampleProfile = z.infer<typeof sampleProfileSchema>;

export const metaSchema = z.object({
  industries: z.array(z.string()),
  seniorities: z.array(z.string()),
  companySizes: z.array(z.string()),
  regions: z.array(z.string()),
  halls: z.array(z.string()),
  taxonomy: z.array(z.string()),
  sampleProfiles: z.array(sampleProfileSchema),
});
export type Meta = z.infer<typeof metaSchema>;

export const exhibitorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  products: z.array(z.string()),
  industries: z.array(z.string()),
  hall: z.string().min(1),
  booth: z.string().min(1),
});
export type Exhibitor = z.infer<typeof exhibitorSchema>;

const unit = z.number().min(0).max(1);

export const factorsSchema = z.object({
  semantic: unit,
  interest: unit,
  intent: unit,
  buyerFit: unit,
  g2e: unit,
  e2g: unit,
});
export type Factors = z.infer<typeof factorsSchema>;

export const recommendationSchema = z.object({
  rank: z.number().int().min(1),
  exhibitor: exhibitorSchema,
  score: z.number().int().min(0).max(100),
  matchedOn: z.array(z.string()),
  factors: factorsSchema,
  reason: z.string(),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

export const recommendationsResponseSchema = z.object({
  results: z.array(recommendationSchema),
  latencyMs: z.number().min(0),
  total: z.number().int().min(0),
});
export type RecommendationsResponse = z.infer<typeof recommendationsResponseSchema>;

export const bookmarksSchema = z.object({
  exhibitorIds: z.array(z.string()),
});
export type Bookmarks = z.infer<typeof bookmarksSchema>;

export const routeSchema = z.object({
  halls: z.array(
    z.object({
      hall: z.string(),
      stalls: z.array(recommendationSchema),
    }),
  ),
});
export type Route = z.infer<typeof routeSchema>;

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
