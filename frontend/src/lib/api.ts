import { 
  VerificationResponse, 
  SubmissionItem, 
  OpsStatsSummary, 
  SampleDocCatalogItem,
  ApplicantType 
} from '../types/kyc';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchSamplesCatalog(): Promise<SampleDocCatalogItem[]> {
  const res = await fetch(`${BASE_URL}/api/sample-docs`);
  if (!res.ok) throw new Error('Failed to fetch sample catalog');
  return res.json();
}

export async function fetchSampleFile(filename: string): Promise<File> {
  const res = await fetch(`${BASE_URL}/api/sample-docs/${filename}`);
  if (!res.ok) throw new Error(`Failed to download sample file ${filename}`);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

export async function submitKYCVerification(
  panFile: File,
  gstFile: File,
  chequeFile: File | null,
  applicantType: ApplicantType,
  bypassQualityGate: boolean = false
): Promise<VerificationResponse> {
  const formData = new FormData();
  formData.append('pan_image', panFile);
  formData.append('gst_image', gstFile);
  if (chequeFile) {
    formData.append('cheque_image', chequeFile);
  }
  formData.append('applicant_type', applicantType);
  formData.append('bypass_quality_gate', String(bypassQualityGate));

  const res = await fetch(`${BASE_URL}/api/verify-kyc`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Verification failed' }));
    throw new Error(err.detail || 'Verification pipeline encountered an error');
  }

  return res.json();
}

export async function fetchSubmissions(
  status: string = 'ALL',
  applicantType: string = 'ALL',
  search?: string
): Promise<SubmissionItem[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (applicantType && applicantType !== 'ALL') params.append('applicant_type', applicantType);
  if (search && search.trim()) params.append('search', search.trim());

  const res = await fetch(`${BASE_URL}/api/submissions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
}

export async function fetchSubmissionDetail(id: string): Promise<SubmissionItem> {
  const res = await fetch(`${BASE_URL}/api/submissions/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch submission ${id}`);
  return res.json();
}

export async function submitOverride(
  id: string,
  action: 'APPROVE' | 'REJECT',
  notes: string,
  reviewer: string = 'RiskOps_Lead'
): Promise<SubmissionItem> {
  const res = await fetch(`${BASE_URL}/api/submissions/${id}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes, reviewer }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Override failed' }));
    throw new Error(err.detail || 'Override failed');
  }

  return res.json();
}

export async function fetchOpsStats(): Promise<OpsStatsSummary> {
  const res = await fetch(`${BASE_URL}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
