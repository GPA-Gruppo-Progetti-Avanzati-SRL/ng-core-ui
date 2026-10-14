import {ToastComponent} from '../../components/toast.component/toast.component';
import {LoadingOverlayComponent} from '../../components/loading-overlay.component/loading-overlay.component';

import {
  Component,
  signal,
  computed,
  afterRenderEffect,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  ElementRef,
  ViewEncapsulation
} from '@angular/core';
import { IsActiveMatchOptions, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { PathNode } from '../../system/system.models';
import { SystemService } from '../../system/system.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import {ErrorPage} from '../../pages/error.page';
import {AppSwitcherComponent} from '../app-switcher/app-switcher.component';
import {CoreLabelsService} from '../../system/labels.service';

@Component({
  selector: 'core-full-layout',
  imports: [
    MatButtonModule,
    ToastComponent,
    LoadingOverlayComponent,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    MatListModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ErrorPage,
    AppSwitcherComponent,
  ],
  templateUrl: './full-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui block h-screen bg-surface text-on-surface' },
})
export class FullLayoutComponent {

  private system: SystemService = inject(SystemService);

  private readonly sidenavRef = viewChild<ElementRef<HTMLElement>>('sidenav');

  whoami = this.system.whoami;
  environment = this.system.environment;
  menuTree = this.system.menuTree;
  layoutState = this.system.layoutState;
  protected readonly t = inject(CoreLabelsService).labels;
  sidenavExpanded = signal(false);
  isExpanded = computed(() => this.sidenavExpanded());
  extraSidenavOpen = signal(false);

  currentPageTitle = this.system.currentPageTitle;
  sortedMenuRoots = this.menuTree;

  constructor() {
    // Re-measure when menu items change (e.g. after bootstrap)
    afterRenderEffect(() => {
      const menu = this.menuTree();
      if (menu && menu.length > 0) {
        this.measureSidenavWidth();
      }
    });
  }


  endpointFor(n: PathNode): string | null {
    return n.endpoint ? this.system.normalizePath(n.endpoint) : null;
  }

  /**
   * Voce attiva anche sulle sotto-pagine e con query string (`/users` resta attiva su
   * `/users/edit/1?tab=2`); la root `/` solo in modo esatto, altrimenti sarebbe sempre attiva.
   */
  activeOptions(n: PathNode): IsActiveMatchOptions {
    return {
      paths: this.endpointFor(n) === '/' ? 'exact' : 'subset',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    };
  }

  toggleSidenav(): void {
    this.sidenavExpanded.update(v => !v);
  }

  openExtraSidenav(): void {
    this.extraSidenavOpen.set(true);
  }

  closeExtraSidenav(): void {
    this.extraSidenavOpen.set(false);
  }

  /**
   * Misura la larghezza naturale dell'aside (label visibili) senza causare flash visivi.
   * Tutte le mutazioni DOM avvengono in modo sincrono prima del prossimo paint.
   */
  private measureSidenavWidth(): void {
    const aside = this.sidenavRef()?.nativeElement;
    if (!aside) return;

    const wasCollapsed = aside.classList.contains('collapsed');

    // Disabilita transizione e porta l'aside allo stato espanso per misurare
    aside.style.transition = 'none';
    aside.style.width = 'max-content';
    if (wasCollapsed) aside.classList.remove('collapsed');

    // Le label mantengono la classe .hidden (binding Angular) anche durante la misura:
    // occorre resettarle temporaneamente per ottenere la larghezza naturale del testo
    const hiddenLabels = aside.querySelectorAll<HTMLElement>('.label.hidden');
    hiddenLabels.forEach(l => {
      l.style.width = 'auto';
      l.style.overflow = 'visible';
      l.style.marginLeft = '12px';
      l.style.paddingRight = '16px';
    });

    const measuredWidth = aside.scrollWidth;

    // Ripristina label
    hiddenLabels.forEach(l => {
      l.style.width = '';
      l.style.overflow = '';
      l.style.marginLeft = '';
      l.style.paddingRight = '';
    });

    // Ripristina aside (prima del paint — stesso task sincrono)
    aside.style.width = '';
    if (wasCollapsed) aside.classList.add('collapsed');

    // Riabilita la transizione nel prossimo microtask
    Promise.resolve().then(() => { aside.style.transition = ''; });

    if (measuredWidth > 72) {
      aside.style.setProperty('--layout-sidenav-expanded-width', `${measuredWidth + 28}px`);
    }
  }
}
