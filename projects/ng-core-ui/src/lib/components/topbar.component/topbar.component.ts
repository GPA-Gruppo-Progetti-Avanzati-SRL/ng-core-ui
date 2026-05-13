import { Component, input} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

export interface TopbarAction {
  icon:    string;
  label:   string;
  onClick: () => void;
}

@Component({
  selector: 'core-topbar',
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './topbar.component.html',
  host: { class: 'ui' },
})

export class TopbarComponent {
  readonly title       = input<string>('');
  readonly description = input<string>('');
  readonly actions     = input<TopbarAction[]>([]);
}
