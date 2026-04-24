import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { DEFAULT_BLOCKS } from '../constants/defaultBlocks';

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await initializeUserData(user.uid);
  return user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function signInWithApple(identityToken: string): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken });
  const { user } = await signInWithCredential(auth, credential);
  const userDoc = await getDoc(doc(db, 'users', user.uid, 'meta', 'profile'));
  if (!userDoc.exists()) {
    await initializeUserData(user.uid);
  }
  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

async function initializeUserData(userId: string): Promise<void> {
  const batch: Promise<void>[] = DEFAULT_BLOCKS.map((block, i) => {
    const blockId = `block_${Date.now()}_${i}`;
    return setDoc(doc(db, 'users', userId, 'blocks', blockId), {
      ...block,
      id: blockId,
      createdAt: serverTimestamp(),
    });
  });
  await Promise.all(batch);
}
