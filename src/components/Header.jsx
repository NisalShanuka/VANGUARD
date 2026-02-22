"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { tapPress } from './motionPresets.js';
import { useSession, signIn, signOut } from 'next-auth/react';

// ─────────────────────────────────────────────────────────
// Reusable hook: close dropdown on outside click
// ─────────────────────────────────────────────────────────
function useOutsideClick(ref, callback) {
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) callback(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}

// ─────────────────────────────────────────────────────────
// Notifications hook
// ─────────────────────────────────────────────────────────
function useNotifications(session) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    const controller = new AbortController();

    const fetchNotifications = async () => {
      try {
        const res = await window.fetch('/api/notifications', { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnread(data.unread || 0);
      } catch (err) {
        if (err.name !== 'AbortError') setUnread(0);
      }
    };

    fetchNotifications();
    const id = setInterval(fetchNotifications, 60000); // Poll less frequently (1m)

    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [session?.user?.id]);

  return { notifications, unread };
}

// ─────────────────────────────────────────────────────────
// Dashboard dropdown menu (opens on DASHBOARD click)
// ─────────────────────────────────────────────────────────
function DashboardMenu({ session, onClose }) {
  const { notifications, unread } = useNotifications(session);
  const isAdmin = session?.user?.role === 'admin';

  const statusColor = { pending: '#888', interview: '#aaa', accepted: '#fff', declined: '#444' };
  const statusEmoji = {
    pending: <i className="fas fa-clock" />,
    interview: <i className="fas fa-microphone" />,
    accepted: <i className="fas fa-circle-check" />,
    declined: <i className="fas fa-circle-xmark" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', right: 0, top: 'calc(100% + 12px)',
        width: 280, zIndex: 9999,
        background: '#000',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 0,
        boxShadow: '0 24px 80px rgba(0,0,0,1)',
        backdropFilter: 'blur(24px)',
        overflow: 'hidden',
      }}
    >
      {/* User info header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {session?.user?.image ? (
            <img src={session.user.image} alt="" style={{ width: 40, height: 40, borderRadius: 0, objectFit: 'cover', border: `2px solid #fff` }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 0, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(255,255,255,0.3)' }}><i className="fas fa-user-circle" /></div>
          )}
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 12, height: 12, borderRadius: 0,
            background: '#fff',
            border: '2px solid #000',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.user?.name || 'User'}
          </p>
          <p style={{
            margin: '2px 0 0', fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#fff',
          }}>
            {isAdmin ? <><i className="fas fa-gear mr-1" /> Admin</> : '● Member'}
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '8px 0' }}>
        <MenuItem icon={<i className="fas fa-id-card-clip" />} label="Dashboard" sub="View your dashboard" href="/ucp" onClick={onClose} />
        <MenuItem icon={<i className="fas fa-file-invoice" />} label="My Applications" sub="Check application status" href="/ucp/my-applications" onClick={onClose} />
        <MenuDivider />

        {/* Notifications section */}
        <div style={{ padding: '4px 0' }}>
          <div style={{ padding: '6px 18px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-bell" /> Notifications
            </span>
            {unread > 0 && (
              <span style={{ fontSize: 9, fontWeight: 900, background: '#fff', color: '#000', padding: '1px 6px', borderRadius: 0 }}>
                {unread}
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '8px 18px 10px', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              No new notifications
            </div>
          ) : notifications.slice(0, 3).map((n, i) => (
            <Link key={i} href={n.href || '/ucp'} onClick={onClose} style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 18px', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 13, lineHeight: 1.2, flexShrink: 0, opacity: 0.5 }}>{statusEmoji[n.status] || <i className="fas fa-file-lines" />}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{n.subtitle}</p>
              </div>
              {n.status && (
                <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#000', padding: '2px 6px', background: '#fff', border: '1px solid #fff', borderRadius: 0, whiteSpace: 'nowrap' }}>
                  {n.status}
                </span>
              )}
            </Link>
          ))}
        </div>
        <MenuDivider />

        <MenuItem icon={<i className="fas fa-cog" />} label="Settings" sub="Account preferences" href="/admin/settings" onClick={onClose} />

        {isAdmin && (
          <MenuItem icon={<i className="fas fa-shield-halved" />} label="Admin Panel" sub="Manage applications" href="/admin" onClick={onClose} accent="#fff" />
        )}
        <MenuDivider />

        <button
          onClick={() => { onClose(); signOut(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,71,71,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ width: 30, height: 30, borderRadius: 0, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, color: 'rgba(255,255,255,0.4)' }}><i className="fas fa-right-from-bracket" /></span>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#fff' }}>Logout</p>
            <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Sign out of your account</p>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

function MenuItem({ icon, label, sub, href, onClick, accent }) {
  return (
    <Link href={href} onClick={onClick} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ width: 30, height: 30, borderRadius: 0, background: accent ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: accent || '#fff' }}>{label}</p>
        <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
      </div>
    </Link>
  );
}

function MenuDivider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />;
}

// ─────────────────────────────────────────────────────────
// Main Header
// ─────────────────────────────────────────────────────────
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopDashOpen, setDesktopDashOpen] = useState(false);
  const [mobileDashOpen, setMobileDashOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { data: session } = useSession();
  const pathname = usePathname();
  const desktopDashRef = useRef(null);
  const mobileDashRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const closeDesktopDash = useCallback(() => setDesktopDashOpen(false), []);
  const closeMobileDash = useCallback(() => setMobileDashOpen(false), []);

  useOutsideClick(desktopDashRef, closeDesktopDash);
  useOutsideClick(mobileDashRef, closeMobileDash);

  const { unread } = useNotifications(session);

  const NAV_LINKS = useMemo(() => [
    { href: '/', label: t('header.home') },
    { href: '/knowledgebase', label: t('header.knowledgebase') },
    { href: '/announcements', label: t('header.announcements') },
    { href: '/#applications', label: 'Applications' },
  ], [t]);

  return (
    <>
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? 'rgba(0,0,0,0.98)' : 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.8)' : 'none',
          transition: 'background 0.35s, border-color 0.35s, box-shadow 0.35s',
        }}
      >
        {/* White accent line */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '35%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          {/* ── Logo ── */}
          <motion.div whileHover={{ y: -1 }} style={{ flexShrink: 0 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <motion.img src="/images/logo.png" alt="Vanguard" style={{ height: 34, width: 'auto' }} whileHover={{ scale: 1.06 }} />
              <div className="hidden sm:flex" style={{ flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff' }}>VANGUARD</span>
                <span style={{ fontSize: 7, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)' }}>ROLEPLAY</span>
              </div>
            </Link>
          </motion.div>

          {/* ── Desktop nav links ── */}
          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 32, flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <motion.div key={href} whileHover={{ y: -1 }} style={{ position: 'relative' }}>
                  <Link
                    href={href}
                    onClick={() => {
                      setMenuOpen(false);
                      setDesktopDashOpen(false);
                    }}
                    style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
                      textDecoration: 'none', color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.48)'; }}
                  >
                    {label}
                  </Link>
                  {active && (
                    <motion.div layoutId="navActive" style={{ position: 'absolute', bottom: -4, left: 0, right: 0, height: 2, borderRadius: 0, background: '#fff' }} />
                  )}
                </motion.div>
              );
            })}
          </nav>

          {/* ── Desktop right actions ── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10, flexShrink: 0, justifyContent: 'flex-end' }}>

            {/* Language */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, padding: 3, gap: 2 }}>
              {['en', 'si'].map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)} style={{
                  padding: '3px 9px', borderRadius: 0, border: 'none', cursor: 'pointer',
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
                  background: language === lang ? 'rgba(255,255,255,1)' : 'transparent',
                  color: language === lang ? '#000' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.2s',
                }}>
                  {lang === 'en' ? 'EN' : 'සිං'}
                </button>
              ))}
            </div>

            {/* Separator */}
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.07)' }} />

            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Desktop Dashboard button → opens dropdown */}
                <div ref={desktopDashRef} style={{ position: 'relative' }}>
                  <motion.button
                    onClick={() => setDesktopDashOpen(o => !o)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                      padding: '6px 14px 6px 7px',
                      background: desktopDashOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${desktopDashOpen ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: 0, transition: 'all 0.2s',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative' }}>
                      {session.user?.image ? (
                        <img src={session.user.image} alt="" style={{ width: 26, height: 26, borderRadius: 0, objectFit: 'cover', border: '1.5px solid #fff', display: 'block' }} />
                      ) : (
                        <div style={{ width: 26, height: 26, borderRadius: 0, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}><i className="fas fa-user" /></div>
                      )}
                      {/* Admin dot */}
                      {session.user?.role === 'admin' && (
                        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: 0, background: '#fff', border: '1.5px solid #000' }} />
                      )}
                      {/* Unread dot */}
                      {unread > 0 && session.user?.role !== 'admin' && (
                        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: 0, background: '#fff', border: '1.5px solid #000' }} />
                      )}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: desktopDashOpen ? '#fff' : 'rgba(255,255,255,0.75)' }}>
                        DASHBOARD
                      </p>
                      {unread > 0 && (
                        <p style={{ margin: 0, fontSize: 8, color: '#fff', fontWeight: 700 }}>{unread} notification{unread > 1 ? 's' : ''}</p>
                      )}
                    </div>
                    {/* Chevron */}
                    <motion.span
                      animate={{ rotate: desktopDashOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 2 }}
                    >
                      ▼
                    </motion.span>
                  </motion.button>

                  {desktopDashOpen && (
                    <DashboardMenu
                      session={session}
                      onClose={() => setDesktopDashOpen(false)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <motion.button
                onClick={() => signIn('discord')}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '8px 20px', fontSize: 10, fontWeight: 900, letterSpacing: '0.18em',
                  textTransform: 'uppercase', border: 'none', borderRadius: 0, cursor: 'pointer',
                  background: '#fff', color: '#000',
                  boxShadow: '0 4px 20px rgba(255,255,255,0.15)',
                }}
              >
                LOGIN WITH DISCORD
              </motion.button>
            )}

            {/* Discord */}
            <motion.a href="https://discord.gg/UK4e9QR6fN" target="_blank" rel="noreferrer"
              whileHover={{ y: -2, scale: 1.1 }}
              style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              <i className="fa-brands fa-discord" />
            </motion.a>
          </div>

          {/* ── Mobile right ── */}
          <div className="md:hidden flex" style={{ alignItems: 'center', gap: 8 }}>
            {session && (
              <div ref={mobileDashRef} style={{ position: 'relative' }}>
                <motion.button onClick={() => setMobileDashOpen(o => !o)} whileTap={{ scale: 0.95 }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div style={{ position: 'relative' }}>
                    {session.user?.image ? (
                      <img src={session.user.image} style={{ width: 32, height: 32, borderRadius: 0, objectFit: 'cover', border: '2px solid #fff' }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 0, background: 'rgba(255,255,255,0.1)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                    )}
                    {unread > 0 && <span style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 0, background: '#fff', border: '2px solid #000', fontSize: 7, fontWeight: 900, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread > 9 ? '9+' : unread}</span>}
                  </div>
                </motion.button>
                <AnimatePresence>
                  {mobileDashOpen && <DashboardMenu session={session} onClose={() => setMobileDashOpen(false)} />}
                </AnimatePresence>
              </div>
            )}

            <motion.button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              whileTap={{ scale: 0.95 }}
              style={{ width: 38, height: 38, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 0, cursor: 'pointer' }}
            >
              {[0, 1, 2].map(i => (
                <motion.span key={i}
                  animate={menuOpen ? { rotate: i === 0 ? 45 : i === 2 ? -45 : 0, y: i === 0 ? 6.5 : i === 2 ? -6.5 : 0, opacity: i === 1 ? 0 : 1 } : { rotate: 0, y: 0, opacity: 1 }}
                  style={{ display: 'block', width: 18, height: 1.5, background: 'rgba(255,255,255,0.65)', borderRadius: 0 }}
                />
              ))}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile slide-in drawer ── */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-[270px] z-50 bg-[#000]/98 border-l border-white/20 backdrop-blur-xl transition-transform duration-300 ease-out shadow-2xl ${menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Navigation</span>
          <button onClick={() => setMenuOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: 28, height: 28, borderRadius: 0, cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>

        <nav style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              padding: '11px 14px', borderRadius: 0, textDecoration: 'none',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
              background: pathname === href ? 'rgba(255,255,255,0.1)' : 'transparent',
              borderLeft: `2px solid ${pathname === href ? '#fff' : 'transparent'}`,
              color: pathname === href ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
            }}>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['en', 'si'].map(lang => (
              <button key={lang} onClick={() => setLanguage(lang)} style={{
                flex: 1, padding: '7px', borderRadius: 0, border: '1px solid',
                borderColor: language === lang ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.1)',
                background: language === lang ? '#fff' : 'transparent',
                color: language === lang ? '#000' : 'rgba(255,255,255,0.3)',
                fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', cursor: 'pointer',
              }}>
                {lang === 'en' ? 'EN' : 'සිං'}
              </button>
            ))}
          </div>
          {!session && (
            <button onClick={() => signIn('discord')} style={{ padding: '12px', borderRadius: 0, border: 'none', background: '#fff', color: '#000', fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Login with Discord
            </button>
          )}
        </div>
      </div>
    </>
  );
}
