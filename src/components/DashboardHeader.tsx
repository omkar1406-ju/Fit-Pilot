import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getActivePlan } from '../lib/workoutService';
import './DashboardHeader.css';

interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string;
  path: string;
  read: boolean;
}

function getReadKey(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  return `fp_notifications_read_${userId}_${today}`;
}

function loadReadIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getReadKey(userId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(userId: string, ids: Set<string>) {
  localStorage.setItem(getReadKey(userId), JSON.stringify([...ids]));
}

export default function DashboardHeader() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const name = profile?.name?.trim();
  const displayName = name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => user ? loadReadIds(user.id) : new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Generate notifications from real data
  const generateNotifications = useCallback(async () => {
    if (!user) return;
    const notifs: Notification[] = [];

    // 1. Workout notification
    const { plan } = await getActivePlan(user.id);
    if (plan) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = days[new Date().getDay()];
      const todayWorkout = plan.days.find((d) => d.day_of_week === todayName);
      if (todayWorkout && !todayWorkout.is_recovery_day) {
        notifs.push({
          id: 'workout_today',
          icon: '💪',
          title: 'Workout Ready',
          body: `Your ${todayWorkout.workout_name} session is ready — ${todayWorkout.exercises.length} exercises.`,
          path: '/dashboard/workouts',
          read: readIds.has('workout_today'),
        });
      } else if (todayWorkout?.is_recovery_day) {
        notifs.push({
          id: 'workout_today',
          icon: '💪',
          title: 'Recovery Day',
          body: 'Today is a rest day. Recover and come back stronger.',
          path: '/dashboard/workouts',
          read: readIds.has('workout_today'),
        });
      }
    }

    // 2. Strength notification
    const { data: lifts } = await supabase
      .from('user_lifts')
      .select('id, exercise_id, weight_kg, reps, extra_weight_kg, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (lifts && lifts.length > 0) {
      const latest = lifts[0];
      const minsAgo = (Date.now() - new Date(latest.created_at).getTime()) / 60000;
      if (minsAgo < 1440) {
        notifs.push({
          id: 'strength_recent',
          icon: '🏆',
          title: 'Strength Milestone',
          body: `New lift recorded! Keep building your strength profile.`,
          path: '/dashboard/progress',
          read: readIds.has('strength_recent'),
        });
      }
      if (lifts.length >= 3) {
        notifs.push({
          id: 'strength_profile',
          icon: '⚡',
          title: 'Strength Profile Growing',
          body: `You have ${lifts.length} lifts logged. Check your updated ranking.`,
          path: '/dashboard/progress',
          read: readIds.has('strength_profile'),
        });
      }
    }

    // 3. Goal reminder
    if (profile?.goal) {
      notifs.push({
        id: 'goal_reminder',
        icon: '🎯',
        title: 'Goal Check-In',
        body: `Your goal: ${profile.goal}. Stay consistent — small progress adds up.`,
        path: '/dashboard/goals',
        read: readIds.has('goal_reminder'),
      });
    }

    // 4. Nutrition reminder
    notifs.push({
      id: 'nutrition_reminder',
      icon: '🍽️',
      title: 'Nutrition',
      body: 'Log your meals to stay on track with your nutrition plan.',
      path: '/dashboard/nutrition',
      read: readIds.has('nutrition_reminder'),
    });

    setNotifications(notifs);
  }, [user, profile?.goal, readIds]);

  useEffect(() => {
    generateNotifications();
  }, [generateNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    if (!user) return;
    const newIds = new Set(readIds);
    notifications.forEach((n) => newIds.add(n.id));
    setReadIds(newIds);
    saveReadIds(user.id, newIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = (notif: Notification) => {
    if (!user) return;
    const newIds = new Set(readIds);
    newIds.add(notif.id);
    setReadIds(newIds);
    saveReadIds(user.id, newIds);
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    setPanelOpen(false);
    navigate(notif.path);
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <h1 className="dashboard-header__greeting">
          Welcome, <span>{displayName}</span>
        </h1>
      </div>
      <div className="dashboard-header__right">
        <button
          ref={bellRef}
          className={`dashboard-header__icon-btn ${unreadCount > 0 ? 'dashboard-header__icon-btn--has-notif' : ''}`}
          title="Notifications"
          onClick={() => setPanelOpen((prev) => !prev)}
        >
          🔔
          {unreadCount > 0 && (
            <span className="dashboard-header__badge">{unreadCount}</span>
          )}
        </button>
        <div
          className="dashboard-header__avatar"
          title="Edit Profile"
          onClick={() => navigate('/dashboard/profile')}
        >
          {initial}
        </div>
      </div>

      {panelOpen && (
        <div ref={panelRef} className="notif-panel">
          <div className="notif-panel__header">
            <h3 className="notif-panel__title">Notifications</h3>
            {unreadCount > 0 && (
              <button className="notif-panel__mark-read" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notif-panel__list">
            {notifications.length === 0 ? (
              <div className="notif-panel__empty">
                <span>You're all caught up! 💪</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={`notif-item ${notif.read ? '' : 'notif-item--unread'}`}
                  onClick={() => handleNotifClick(notif)}
                >
                  <span className="notif-item__icon">{notif.icon}</span>
                  <div className="notif-item__content">
                    <div className="notif-item__title">{notif.title}</div>
                    <div className="notif-item__body">{notif.body}</div>
                  </div>
                  {!notif.read && <span className="notif-item__dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}
