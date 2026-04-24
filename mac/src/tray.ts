import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import * as path from 'path';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './services/firebase';
import { Block, TimerState } from '../../shared/types';
import { formatSeconds } from '../../shared/utils';

let tray: Tray | null = null;
let blocks: Block[] = [];
let timerStates: Record<string, TimerState> = {};
let userId: string | null = null;

export function setupTray(openMainWindow: () => BrowserWindow) {
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Bloc');

  updateTrayMenu(openMainWindow);

  tray.on('click', () => {
    if (tray) tray.popUpContextMenu();
  });
}

export function setTrayUserId(id: string | null) {
  userId = id;
  if (id) {
    subscribeToFirestore(id);
  } else {
    blocks = [];
    timerStates = {};
  }
}

function subscribeToFirestore(uid: string) {
  const blocksQ = query(collection(db, 'users', uid, 'blocks'), orderBy('order'));
  onSnapshot(blocksQ, (snap) => {
    blocks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Block));
    updateTrayMenu(() => {
      const wins = BrowserWindow.getAllWindows();
      return wins[0] ?? (null as any);
    });
  });

  blocks.forEach((block) => {
    onSnapshot(doc(db, 'users', uid, 'timerState', block.id), (snap) => {
      if (snap.exists()) {
        timerStates[block.id] = snap.data() as TimerState;
        updateTrayTitle();
      }
    });
  });
}

function getRunningBlock(): { block: Block; elapsed: number } | null {
  for (const block of blocks) {
    const state = timerStates[block.id];
    if (state?.status === 'running' && state.startedAt) {
      const startMs = (state.startedAt as Timestamp).toMillis();
      const elapsed = state.elapsed + Math.floor((Date.now() - startMs) / 1000);
      return { block, elapsed };
    }
  }
  return null;
}

function updateTrayTitle() {
  if (!tray) return;
  const running = getRunningBlock();
  if (running) {
    tray.setTitle(` ${running.block.name}  ${formatSeconds(running.elapsed)}`);
  } else {
    tray.setTitle('');
  }
}

function updateTrayMenu(openMainWindow: () => BrowserWindow) {
  if (!tray) return;

  const blockMenuItems = blocks.map((block) => {
    const state = timerStates[block.id];
    const isRunning = state?.status === 'running';
    const elapsed = isRunning && state.startedAt
      ? state.elapsed + Math.floor((Date.now() - (state.startedAt as Timestamp).toMillis()) / 1000)
      : state?.elapsed ?? 0;

    return {
      label: `${isRunning ? '⏸' : '▶'}  ${block.name}  ${formatSeconds(elapsed)}`,
      click: async () => {
        if (!userId) return;
        const newStatus = isRunning ? 'paused' : 'running';
        if (newStatus === 'running') {
          for (const b of blocks) {
            if (b.id !== block.id && timerStates[b.id]?.status === 'running') {
              await setDoc(doc(db, 'users', userId, 'timerState', b.id), {
                status: 'paused',
                elapsed: timerStates[b.id].elapsed,
                startedAt: null,
                updatedAt: serverTimestamp(),
              }, { merge: true });
            }
          }
        }
        await setDoc(doc(db, 'users', userId, 'timerState', block.id), {
          status: newStatus,
          elapsed: elapsed,
          startedAt: newStatus === 'running' ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
        });
      },
    };
  });

  const menu = Menu.buildFromTemplate([
    ...blockMenuItems,
    { type: 'separator' },
    {
      label: 'Open Bloc',
      click: () => { openMainWindow(); },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { app.quit(); },
    },
  ]);

  tray.setContextMenu(menu);
}

setInterval(updateTrayTitle, 1000);
