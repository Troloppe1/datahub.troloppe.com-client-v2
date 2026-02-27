import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContainerComponent } from '@shared/components/container/container.component';
import { NavbarComponent } from '../../core/components/auth/navbar/navbar.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterModule, ContainerComponent, NavbarComponent],
  template: ` <div class="app-layout bg-base-300">
    <auth-navbar></auth-navbar>
    <app-container clx="grow flex flex-col justify-center">
      <router-outlet></router-outlet>
    </app-container>
    <footer class="py-2 text-xs text-text-color lg:text-sm text-center mt-5 font-semibold text-base-content/70">
      &copy; {{ currentYear }}, Troloppe Property Services. All Rights Reserved.
    </footer>
  </div>`,
})
export class AuthLayoutComponent {currentYear = new Date().getFullYear();
}
