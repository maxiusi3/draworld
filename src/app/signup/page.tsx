import { Suspense } from 'react';
import SignUpComponent from '@/components/auth/SignUpComponent';

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpComponent />
    </Suspense>
  );
}