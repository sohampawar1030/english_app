import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [xp, setXp] = useState(() => {
    const saved = localStorage.getItem('xp');
    return saved ? Number(saved) : 0;
  });
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('coins');
    return saved ? Number(saved) : 0;
  });
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('level');
    return saved ? Number(saved) : 1;
  });
  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('streak');
    return saved ? Number(saved) : 0;
  });
  const [hearts, setHearts] = useState(() => {
    const saved = localStorage.getItem('hearts');
    return saved ? Number(saved) : 5;
  });

  const persistAndSet = (key, setter) => (value) => {
    const resolved = typeof value === 'function' ? value : value;
    const newValue = typeof value === 'function'
      ? value
      : value;
    setter((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem(key, String(next));
      return next;
    });
  };

  const addXp = useCallback((amount) => {
    setXp((prev) => {
      const next = prev + amount;
      localStorage.setItem('xp', String(next));
      return next;
    });
  }, []);

  const addCoins = useCallback((amount) => {
    setCoins((prev) => {
      const next = prev + amount;
      localStorage.setItem('coins', String(next));
      return next;
    });
  }, []);

  const spendCoins = useCallback((amount) => {
    setCoins((prev) => {
      const next = Math.max(0, prev - amount);
      localStorage.setItem('coins', String(next));
      return next;
    });
  }, []);

  const levelUp = useCallback(() => {
    setLevel((prev) => {
      const next = prev + 1;
      localStorage.setItem('level', String(next));
      return next;
    });
  }, []);

  const updateStreak = useCallback((value) => {
    setStreak(() => {
      localStorage.setItem('streak', String(value));
      return value;
    });
  }, []);

  const useHeart = useCallback(() => {
    setHearts((prev) => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem('hearts', String(next));
      return next;
    });
  }, []);

  const refillHearts = useCallback(() => {
    setHearts(() => {
      localStorage.setItem('hearts', '5');
      return 5;
    });
  }, []);

  const syncProfile = useCallback((profile) => {
    if (!profile) return;
    if (profile.total_xp != null) {
      setXp(Number(profile.total_xp));
      localStorage.setItem('xp', String(profile.total_xp));
    }
    if (profile.current_streak != null) {
      setStreak(Number(profile.current_streak));
      localStorage.setItem('streak', String(profile.current_streak));
    }
    if (profile.level != null) {
      setLevel(Number(profile.level));
      localStorage.setItem('level', String(profile.level));
    }
    if (profile.coins != null) {
      setCoins(Number(profile.coins));
      localStorage.setItem('coins', String(profile.coins));
    }
  }, []);

  const resetProgress = useCallback(() => {
    setXp(0);
    setCoins(0);
    setLevel(1);
    setStreak(0);
    setHearts(5);
    localStorage.removeItem('xp');
    localStorage.removeItem('coins');
    localStorage.removeItem('level');
    localStorage.removeItem('streak');
    localStorage.removeItem('hearts');
  }, []);

  return (
    <AppContext.Provider value={{
      xp, coins, level, streak, hearts,
      addXp, addCoins, spendCoins, levelUp,
      updateStreak, useHeart, refillHearts, resetProgress, syncProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
