export interface SeasonalTheme {
  id: string
  name: string
  months: number[]  // 1-12
  ideas: string[]
}

export const SEASONAL_THEMES: SeasonalTheme[] = [
  {
    id: 'fresh_start',
    name: 'Fresh Start / Resolution',
    months: [1],
    ideas: ['Vision board workshop', 'Goal-setting social', 'New year wellness kickoff', 'Healthy habit challenge launch'],
  },
  {
    id: 'appreciation',
    name: 'Appreciation',
    months: [2],
    ideas: ['Galentine\'s/Valentine\'s social', 'Random acts of kindness wall', 'Neighbour appreciation cards', 'Community gratitude board'],
  },
  {
    id: 'spring_reset',
    name: 'Spring Reset / Renewal',
    months: [3, 4],
    ideas: ['Spring cleaning kickoff', 'Donation drive', 'Balcony garden workshop', 'Fresh start declutter event'],
  },
  {
    id: 'community_appreciation',
    name: 'Community Appreciation',
    months: [5],
    ideas: ['Resident appreciation week', 'Thank-you breakfast', 'Community volunteer day', 'Staff meet-and-greet'],
  },
  {
    id: 'summer_social',
    name: 'Summer Social / Outdoor Living',
    months: [6, 7, 8],
    ideas: ['Rooftop BBQ', 'Outdoor movie night', 'Pool party', 'Summer fitness series', 'Ice cream social'],
  },
  {
    id: 'back_to_routine',
    name: 'Back-to-Routine / Wellness',
    months: [9],
    ideas: ['Wellness fair', 'Meal prep workshop', 'Organization challenge', 'Fall fitness restart'],
  },
  {
    id: 'gratitude_fall',
    name: 'Gratitude / Fall Comfort',
    months: [10],
    ideas: ['Thanksgiving potluck', 'Pumpkin carving night', 'Fall harvest market', 'Cozy movie marathon'],
  },
  {
    id: 'giving_season',
    name: 'Giving Season',
    months: [11, 12],
    ideas: ['Holiday decorating party', 'Gift exchange', 'Charity drive', 'Winter market'],
  },
  {
    id: 'holiday_season',
    name: 'Holiday Season / Winter Holidays',
    months: [12],
    ideas: ['Holiday social', 'Hot chocolate bar', 'Gingerbread decorating', 'New Year\'s Eve countdown'],
  },
]

export const EVERGREEN_THEMES = [
  {
    id: 'wellness',
    name: 'Wellness & Balance',
    ideas: ['Morning movement class', 'Stress-reset workshop', 'Healthy habit challenge', 'Meditation session', 'Yoga on the rooftop'],
  },
  {
    id: 'community',
    name: 'Community & Connection',
    ideas: ['Meet-your-neighbours social', 'Game night', 'Coffee & conversation', 'Potluck dinner', 'Speed friending'],
  },
  {
    id: 'families',
    name: 'Families & Kids',
    ideas: ['Craft afternoon', 'Seasonal scavenger hunt', 'Movie / story time', 'Family game day', 'Kids\' cooking class'],
  },
  {
    id: 'food',
    name: 'Food & Comfort',
    ideas: ['Hot chocolate bar', 'Soup / chili night', 'Dessert swap', 'Cultural food tasting', 'Pizza party'],
  },
  {
    id: 'learning',
    name: 'Learning & Growth',
    ideas: ['Guest speaker talk', 'Skill-share session', 'Book / discussion club', 'Financial literacy workshop', 'DIY workshop'],
  },
  {
    id: 'seasonal_living',
    name: 'Seasonal Living',
    ideas: ['Spring cleaning kickoff', 'Summer outdoor social', 'Fall organization reset', 'Winter coziness theme', 'Balcony gardening'],
  },
] as const
