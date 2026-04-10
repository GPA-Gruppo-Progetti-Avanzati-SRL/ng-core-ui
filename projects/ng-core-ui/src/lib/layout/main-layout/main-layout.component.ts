declare const AppSha: string;
declare const AppVersion: string;

import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { RouterOutlet, RouterLink,Router,NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { PathNode } from '../../system/system.models';
import {SystemService} from '../../system/system.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-main-layout',
  imports: [
    MatButtonModule,
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
  styleUrls: ['./main-layout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class MainLayoutComponent implements OnInit {

  private router :Router = inject(Router);

  private system :SystemService = inject(SystemService);

  // false = collapsed (icons-only); true = expanded (icons + labels)
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
    { initialValue: this.router.url}
  );

  currentPageTitle = computed(() => this.environment()?.appDescription || 'Enterprise App');

  // MenuRoots già ordinati dal SystemService
  sortedMenuRoots = this.menuTree;

  endpointFor(n: PathNode): string | null {
    return n.path ? this.system.normalizePath(n.path) : null;
  }
  isActive(n: PathNode): boolean {
    return this.endpointFor(n) === this.currentUrl();
  }

  toggleSidenav() {
    this.sidenavExpanded.update(v => !v);
  }

  openExtraSidenav() {
    this.extraSidenavOpen.set(true);
  }

  closeExtraSidenav() {
    this.extraSidenavOpen.set(false);
  }
  ngOnInit() {
    // Il bootstrap viene già gestito dal MenuGuard se la rotta è protetta.
    // Chiamarlo qui assicura che venga eseguito anche se la guardia non dovesse scattare,
    // ma SystemService.bootstrap ora previene esecuzioni multiple.
    this.system.bootstrap().catch(err => console.error('Bootstrap error in MainLayout', err));
  }


}
