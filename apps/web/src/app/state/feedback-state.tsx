import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';

type FeedbackTone = 'success' | 'error' | 'info';

type FeedbackItem = {
  id: number;
  tone: FeedbackTone;
  message: string;
};

type FeedbackState = {
  items: FeedbackItem[];
  notify: (tone: FeedbackTone, message: string) => void;
  dismiss: (id: number) => void;
};

const FeedbackContext = createContext<FeedbackState | null>(null);

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const sequence = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((tone: FeedbackTone, message: string) => {
    const id = sequence.current++;
    setItems((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ items, notify, dismiss }), [dismiss, items, notify]);

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used within FeedbackProvider');
  return context;
}
