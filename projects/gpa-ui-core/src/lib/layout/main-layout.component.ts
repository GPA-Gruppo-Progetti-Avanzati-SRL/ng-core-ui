import { Component, signal, computed, ChangeDetectionStrategy , inject ,OnInit } from '@angular/core';
import { RouterOutlet, RouterLink,Router,NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SystemService } from '../system/system.service';
import { MenuNode } from '../system/system.models';
import { LIB_APP_ID } from '../tokens';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-main-layout',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatMenuModule,
    MatCardModule,
    RouterOutlet,
    RouterLink,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  private system = inject(SystemService);
  private router = inject(Router);
  private appId = inject(LIB_APP_ID);
  // false = collapsed (icons-only); true = expanded (icons + labels)
  whoami = this.system.whoamiSig;
  menuTree = this.system.menuTreeSig;
  apps = this.system.appsSig;
  currentAppId = this.appId;
  sidenavExpanded = signal(false);
  isExpanded = computed(() => this.sidenavExpanded());
  extraSidenavOpen = signal(false);

  currentPageTitle = computed(() => {
    const url = this.currentUrl();
    if (!url) return 'Enterprise App';
    const normalizedUrl = this.system.normalizePath(url);
    const nodes = this.menuTree();
    const activeNode = nodes?.find(n => this.endpointFor(n) === normalizedUrl);
    return activeNode?.description || activeNode?.id || 'Enterprise App';
  });

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  // MenuRoots già ordinati dal SystemService
  sortedMenuRoots = this.menuTree;

  endpointFor(n: MenuNode): string | null {
    return n.path ? this.system.normalizePath(n.path) : null;
  }
  isActive(n: MenuNode): boolean {
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
    this.system.bootstrap();
  }


}
