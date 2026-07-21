import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './core/components/navbar/navbar';
import { GlobalChatBubbleComponent } from './shared/components/global-chat-bubble/global-chat-bubble';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, GlobalChatBubbleComponent],
  templateUrl: './app.html'
})
export class App {
  private router = inject(Router);
  
  // hide global navbar if we are in admin or merchant sections, because they have their own layouts.
  get showNavbar(): boolean {
    const url = this.router.url;
    return !url.startsWith('/merchant') && !url.startsWith('/admin');
  }
}
