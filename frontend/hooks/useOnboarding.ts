'use client';

import { useMemo, useState } from 'react';
import {
  authShopInfo,
  authShopAddress,
  authShopDocs,
  authShopPlan,
} from '@/lib/api/endpoints';
import type {
  OnboardingState,
  OnboardingStep,
  ShopAddressData,
  ShopDocumentsData,
  ShopInfoData,
  ShopPlanData
} from '@/types/onboarding';

const STEP_ORDER: OnboardingStep[] = ['info', 'address', 'documents', 'plan'];

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'info',
    info: { name: '', description: '', logo: null, logoPreview: null },
    address: { address: '', city: '', state: '', country: '', postalCode: '', locationCaptured: false, latitude: null, longitude: null },
    documents: { businessDocument: null, fileName: null },
    plan: { planId: 'free', planName: 'Free Plan' }
  });

  const setCurrentStep = (step: OnboardingStep) => setState((s) => ({ ...s, currentStep: step }));
  const updateInfo = (patch: Partial<ShopInfoData>) => setState((s) => ({ ...s, info: { ...s.info, ...patch } }));
  const updateAddress = (patch: Partial<ShopAddressData>) => setState((s) => ({ ...s, address: { ...s.address, ...patch } }));
  const updateDocuments = (patch: Partial<ShopDocumentsData>) =>
    setState((s) => ({ ...s, documents: { ...s.documents, ...patch } }));
  const updatePlan = (patch: Partial<ShopPlanData>) => setState((s) => ({ ...s, plan: { ...s.plan, ...patch } }));

  const stepIndex = useMemo(() => STEP_ORDER.indexOf(state.currentStep), [state.currentStep]);

  const goNext = () => {
    const next = STEP_ORDER[Math.min(STEP_ORDER.length - 1, stepIndex + 1)];
    setCurrentStep(next);
  };

  const goBack = () => {
    const prev = STEP_ORDER[Math.max(0, stepIndex - 1)];
    setCurrentStep(prev);
  };

  const submitInfo = async () => {
    const formData = new FormData();
    formData.append('name', state.info.name);
    formData.append('description', state.info.description);
    if (state.info.logo) formData.append('logo', state.info.logo);
    await authShopInfo(formData);
  };

  const submitAddress = async () => {
    await authShopAddress({
      address: state.address.address,
      city: state.address.city,
      state: state.address.state,
      country: state.address.country,
      postal_code: state.address.postalCode,
      ...(state.address.latitude !== null && { latitude: state.address.latitude }),
      ...(state.address.longitude !== null && { longitude: state.address.longitude }),
    });
  };

  const submitDocuments = async () => {
    if (!state.documents.businessDocument) return;
    const formData = new FormData();
    formData.append('business_document', state.documents.businessDocument);
    await authShopDocs(formData);
  };

  const submitPlan = async () => {
    await authShopPlan(state.plan.planId ?? 'free');
  };

  return {
    state,
    setCurrentStep,
    updateInfo,
    updateAddress,
    updateDocuments,
    updatePlan,
    goNext,
    goBack,
    submitInfo,
    submitAddress,
    submitDocuments,
    submitPlan
  };
}
