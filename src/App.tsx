/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { MapPin, Instagram, Mail, ChevronDown, Menu, X, Edit2, Save, Settings, Image as ImageIcon, Link as LinkIcon, LogIn, LogOut, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDocFromServer } from "firebase/firestore";

// --- Types ---
interface SiteConfig {
  heroImage: string;
  philosophyImage: string;
  spaceImages: {
    url: string;
    title: string;
    desc: string;
  }[];
  links: {
    naver: string;
    instagram: string;
    address: string;
    booking: string;
  };
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const DEFAULT_CONFIG: SiteConfig = {
  heroImage: "https://i.imgur.com/4OArESb.jpeg",
  philosophyImage: "https://search.pstatic.net/common/?src=https%3A%2F%2Fnaverbooking-phinf.pstatic.net%2F20240506_134%2F1714970017651uPwhc_JPEG%2Fimage.jpg",
  spaceImages: [
    {
      url: "https://search.pstatic.net/common/?src=https%3A%2F%2Fnaverbooking-phinf.pstatic.net%2F20240506_267%2F17149701258115suDK_JPEG%2Fimage.jpg",
      title: "거실",
      desc: "창밖 풍경이 그림이 되는 곳",
    },
    {
      url: "https://search.pstatic.net/common/?src=https%3A%2F%2Fldb-phinf.pstatic.net%2F20240508_257%2F1715098316392rn4mE_JPEG%2F1000037019.jpg",
      title: "따스한 온기",
      desc: "자쿠지 위로 흐르는 평온한 시간",
    },
    {
      url: "https://search.pstatic.net/common/?src=https%3A%2F%2Fnaverbooking-phinf.pstatic.net%2F20240506_122%2F1714970168400rOb02_JPEG%2Fimage.jpg",
      title: "공간의 미학",
      desc: "정갈하게 정돈된 스테이의 구석구석",
    },
  ],
  links: {
    naver: "https://naver.me/5Iib7icp",
    instagram: "https://www.instagram.com/bnrstay_official",
    address: "전남 보성군 복내면 원봉길 41-10",
    booking: "https://m.booking.naver.com/booking/3/bizes/1132296/items/5846165?area=bmp&lang=ko&map-search=1&service-target=map-pc&tab=book&theme=place",
  }
};

const SECTIONS = [
  { id: "hero", title: "Home" },
  { id: "booking", title: "예약하기", isExternal: true },
  { id: "philosophy", title: "머무름" },
  { id: "spaces", title: "공간" },
  { id: "location", title: "오시는 길" },
];

// --- Error Handling ---
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-serif mb-4">문제가 발생했습니다</h2>
            <p className="text-sm text-brand-ink/60 mb-6">사이트 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-brand-ink text-white rounded-full text-sm"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [editingItem, setEditingItem] = useState<{ type: string; key: string; index?: number } | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Simple admin check: if email matches the user's email
      if (currentUser?.email === "mincheol8764@gmail.com") {
        setIsAdmin(true);
        setShowAdminLogin(true);
      } else {
        setIsAdmin(false);
      }
    });

    // Check for admin mode in URL to show login button
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "true") {
      setShowAdminLogin(true);
    }

    return () => unsubscribe();
  }, []);

  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (newCount >= 5) {
      setShowAdminLogin(true);
      setLogoClickCount(0);
      // Also add to URL for persistence across refreshes if possible
      const url = new URL(window.location.href);
      url.searchParams.set('admin', 'true');
      window.history.replaceState({}, '', url);
    }
  };

  // Firestore Listener
  useEffect(() => {
    const configDoc = doc(db, "config", "main");
    
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onSnapshot(configDoc, (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as SiteConfig);
      } else {
        // If no config exists, use default but don't auto-save if not admin
        // This avoids permission errors on first load for non-admins
        setConfig(DEFAULT_CONFIG);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "config/main");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsAtTop(container.scrollTop < 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const saveConfig = async (newConfig: SiteConfig) => {
    if (!isAdmin) {
      console.warn("Unauthorized attempt to save config");
      return;
    }
    try {
      await setDoc(doc(db, "config", "main"), newConfig);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "config/main");
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleEdit = (type: string, key: string, currentVal: string, index?: number) => {
    setEditingItem({ type, key, index });
    setTempValue(currentVal);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    
    const newConfig = { ...config };
    if (editingItem.type === "image") {
      if (editingItem.key === "hero") newConfig.heroImage = tempValue;
      if (editingItem.key === "philosophy") newConfig.philosophyImage = tempValue;
      if (editingItem.key === "space" && editingItem.index !== undefined) {
        newConfig.spaceImages[editingItem.index].url = tempValue;
      }
    } else if (editingItem.type === "link") {
      if (editingItem.key === "naver") newConfig.links.naver = tempValue;
      if (editingItem.key === "instagram") newConfig.links.instagram = tempValue;
      if (editingItem.key === "address") newConfig.links.address = tempValue;
      if (editingItem.key === "booking") newConfig.links.booking = tempValue;
    }
    
    saveConfig(newConfig);
    setEditingItem(null);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const container = containerRef.current;
    const element = document.getElementById(id);
    if (container && element) {
      container.scrollTo({
        top: element.offsetTop,
        behavior: "smooth",
      });
    }
    setIsMenuOpen(false);
  };

  // Admin Overlay Component
  const AdminOverlay = ({ onEdit, label }: { onEdit: () => void; label: string }) => (
    isAdmin ? (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
        <div className="bg-white text-black px-4 py-2 rounded-full flex items-center gap-2 text-xs font-medium transform scale-90 group-hover:scale-100 transition-transform">
          <Edit2 size={14} />
          {label} 수정
        </div>
      </div>
    ) : null
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-xs tracking-[0.5em] text-brand-ink/40 font-serif uppercase"
        >
          BNRSTAY
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Admin Toggle & Login */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-2">
        {isAdmin ? (
          <div className="bg-brand-ink text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 text-xs font-medium">
            <Settings size={16} className="animate-spin-slow" />
            관리자 모드 활성화됨
            <button 
              onClick={handleLogout}
              className="ml-2 opacity-50 hover:opacity-100 flex items-center gap-1"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        ) : (
          showAdminLogin && (
            <button 
              onClick={handleLogin}
              className="bg-brand-ink text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <LogIn size={16} />
              관리자 로그인
            </button>
          )
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingItem(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-serif mb-6 flex items-center gap-3">
                {editingItem.type === 'image' ? <ImageIcon size={20} /> : <LinkIcon size={20} />}
                {editingItem.key.toUpperCase()} 수정
              </h3>
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  {editingItem.type === 'image' ? '이미지 URL' : '연결 주소'}
                </label>
                <textarea 
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-ink/5 min-h-[100px]"
                  placeholder="주소를 입력하세요..."
                />
                {editingItem.type === 'image' && tempValue && (
                  <div className="mt-4 rounded-lg overflow-hidden h-32 bg-gray-100">
                    <img src={tempValue} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex-2 py-3 bg-brand-ink text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  전체 적용 (저장)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6 text-white">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          <span className="text-xl font-serif tracking-[0.3em] font-light uppercase">BNRSTAY</span>
          <span className="text-[9px] tracking-[0.2em] font-serif opacity-80 -mt-1">복내리스테이</span>
        </motion.div>
        
        <div className="hidden md:flex gap-12 text-xs uppercase tracking-[0.2em] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {SECTIONS.map((section) => (
            section.isExternal ? (
              <div key={section.id} className="relative group">
                <a 
                  href={config.links.booking}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-50 transition-opacity text-brand-bg"
                >
                  {section.title}
                </a>
                {isAdmin && (
                  <button 
                    onClick={() => handleEdit("link", "booking", config.links.booking)}
                    className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-all"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
            ) : (
              <a 
                key={section.id} 
                href={`#${section.id}`}
                onClick={(e) => scrollToSection(e, section.id)}
                className="hover:opacity-50 transition-opacity"
              >
                {section.title}
              </a>
            )
          ))}
        </div>

        <button 
          className="md:hidden drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed inset-0 bg-brand-bg z-40 flex flex-col items-center justify-center gap-8"
        >
          {SECTIONS.map((section) => (
            section.isExternal ? (
              <a 
                key={section.id} 
                href={config.links.booking}
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl font-serif italic"
                onClick={() => setIsMenuOpen(false)}
              >
                {section.title}
              </a>
            ) : (
              <a 
                key={section.id} 
                href={`#${section.id}`}
                onClick={(e) => scrollToSection(e, section.id)}
                className="text-3xl font-serif italic"
              >
                {section.title}
              </a>
            )
          ))}
        </motion.div>
      )}

      <main className="snap-container" ref={containerRef}>
        {/* Hero Section */}
        <section id="hero" className="snap-section relative flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={config.heroImage} 
              alt="BNR stay Hero"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <AdminOverlay onEdit={() => handleEdit("image", "hero", config.heroImage)} label="배경 사진" />
            {/* Subtle top gradient for header visibility */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
          </motion.div>
          
          <div className="relative z-10 text-center text-white px-4">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xs tracking-[0.4em] mb-6 font-medium"
            >
              자연의 품속, 고요한 쉼
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer"
              onClick={(e) => {
                const container = containerRef.current;
                const element = document.getElementById("philosophy");
                if (container && element) {
                  container.scrollTo({
                    top: element.offsetTop,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <ChevronDown size={32} strokeWidth={1} />
            </motion.div>
          </div>

          <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden lg:block">
            <p className="writing-vertical text-[10px] tracking-[0.8em] text-white/50 font-serif">
              복내리스테이
            </p>
          </div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="snap-section bg-brand-bg flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 h-1/2 md:h-full p-12 md:p-24 flex flex-col justify-center pt-32 md:pt-40">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="max-w-md"
            >
              <span className="text-[10px] tracking-[0.5em] text-brand-muted/60 font-medium mb-12 block">
                01. 머무름 — STAY
              </span>
              <div className="h-px w-12 bg-brand-ink/10 mb-12" />
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 1 }}
                className="space-y-8"
              >
                <p className="text-sm text-brand-ink/80 leading-relaxed tracking-wide">
                  따뜻한 물에 몸을 담그고 창밖의 풍경을 바라보며,<br />
                  복내리의 고즈넉한 정취를 온전히 느껴보세요.
                </p>
                <p className="text-[11px] font-serif italic text-brand-ink/50 leading-loose tracking-[0.1em]">
                  물결의 일렁임과 함께 마음의 소란이 잦아드는 시간,<br />
                  오직 당신만을 위한 평온한 머무름이 시작됩니다.
                </p>
              </motion.div>
            </motion.div>
          </div>
          <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden relative">
            <img 
              src={config.philosophyImage} 
              alt="Interior Detail"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <AdminOverlay onEdit={() => handleEdit("image", "philosophy", config.philosophyImage)} label="철학 섹션 사진" />
          </div>
        </section>

        {/* Spaces Section - Horizontal Scroll or Grid */}
        <section id="spaces" className="snap-section bg-brand-bg py-24 px-8 md:px-24">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-[10px] tracking-[0.5em] text-brand-muted/60 font-medium mb-4 block">
                02. 공간
              </span>
            </div>
            <p className="hidden md:block text-xs tracking-widest text-brand-ink/40">
              스크롤하여 둘러보기
            </p>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 h-[60vh] md:h-[60vh] overflow-x-auto md:overflow-x-visible snap-x snap-mandatory no-scrollbar -mx-8 px-8 md:mx-0 md:px-0">
            {config.spaceImages.map((space, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="min-w-[85vw] md:min-w-0 group relative overflow-hidden rounded-sm snap-center"
              >
                <img 
                  src={space.url} 
                  alt={space.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <AdminOverlay onEdit={() => handleEdit("image", "space", space.url, idx)} label={`${space.title || '공간'} 사진`} />
                <div className="absolute inset-0 bg-black/20 opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-white pointer-events-none">
                  <h3 className="text-lg font-serif italic mb-2 tracking-tight">{space.title}</h3>
                  <p className="text-[9px] opacity-60 tracking-[0.1em] leading-relaxed">{space.desc}</p>
                </div>
                {/* Mobile Info Overlay - Always visible or visible on tap? Let's make it subtly visible on mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden flex flex-col justify-end p-6 text-white pointer-events-none">
                  <h3 className="text-base font-serif italic mb-1 tracking-tight">{space.title}</h3>
                  <p className="text-[8px] opacity-80 tracking-[0.05em]">{space.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Location & Contact */}
        <section id="location" className="snap-section bg-brand-ink text-brand-bg flex flex-col">
          <div className="flex-1 flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center">
              <span className="text-[10px] tracking-[0.5em] text-white/40 font-medium mb-10 block">
                03. 문의
              </span>
              
              <div className="space-y-10">
                <div className="flex items-start gap-6 relative group">
                  <MapPin className="mt-1 text-white/20" size={16} />
                  <div>
                    <p className="text-[9px] tracking-[0.4em] text-white/30 mb-2">주소</p>
                    <p className="text-sm tracking-tight whitespace-nowrap">{config.links.address}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleEdit("link", "address", config.links.address)} className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-all">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-6 relative group">
                  <Mail className="mt-1 text-white/20" size={16} />
                  <div>
                    <p className="text-[9px] tracking-[0.4em] text-white/30 mb-2">예약</p>
                    <a 
                      href={config.links.naver} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm tracking-tight hover:opacity-50 transition-opacity underline underline-offset-4 decoration-white/10"
                    >
                      네이버 예약하기
                    </a>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleEdit("link", "naver", config.links.naver)} className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-all">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-6 relative group">
                  <Instagram className="mt-1 text-white/20" size={16} />
                  <div>
                    <p className="text-[9px] tracking-[0.4em] text-white/30 mb-2">인스타</p>
                    <a 
                      href={config.links.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm tracking-tight hover:opacity-50 transition-opacity"
                    >
                      @bnrstay_official
                    </a>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleEdit("link", "instagram", config.links.instagram)} className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-all">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 h-64 md:h-full grayscale opacity-50 hover:grayscale-0 transition-all duration-1000">
              {/* Corrected Map for 전남 보성군 복내면 원봉길 41-10 */}
              <iframe 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(config.links.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`} 
                className="w-full h-full border-0"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          <footer className="p-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] tracking-[0.2em] text-white/30">
            <p>© 2024 BNR STAY — 복내리스테이. 모든 권리 보유.</p>
            <div className="flex gap-8 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-white transition-colors">이용약관</a>
            </div>
          </footer>
        </section>
      </main>

      {/* Vertical Rail Text */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-12 z-50">
        <div className="h-24 w-px bg-brand-ink/20" />
        <p className="writing-vertical text-[9px] tracking-[0.4em] text-brand-ink/40 font-medium">
          머무름의 미학
        </p>
        <div className="h-24 w-px bg-brand-ink/20" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
