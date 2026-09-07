import React from 'react';
import { LegalDocumentScreen } from '@/components/LegalDocumentScreen';
import { PRIVACY_POLICY_DOCUMENT } from '@/constants/legalDocuments';

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen document={PRIVACY_POLICY_DOCUMENT} />;
}
