'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import toast from 'react-hot-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import TopHeader from '@/components/TopHeader';
import { ACHIEVEMENTS, type AchievementFacts } from '@/lib/achievements';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const POINTS_PER_COURSE = 50; // Taban Puan
// Şirket İçi Ödül Mağazası Ürünleri
const storeItems = [
  { id: 'coffee', title: 'Ücretsiz Kahve', cost: 100, icon: 'fa-mug-hot', color: '#8d6e63' },
  { id: 'movie', title: 'Sinema Bileti', cost: 300, icon: 'fa-ticket', color: '#e53935' },
  { id: 'book', title: 'Teknik Kitap Desteği', cost: 500, icon: 'fa-book', color: '#7c3aed' },
  { id: 'mentor', title: 'Kariyer Mentorluğu', cost: 800, icon: 'fa-compass', color: '#2563eb' },
  { id: 'day_off', title: '1 Gün Ekstra İzin', cost: 1000, icon: 'fa-umbrella-beach', color: '#43a047' }
];

type LeaderboardUser = { id: number; username: string; fullName: string; avatarUrl: string | null; points: number; courseCount: number; cvCount: number };

export default function RewardsPage() {
  useAuthGuard('USER');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/adventurer/svg?seed=carierra');
  const [courseCount, setCourseCount] = useState(0);
  const [cvCount, setCvCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [, setAchievementVersion] = useState(0);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');

    const user = localStorage.getItem('currentUser') || '';
    setUsername(user);
    const defAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user)}`;
    setAvatarUrl(defAvatar);

    // Get Claimed Rewards from LocalStorage
    const claimed = JSON.parse(localStorage.getItem(`claimed_rewards_${user}`) || '[]');
    setClaimedRewards(claimed);

    const token = localStorage.getItem('token');
    if (token) {
      Promise.all([
        fetch(`${API_URL}/api/courses/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/profile/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]).then(async ([coursesRes, profileRes]) => {
        if (coursesRes.ok) {
          const apiCourses = await coursesRes.json();
          const apiIds = apiCourses.map((c: any) => c.courseId);
          setCourseCount(apiIds.length);
        }
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile?.avatarUrl) {
            const url = profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_URL}${profile.avatarUrl}`;
            setAvatarUrl(url);
          }
        }
      }).catch(() => {});
      const loadRewardOverview = () => fetch(`${API_URL}/api/rewards/overview`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          setCourseCount(data.me?.courseCount || 0);
          setCvCount(data.me?.cvCount || 0);
          setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
        })
        .catch(() => {});
      loadRewardOverview();
      const refreshId = window.setInterval(loadRewardOverview, 30000);
      return () => window.clearInterval(refreshId);
    }
  }, []);

  useEffect(() => {
    const refreshAchievementUi = () => setAchievementVersion((version) => version + 1);
    window.addEventListener('carriera:achievement-unlocked', refreshAchievementUi);
    return () => window.removeEventListener('carriera:achievement-unlocked', refreshAchievementUi);
  }, []);

  const visitData = typeof window === 'undefined' ? { pages: [], firstVisitAt: 0 } : JSON.parse(localStorage.getItem(`carriera_achievement_visits_${username}`) || '{"pages":[],"firstVisitAt":0}');
  const achievementFacts: AchievementFacts = { courseCount, cvCount, visitedPages: visitData.pages || [], firstVisitAt: visitData.firstVisitAt || undefined };
  const unlockedIds = typeof window === 'undefined' ? [] : JSON.parse(localStorage.getItem(`carriera_unlocked_achievements_${username}`) || '[]');
  const unlockedAchievements = ACHIEVEMENTS.filter((achievement) => unlockedIds.includes(achievement.id) || achievement.isUnlocked(achievementFacts));
  const achievementCp = unlockedAchievements.reduce((total, achievement) => total + achievement.cpReward, 0);
  const achievementXp = unlockedAchievements.reduce((total, achievement) => total + achievement.xpReward, 0);
  const earnedCp = courseCount * POINTS_PER_COURSE + achievementCp;
  const spentCp = claimedRewards.reduce((total, rewardId) => total + (storeItems.find((item) => item.id === rewardId)?.cost || 0), 0);
  const availableCp = Math.max(0, earnedCp - spentCp);
  const totalXp = courseCount * 100 + achievementXp;

  // XP seviye yükseltir; CP ise mağazada harcanan para birimidir.
  const currentLevel = Math.floor(totalXp / 250) + 1;
  const currentLevelPoints = totalXp % 250;
  const pointsToNext = 250;
  const levelProgress = (currentLevelPoints / pointsToNext) * 100;
  const unlockedAchievementCount = unlockedAchievements.length;

  // Ödül Talep Etme
  function claimReward(rewardId: string, cost: number) {
    if (availableCp >= cost && !claimedRewards.includes(rewardId)) {
      if (window.confirm(`${cost} Puan harcayarak bu ödülü talep etmek istediğinize emin misiniz?`)) {
        const newClaimed = [...claimedRewards, rewardId];
        setClaimedRewards(newClaimed);
        const user = localStorage.getItem('currentUser') || '';
        localStorage.setItem(`claimed_rewards_${user}`, JSON.stringify(newClaimed));
        toast.success('Tebrikler! Ödülünüz başarıyla talep edildi. İK departmanı sizinle iletişime geçecektir.');
      }
    }
  }

  const nameLabel = username.split('@')[0] || 'Sen';

  return (
    <>
      <link rel="stylesheet" href="/styles/odul-basari.css" />
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content" style={{ backgroundColor: 'var(--bg-color)', padding: 40, minHeight: 'calc(100vh - 80px)' }}>
          <div className="rewards-dashboard">
            
            {/* Üst Kısım: Profil ve Level Progress */}
            <div className="rewards-top-card">
              <div className="rewards-user">
                <img src={avatarUrl} alt={username} className="rewards-avatar" />
                <div className="rewards-user-info">
                  <h2>Merhaba, <span style={{color: '#1a4fba'}}>{nameLabel}</span></h2>
                  <div className="cp-badge"><i className="fa-solid fa-coins"></i> {availableCp} CP</div>
                  <p className="rewards-xp-summary"><i className="fa-solid fa-bolt"></i> {totalXp} XP · Başarı ödülleri: +{achievementCp} CP / +{achievementXp} XP</p>
                </div>
              </div>
              <div className="level-container">
                <div className="level-header">
                  <div className="level-badge">LEVEL {currentLevel}</div>
                  <span>Sonraki Seviye: <strong>Level {currentLevel + 1}</strong></span>
                </div>
                <div className="xp-bar-bg">
                  <div className="xp-bar-fill" style={{ width: `${levelProgress}%` }}></div>
                </div>
                <div className="xp-text">Seviye {currentLevel + 1} için {currentLevelPoints} / {pointsToNext} XP</div>
              </div>
            </div>

            <div className="rewards-split">
              {/* Sol Sütun: Rozetler ve Mağaza */}
              <div className="rewards-left">
                
                {/* Başarılar */}
                <div className="rewards-section-card">
                  <h3><i className="fa-solid fa-medal"></i> Başarılarım <span className="achievement-count">{unlockedAchievementCount}/{ACHIEVEMENTS.length}</span></h3>
                  <p className="achievement-intro">Kilitleri açmak için ilerlemeye devam et. Açılan başarılar profilinde kalıcı olarak görünür.</p>
                  <div className="badges-grid achievement-grid">
                    {ACHIEVEMENTS.map((achievement) => {
                      const unlocked = unlockedIds.includes(achievement.id) || achievement.isUnlocked(achievementFacts);
                      const current = achievement.current(achievementFacts);
                      return (
                        <div key={achievement.id} className={`badge-item achievement-item${unlocked ? ' is-unlocked' : ' is-locked'}`}>
                          <div className="badge-icon" style={{ background: unlocked ? achievement.color : '#64748b' }}><i className={`fa-solid ${unlocked ? achievement.icon : 'fa-lock'}`} /></div>
                          <h4>{achievement.title}</h4>
                          <p>{achievement.description}</p>
                          <div className="achievement-reward"><i className="fa-solid fa-coins" /> +{achievement.cpReward} CP <i className="fa-solid fa-bolt" /> +{achievement.xpReward} XP</div>
                          <div className="achievement-progress"><span>{unlocked ? 'Kazanıldı' : `${current}/${achievement.target}`}</span><div><i style={{ width: `${Math.min(100, (current / achievement.target) * 100)}%`, background: achievement.color }} /></div></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ödül Mağazası */}
                <div className="rewards-section-card">
                  <h3><i className="fa-solid fa-store"></i> Ödül Mağazası</h3>
                  <div className="store-grid">
                    {storeItems.map((item, i) => {
                      const isClaimed = claimedRewards.includes(item.id);
                      const canAfford = availableCp >= item.cost;
                      return (
                        <div key={i} className={`store-item ${isClaimed ? 'claimed' : canAfford ? 'affordable' : 'locked'}`}>
                          <div className="store-icon" style={{ color: item.color }}>
                            <i className={`fa-solid ${item.icon}`}></i>
                          </div>
                          <h4>{item.title}</h4>
                          <div className="store-cost">{item.cost} CP</div>
                          
                          {isClaimed ? (
                            <button className="btn-claimed" disabled><i className="fa-solid fa-check"></i> Kazanıldı</button>
                          ) : canAfford ? (
                            <button className="btn-claim" onClick={() => claimReward(item.id, item.cost)}>Talep Et</button>
                          ) : (
                            <button className="btn-locked" disabled><i className="fa-solid fa-lock"></i> Puan Yetersiz</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Sağ Sütun: Leaderboard */}
              <div className="rewards-right">
                <div className="rewards-section-card leaderboard-card">
                  <h3><i className="fa-solid fa-trophy"></i> Canlı Liderlik Tablosu</h3>
                  <div className="leaderboard-list">
                    {leaderboard.length === 0 ? <div className="empty-state">Liderlik tablosu hazırlanıyor...</div> : leaderboard.map((user, idx) => {
                      const isMe = user.username === username;
                      let rankIcon = null;
                      if (idx === 0) rankIcon = <i className="fa-solid fa-crown" style={{color: '#fbbf24'}}></i>;
                      else if (idx === 1) rankIcon = <i className="fa-solid fa-medal" style={{color: '#94a3b8'}}></i>;
                      else if (idx === 2) rankIcon = <i className="fa-solid fa-award" style={{color: '#b45309'}}></i>;
                      else rankIcon = <span className="rank-num">{idx + 1}</span>;

                      return (
                        <div key={idx} className={`lb-item ${isMe ? 'is-me' : ''}`}>
                          <div className="lb-rank">{rankIcon}</div>
                          <img src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.username)}`} alt={user.fullName} className="lb-avatar" />
                          <div className="lb-name">{user.fullName} {isMe && '(Sen)'}</div>
                          <div className="lb-points">{user.points} CP</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
