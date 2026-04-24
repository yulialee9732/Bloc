import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import MacApp from './MacApp';
import MacAuthScreen from './screens/MacAuthScreen';

function Root() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0D1117' }}>
        <span style={{ fontSize: 48, fontWeight: 900, color: '#E6EDF3' }}>Bloc</span>
      </div>
    );
  }

  return user ? <MacApp user={user} /> : <MacAuthScreen />;
}

const root = createRoot(document.getElementById('root')!);
root.render(<Root />);
