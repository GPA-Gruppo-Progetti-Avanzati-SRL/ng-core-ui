import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'core-card',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class CardComponent {
  @Input() title: string = '';
  @Input() subtitle?: string = '';
  @Input() icon: string = 'info';
  @Input() buttonLabel: string = 'Procedi';
  @Input() buttonAction: () => void = () => {};
}
