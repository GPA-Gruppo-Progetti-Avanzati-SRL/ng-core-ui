import {ToastComponent} from '../../components/toast.component/toast.component';
import {LoadingOverlayComponent} from '../../components/loading-overlay.component/loading-overlay.component';

declare const AppSha: string;
declare const AppVersion: string;

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
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { PathNode } from '../../system/system.models';
import { SystemService } from '../../system/system.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import {ConfirmComponent} from '../../components/confirm.component/confirm.component';
import {AlertComponent} from '../../components/alert.component/alert.component';
import {ErrorPage} from '../../pages/error.page';

@Component({
  selector: 'app-main-layout',
  imports: [
    MatButtonModule,
    ToastComponent,
    ConfirmComponent,
    AlertComponent,
    LoadingOverlayComponent,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatDividerModule,
    RouterOutlet,
    RouterLink,
    ErrorPage
  ],
  templateUrl: './main-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui block h-screen bg-surface text-on-surface' },
})
export class MainLayoutComponent {

  private router: Router = inject(Router);
  private system: SystemService = inject(SystemService);

  private readonly sidenavRef = viewChild<ElementRef<HTMLElement>>('sidenav');

  whoami = this.system.whoami;
  environment = this.system.environment;
  menuTree = this.system.menuTree;
  apps = this.system.apps;
  currentAppId = computed(() => this.environment()?.appId || '');
  readonly appSha = AppSha;
  readonly appVersion = AppVersion;
  layoutState = this.system.layoutState;
  sidenavExpanded = signal(false);
  isExpanded = computed(() => this.sidenavExpanded());
  extraSidenavOpen = signal(false);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  currentPageTitle = computed(() => this.environment()?.appDescription || 'Enterprise App');
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

  isActive(n: PathNode): boolean {
    return this.endpointFor(n) === this.currentUrl();
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
