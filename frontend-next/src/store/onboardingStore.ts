'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OnboardingStep = 'profile' | 'cv' | null;

interface OnboardingState {
  onboardingDone: boolean;
  onboardingStep: OnboardingStep;

  setOnboardingDone: (done: boolean) => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboardingDone: false,
      onboardingStep: null,

      setOnboardingDone: (done) => set({ onboardingDone: done }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      reset: () => set({ onboardingDone: false, onboardingStep: null }),
    }),
    {
      name: 'carriera-onboarding',
    }
  )
);
