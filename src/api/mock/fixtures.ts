import type { Exhibitor, GuestInput, Meta, SampleProfile } from '../schemas';
import exhibitors from './exhibitors.json';
import meta from './meta.json';

// Offline snapshot of the live API (LASER World of PHOTONICS INDIA 2026), so demo data
// looks like the real thing. Refresh by re-exporting GET /api/meta and the exhibitors.

export const EXHIBITORS = exhibitors as unknown as Exhibitor[];
export const META: Meta = meta;
export const SAMPLE_PROFILES: SampleProfile[] = META.sampleProfiles;

export const EMPTY_GUEST_INPUT: GuestInput = {
  name: '',
  industry: '',
  jobRole: '',
  seniority: '',
  companySize: '',
  region: '',
  interests: [],
  freeText: '',
};
