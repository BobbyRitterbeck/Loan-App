import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BehaviorTrackingService } from './services/behavior-tracking.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(private readonly behaviorTrackingService: BehaviorTrackingService) {
    this.behaviorTrackingService.initialize();
  }
}
