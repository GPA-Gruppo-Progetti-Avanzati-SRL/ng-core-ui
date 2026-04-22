import {ToastComponent} from '../../components/toast.component/toast.component';

declare const AppSha: string;
declare const AppVersion: string;

import {
  Component,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  ViewChild,
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
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import {ConfirmComponent} from '../../components/confirm.component/confirm.component';
import {AlertComponent} from '../../components/alert.component/alert.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    MatButtonModule,
    ToastComponent,
    ConfirmComponent,
    AlertComponent,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatDividerModule,
    RouterOutlet,
    RouterLink,
  ],
  templateUrl: './main-layout.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class MainLayoutComponent implements OnInit {

  private router: Router = inject(Router);
  private system: SystemService = inject(SystemService);

  @ViewChild('sidenav') private sidenavRef!: ElementRef<HTMLElement>;

  whoami = this.system.whoamiSig;
  environment = this.system.environmentSig;
  menuTree = this.system.menuTreeSig;
  apps = this.system.appsSig;
  currentAppId = computed(() => this.environment()?.appId || '');
  appSha = computed(() => AppSha);
  appVersion = computed(() => AppVersion);
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
    effect(() => {
      const menu = this.menuTree();
      if (menu && menu.length > 0) {
        setTimeout(() => this.measureSidenavWidth(), 0);
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

  ngOnInit(): void {
    this.system.bootstrap().catch(err => console.error('Bootstrap error in MainLayout', err));
  }

  /**
   * Misura la larghezza naturale dell'aside (label visibili) senza causare flash visivi.
   * Tutte le mutazioni DOM avvengono in modo sincrono prima del prossimo paint.
   */
  private measureSidenavWidth(): void {
    const aside = this.sidenavRef?.nativeElement;
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
