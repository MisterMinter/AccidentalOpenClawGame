declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
  };
  BackButton: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
}

class TelegramBridge {
  private webapp: TelegramWebApp | null = null;
  private _isTelegram = false;

  get isTelegram(): boolean {
    return this._isTelegram;
  }

  get user() {
    return this.webapp?.initDataUnsafe?.user ?? null;
  }

  get initData(): string {
    return this.webapp?.initData ?? '';
  }

  init(): void {
    try {
      const wa = window.Telegram?.WebApp;
      if (wa && wa.initData && wa.initData.length > 0) {
        this.webapp = wa;
        this._isTelegram = true;
        wa.ready();
        wa.expand();
        try { wa.setHeaderColor('#1a1a2e'); } catch {}
        try { wa.setBackgroundColor('#1a1a2e'); } catch {}
        try { wa.enableClosingConfirmation(); } catch {}
      }
    } catch {
      this._isTelegram = false;
    }
  }

  haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
    try { this.webapp?.HapticFeedback?.impactOccurred(style); } catch {}
  }

  hapticNotify(type: 'error' | 'success' | 'warning'): void {
    try { this.webapp?.HapticFeedback?.notificationOccurred(type); } catch {}
  }

  showBackButton(callback: () => void): void {
    if (!this.webapp) return;
    try {
      this.webapp.BackButton.show();
      this.webapp.BackButton.onClick(callback);
    } catch {}
  }

  hideBackButton(): void {
    this.webapp?.BackButton.hide();
  }

  close(): void {
    this.webapp?.close();
  }
}

export const telegram = new TelegramBridge();
