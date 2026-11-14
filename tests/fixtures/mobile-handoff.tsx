import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatFeedbackControls } from '../../src/components/ai/ChatFeedbackControls';
import { AvatarEditor } from '../../src/components/profile/AvatarEditor';
import { Toaster } from '../../src/components/ui';
import { authClient } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';
import '../../src/styles/globals.css';

authClient.setAccessToken('fixture-token');
useAuthStore.setState({ status: 'authenticated', user: { id: '11111111-1111-1111-1111-111111111111', username: 'fixture', email: 'fixture@example.test', profile: null, roles: ['REGISTERED_CITIZEN'], permissions: ['iam.profile.write'], avatarUrl: null } });
function Fixture() {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  return <main className="mx-auto max-w-md space-y-6 p-4"><AvatarEditor initials="KT" /><ChatFeedbackControls messageId="22222222-2222-2222-2222-222222222222" value={helpful} onRated={setHelpful} /><Toaster /></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
