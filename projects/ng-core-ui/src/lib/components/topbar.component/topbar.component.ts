import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'core-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  host: { class: 'ui' },
})
export class TopbarComponent {
  @Input() title: string = '';
  @Input() description: string = '';
}
