import React, { useState } from 'react';
import { User } from 'firebase/auth';
import MacHomeScreen from './screens/MacHomeScreen';
import MacPlannerScreen from './screens/MacPlannerScreen';
import MacStatsScreen from './screens/MacStatsScreen';

type Tab = 'home' | 'planner' | 'stats';

interface Props {
  user: User;
}

export default function MacApp({ user }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '⏱' },
    { id: 'planner', label: 'Planner', icon: '📅' },
    { id: 'stats', label: 'Stats', icon: '📊' },
  ];

  return (
    <div style={styles.root}>
      <div style={styles.sidebar}>
        <div style={styles.appName}>Bloc</div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab.id ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        <div style={styles.sidebarSpacer} />
        <div style={styles.userEmail}>{user.email}</div>
      </div>

      <div style={styles.content}>
        {activeTab === 'home' && <MacHomeScreen userId={user.uid} />}
        {activeTab === 'planner' && <MacPlannerScreen userId={user.uid} />}
        {activeTab === 'stats' && <MacStatsScreen userId={user.uid} />}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    background: '#0D1117',
    overflow: 'hidden',
  },
  sidebar: {
    width: 200,
    background: '#0D1117',
    borderRight: '1px solid #21262D',
    padding: '52px 12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: 900,
    color: '#E6EDF3',
    padding: '0 8px 20px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#7D8590',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  tabBtnActive: {
    background: '#21262D',
    color: '#E6EDF3',
  },
  tabIcon: { fontSize: 18 },
  sidebarSpacer: { flex: 1 },
  userEmail: {
    fontSize: 11,
    color: '#7D8590',
    padding: '8px 8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};
