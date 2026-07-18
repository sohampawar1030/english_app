import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';

export function MainLayout({ children }) {
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#07070A]">
      <div className="anim-bg" />

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar mobileSidebar={false} onClose={() => {}} />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebar(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
            >
              <Sidebar mobileSidebar onClose={() => setMobileSidebar(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileSidebar(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
