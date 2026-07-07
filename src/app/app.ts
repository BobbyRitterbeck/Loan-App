import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { KeystrokeTrackingService } from './services/TS-services/keystroke-tracking.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(private readonly keystrokeTrackingService: KeystrokeTrackingService) {
    this.keystrokeTrackingService.initialize();
  }
}
