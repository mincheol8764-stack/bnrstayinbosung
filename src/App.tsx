/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform } from "motion/react";
import { MapPin, Instagram, Mail, ChevronDown, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const SECTIONS = [
  { id: "hero", title: "Home" },
  { id: "philosophy", title: "머무름" },
  { id: "spaces", title: "공간" },
  { id: "location", title: "오시는 길" },
];

const SPACE_IMAGES = [
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
    title: "",
    desc: "",
  },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsAtTop(container.scrollTop < 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <div className="relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6 text-white">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          <span className="text-xl font-serif tracking-[0.3em] font-light uppercase">BNRSTAY</span>
          <span className="text-[9px] tracking-[0.2em] font-serif opacity-80 -mt-1">복내리스테이</span>
        </motion.div>
        
        <div className="hidden md:flex gap-12 text-xs uppercase tracking-[0.2em] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {SECTIONS.map((section) => (
            <a 
              key={section.id} 
              href={`#${section.id}`}
              onClick={(e) => scrollToSection(e, section.id)}
              className="hover:opacity-50 transition-opacity"
            >
              {section.title}
            </a>
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
            <a 
              key={section.id} 
              href={`#${section.id}`}
              onClick={(e) => scrollToSection(e, section.id)}
              className="text-3xl font-serif italic"
            >
              {section.title}
            </a>
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
              src="https://i.imgur.com/4OArESb.jpeg" 
              alt="BNR stay Hero"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
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

          <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:block">
            <p className="writing-vertical text-[10px] tracking-[0.8em] text-white/50 font-serif">
              복내리스테이
            </p>
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
            <p className="writing-vertical text-[10px] tracking-[0.5em] text-white/50 font-medium">
              2024년 시작 — 전통의 재해석
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
          <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
            <img 
              src="https://search.pstatic.net/common/?src=https%3A%2F%2Fnaverbooking-phinf.pstatic.net%2F20240506_134%2F1714970017651uPwhc_JPEG%2Fimage.jpg" 
              alt="Interior Detail"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[60vh]">
            {SPACE_IMAGES.map((space, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="group relative overflow-hidden rounded-sm"
              >
                <img 
                  src={space.url} 
                  alt={space.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-white">
                  <h3 className="text-lg font-serif italic mb-2 tracking-tight">{space.title}</h3>
                  <p className="text-[9px] opacity-60 tracking-[0.1em] leading-relaxed">{space.desc}</p>
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
                <div className="flex items-start gap-6">
                  <MapPin className="mt-1 text-white/20" size={16} />
                  <div>
                    <p className="text-[9px] tracking-[0.4em] text-white/30 mb-2">주소</p>
                    <p className="text-sm tracking-tight whitespace-nowrap">전남 보성군 복내면 원봉길 41-10</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <Mail className="mt-1 text-white/20" size={16} />
                  <div>
                    <p className="text-[9px] tracking-[0.4em] text-white/30 mb-2">예약</p>
                    <a 
                      href="https://naver.me/5Iib7icp" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm tracking-tight hover:opacity-50 transition-opacity underline underline-offset-4 decoration-white/10"
                    >
                      네이버 예약하기
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <Instagram className="mt-1 text-white/20" size={16} />
                  <div>
                    <p className="text-[9px] tracking-[0.4em] text-white/30 mb-2">인스타</p>
                    <a 
                      href="https://www.instagram.com/bnrstay_official" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm tracking-tight hover:opacity-50 transition-opacity"
                    >
                      @bnrstay_official
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 h-64 md:h-full grayscale opacity-50 hover:grayscale-0 transition-all duration-1000">
              {/* Corrected Map for 전남 보성군 복내면 원봉길 41-10 */}
              <iframe 
                src="https://maps.google.com/maps?q=전남%20보성군%20복내면%20원봉길%2041-10&t=&z=16&ie=UTF8&iwloc=&output=embed" 
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
