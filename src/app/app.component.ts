import { Component, HostListener } from '@angular/core';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { ColorSchemeService } from '@shared/services/color-scheme.service';
import { Subscription } from 'rxjs';
import { AlertComponent } from './shared/components/providers/alert/alert.component';
import { LoaderComponent } from '@shared/components/providers/loader/loader.component';
import { LoaderService } from '@shared/services/loader.service';
import { ModalComponent } from "@shared/components/modal/modal.component";
import { ImageViewerModalComponent } from "./core/components/dashboard/image-viewer-modal/image-viewer-modal.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AlertComponent, LoaderComponent, ModalComponent, ImageViewerModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'datahub_app_v2';
  colorSchemeSubscription!: Subscription;

  constructor(
    private colorScheme: ColorSchemeService,
    private router: Router,
    private loader: LoaderService
  ) {}

  ngOnInit(): void {
    this.initColorScheme();
    // this.onRouteChangeLoader();
  }

  @HostListener('window:focus', ['$event'])
  onWindowFocus() {
    this.initColorScheme();
  }

  ngOnDestroy(): void {
    this.colorSchemeSubscription.unsubscribe();
  }

  // private onRouteChangeLoader() {
  //   this.router.events.subscribe((event) => {
  //     if (event instanceof NavigationStart) {
  //       this.loader.start();
  //     }
  //     if (event instanceof NavigationEnd) {
  //       this.loader.stop();
  //     }
  //   });
  // }

  private initColorScheme() {
    this.colorSchemeSubscription = this.colorScheme.init().subscribe();
  }
}
