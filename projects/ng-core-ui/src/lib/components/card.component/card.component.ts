import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
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
  @Output() buttonClick = new EventEmitter<void>();
}
