import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'test-tailwind-card',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './tailwind.component.html',
})
export class TwwComponent {
}
