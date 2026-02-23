export interface ResidentPersona {
  id: string
  label: string
  ageRange: string
  incomeRange: string
  interests: string[]
  description: string
}

export const RESIDENT_OPTIONS: ResidentPersona[] = [
  {
    id: 'urban_professional',
    label: 'Urban Professional',
    ageRange: '25-35',
    incomeRange: '$60-90K',
    interests: ['Fitness', 'Networking', 'Modern amenities', 'Happy hours'],
    description: 'Young professionals seeking convenient, social urban living.',
  },
  {
    id: 'roommate_renter',
    label: 'Roommate Renter',
    ageRange: '22-35',
    incomeRange: '$30-50K/person',
    interests: ['Affordable social events', 'Game nights', 'Shared spaces'],
    description: 'Budget-conscious renters sharing space, seeking community activities.',
  },
  {
    id: 'downsizer',
    label: 'Downsizer',
    ageRange: '55+',
    incomeRange: '$70-120K',
    interests: ['Cultural events', 'Wellness', 'Gardening', 'Low-key socials'],
    description: 'Mature adults downsizing from homes, valuing comfort and community.',
  },
  {
    id: 'freelancer',
    label: 'Freelancer / Gig Worker',
    ageRange: '25-40',
    incomeRange: '$40-70K',
    interests: ['Flexible events', 'Productivity', 'Work-life balance', 'Co-working'],
    description: 'Remote workers needing flexibility and productive community spaces.',
  },
  {
    id: 'eco_conscious',
    label: 'Eco-Conscious Renter',
    ageRange: '20-45',
    incomeRange: '$50-80K',
    interests: ['Sustainability', 'Cycling', 'Plant-based events', 'Green initiatives'],
    description: 'Environmentally-minded residents seeking sustainable community living.',
  },
  {
    id: 'student',
    label: 'Student Renter',
    ageRange: '18-25',
    incomeRange: '$10-25K',
    interests: ['Budget-friendly events', 'Study socials', 'Campus-adjacent activities'],
    description: 'Students seeking affordable, social, and academically supportive housing.',
  },
  {
    id: 'young_family',
    label: 'Young Family',
    ageRange: '28-40',
    incomeRange: '$80-120K household',
    interests: ['Kid-friendly events', 'Parks', 'BBQ', 'Safe community'],
    description: 'Families with young children prioritising safety and family activities.',
  },
  {
    id: 'cultural_niche',
    label: 'Cultural Niche Renter',
    ageRange: '25-45',
    incomeRange: '$40-90K',
    interests: ['Cultural festivals', 'Inclusive events', 'Community celebrations'],
    description: 'Residents connected to cultural communities, seeking inclusive events.',
  },
  {
    id: 'mid_level_manager',
    label: 'Mid-Level Manager',
    ageRange: '35-50',
    incomeRange: '~$110K',
    interests: ['Premium events', 'Networking', 'Fine dining', 'Professional development'],
    description: 'Established professionals seeking upscale community experiences.',
  },
  {
    id: 'healthcare_professional',
    label: 'Healthcare Professional',
    ageRange: '28-55',
    incomeRange: '$77-120K',
    interests: ['Quiet spaces', 'Wellness', 'Short commute', 'Shift-friendly events'],
    description: 'Healthcare workers with irregular schedules, valuing rest and wellness.',
  },
  {
    id: 'energy_worker',
    label: 'Energy Worker',
    ageRange: '30-55',
    incomeRange: '$90-150K',
    interests: ['Premium finishes', 'Concierge', 'Outdoor recreation', 'BBQ'],
    description: 'Energy sector professionals with higher budgets, valuing premium amenities.',
  },
  {
    id: 'logistics_employee',
    label: 'Logistics Employee',
    ageRange: '25-45',
    incomeRange: '$60-80K',
    interests: ['Affordable events', 'Transit/parking', 'Shift-friendly scheduling'],
    description: 'Warehouse and logistics workers seeking affordable, accessible living.',
  },
]
