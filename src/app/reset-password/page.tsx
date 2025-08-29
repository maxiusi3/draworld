import { Suspense } from 'react';
import ResetPasswordComponent from '@/components/auth/ResetPasswordComponent';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordComponent />
    </Suspense>
  );
}