import React from 'react';
import { LegalDocumentScreen } from '@/components/LegalDocumentScreen';
import { TERMS_DOCUMENT } from '@/constants/legalDocuments';

export default function TermsScreen() {
  return <LegalDocumentScreen document={TERMS_DOCUMENT} />;
}
