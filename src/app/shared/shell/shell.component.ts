import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgFor } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavLink { label: string; icon: string; path: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, NgFor
  ],
  template: `
    <mat-sidenav-container class="shell-container">

      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <mat-icon>psychology</mat-icon>
          <span>FocusKids</span>
        </div>
        <mat-nav-list>
          <a mat-list-item
             *ngFor="let link of navLinks()"
             [routerLink]="link.path"
             routerLinkActive="active-link">
            <mat-icon matListItemIcon>{{ link.icon }}</mat-icon>
            <span matListItemTitle>{{ link.label }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span class="spacer"></span>
          <mat-icon style="margin-right:6px">account_circle</mat-icon>
          <span style="font-size:14px; margin-right:16px">
            {{ auth.userName() }} · {{ auth.userRol() }}
          </span>
          <button mat-icon-button (click)="auth.logout()" title="Cerrar sesión">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>

        <div class="content">
          <router-outlet />
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }

    .sidenav {
      width: 220px;
      background: #3f51b5;
      color: white;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      font-size: 18px;
      font-weight: 700;
      border-bottom: 1px solid rgba(255,255,255,0.15);
      color: white;
    }

    mat-nav-list a {
      color: rgba(255,255,255,0.85) !important;
      margin: 2px 8px;
      border-radius: 8px;
    }

    mat-nav-list a:hover,
    mat-nav-list a.active-link {
      background: rgba(255,255,255,0.15) !important;
      color: white !important;
    }

    .spacer { flex: 1; }

    .content {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background: #f5f5f5;
    }
  `]
})
export class ShellComponent {
  constructor(public auth: AuthService) {}

  navLinks = computed<NavLink[]>(() => {
    const rol = this.auth.userRol();
    switch (rol) {
      case 'ADMINISTRADOR': return [
        { label: 'Usuarios',    icon: 'people',       path: '/admin/usuarios' },
        { label: 'Logs',        icon: 'history',      path: '/admin/logs' },
      ];
      case 'PADRE': return [
        { label: 'Dashboard',   icon: 'dashboard',    path: '/padre/dashboard' },
        { label: 'Perfiles',    icon: 'child_care',   path: '/padre/perfiles' },
      ];
      case 'DOCENTE': return [
        { label: 'Dashboard',   icon: 'dashboard',    path: '/docente/dashboard' },
      ];
      default: return [];
    }
  });
}
