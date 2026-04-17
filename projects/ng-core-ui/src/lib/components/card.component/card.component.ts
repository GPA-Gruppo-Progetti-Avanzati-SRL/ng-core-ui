import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  selector: 'core-card',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './card.component.html',
  host: { class: 'ui' },
})
export class CardComponent {
  @Input() title: string = '';
  @Input() subtitle?: string = '';
  @Input() icon: string = 'info';
  @Input() buttonLabel: string = 'Procedi';
  @Output() buttonClick = new EventEmitter<void>();

  isSubtitleTooltipDisabled(el: HTMLElement): boolean {
    return el.scrollHeight <= el.clientHeight;
  }
}
