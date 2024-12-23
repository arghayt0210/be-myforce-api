import { z } from 'zod';

export const onboardingSchema = z.object({
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  bio: z.string().max(500, 'Bio must not exceed 500 characters'),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>; 