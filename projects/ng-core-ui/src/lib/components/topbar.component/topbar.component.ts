import { Component, input } from '@angular/core';

@Component({
  selector: 'core-topbar',
  imports: [],
  templateUrl: './topbar.component.html',
  host: { class: 'ui' },
})
export class TopbarComponent {
  readonly title       = input<string>('');
  readonly description = input<string>('');
}