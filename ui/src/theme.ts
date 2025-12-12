import type { ThemeOptions } from './types.js';
import { Theme } from './types.js';
import { readStoredThemePreference, persistThemePreference } from './utils.js';
import { CSS_CLASSES } from './constants.js';

class ThemeManager {
  private currentTheme: Theme = Theme.DAY;
  private themeToggleButton: HTMLButtonElement | null = null;
  private themeToggleText: HTMLElement | null = null;

  initialize(
    themeToggleButton: HTMLButtonElement | null,
    themeToggleText: HTMLElement | null
  ): void {
    this.themeToggleButton = themeToggleButton;
    this.themeToggleText = themeToggleText;

    const storedTheme = readStoredThemePreference();
    if (storedTheme && Object.values(Theme).includes(storedTheme as Theme)) {
      this.setTheme(storedTheme as Theme, { skipPersist: true });
    } else {
      this.setTheme(Theme.AUTO, { skipPersist: true });
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === Theme.AUTO) {
        this.applyTheme(Theme.AUTO);
      }
    });
  }

  toggle(): void {
    const themeOrder = [Theme.AUTO, Theme.DAY, Theme.NIGHT];
    const currentIndex = themeOrder.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    this.setTheme(themeOrder[nextIndex]!);
  }

  setTheme(theme: Theme, options: ThemeOptions = {}): void {
    const validTheme = Object.values(Theme).includes(theme) ? theme : Theme.AUTO;
    this.currentTheme = validTheme;
    this.applyTheme(validTheme);

    if (!options.skipPersist) {
      persistThemePreference(validTheme);
    }
  }

  private applyTheme(theme: Theme): void {
    let isDark = false;
    let label = 'Auto';

    if (theme === Theme.AUTO) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      label = 'Auto';
    } else if (theme === Theme.NIGHT) {
      isDark = true;
      label = 'Night';
    } else {
      isDark = false;
      label = 'Day';
    }

    document.body.classList.toggle(CSS_CLASSES.themeDark, isDark);

    if (this.themeToggleButton) {
      this.themeToggleButton.setAttribute('data-theme', theme);
      this.themeToggleButton.setAttribute('aria-pressed', String(isDark));
      
      const nextTheme = theme === Theme.AUTO 
        ? Theme.DAY 
        : (theme === Theme.DAY ? Theme.NIGHT : Theme.AUTO);
      const nextLabel = nextTheme === Theme.AUTO 
        ? 'auto' 
        : (nextTheme === Theme.DAY ? 'day' : 'night');
      
      this.themeToggleButton.setAttribute(
        'aria-label',
        `Switch to ${nextLabel} theme`
      );
    }

    if (this.themeToggleText) {
      this.themeToggleText.textContent = label;
    }
  }

  getCurrentTheme(): Theme {
    return this.currentTheme;
  }
}

export const themeManager = new ThemeManager();