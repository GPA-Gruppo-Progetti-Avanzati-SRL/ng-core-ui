import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StyleManagerService {
  private readonly document: Document = inject(DOCUMENT);
  private readonly body: HTMLElement = this.document.body;
  private readonly knownThemes: string[] = ['gpa', 'cobalt', 'forest'];

  /**
   * Applies the specified theme class to the body and removes other known themes.
   */
  setTheme(themeName: string | null | undefined): void {
    // Remove all previous known theme classes
    this.knownThemes.forEach(theme => this.body.classList.remove(theme));

    // Apply the new theme if it's one of the known ones
    if (themeName && this.knownThemes.includes(themeName)) {
      this.body.classList.add(themeName);
    }
  }

  /**
   * Get the current theme applied to the body if any.
   */
  getTheme(): string | null {
    return this.knownThemes.find(theme => this.body.classList.contains(theme)) || null;
  }
}
