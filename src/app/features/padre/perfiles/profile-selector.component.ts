import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChildProfile, ChildProfileRequest, AVATAR_EMOJIS } from './child-profile.model';
import { ChildProfileService } from './child-profile.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-selector.component.html',
  styleUrls: ['./profile-selector.component.css']
})
export class ProfileSelectorComponent implements OnInit {

  profiles: ChildProfile[] = [];
  isLoading = true;
  errorMessage = '';

  showProfileModal = false;
  isEditing = false;
  selectedProfile: ChildProfile | null = null;
  profileForm: ChildProfileRequest = { name: '', avatar: 'fox', edad: null, condicion: null };
  availableAvatars = AVATAR_EMOJIS;
  formError = '';

  showDeleteModal = false;
  profileToDelete: ChildProfile | null = null;

  constructor(
    private profileService: ChildProfileService,
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  private get padreId(): number {
    return this.auth.user()!.usuarioId;
  }

  ngOnInit(): void { this.loadProfiles(); }

  loadProfiles(): void {
    this.isLoading = true;
    this.profileService.getProfiles(this.padreId).subscribe({
      next: (p) => { this.profiles = p; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.errorMessage = 'No se pudieron cargar los perfiles.'; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  onSelectProfile(profile: ChildProfile): void {
    if (!profile.active) return;
    this.profileService.switchProfile(profile.id, this.padreId).subscribe({
      next: () => this.router.navigate(['/padre/dashboard']),
      error: () => { this.errorMessage = 'No se pudo cambiar el perfil.'; }
    });
  }

  openCreateModal(): void {
    this.isEditing = false; this.selectedProfile = null;
    this.profileForm = { name: '', avatar: 'fox', edad: null, condicion: null };
    this.formError = '';
    this.showProfileModal = true;
  }

  openEditModal(profile: ChildProfile, event: Event): void {
    event.stopPropagation();
    this.isEditing = true; this.selectedProfile = profile;
    this.profileForm = { name: profile.name, avatar: profile.avatar, edad: profile.edad, condicion: profile.condicion };
    this.formError = '';
    this.showProfileModal = true;
  }

  onSelectAvatar(avatar: string): void { this.profileForm.avatar = avatar; }

  saveProfile(): void {
    if (!this.profileForm.name.trim()) { this.formError = 'El nombre es obligatorio.'; return; }
    const req: ChildProfileRequest = {
      name: this.profileForm.name.trim(),
      avatar: this.profileForm.avatar,
      edad: this.profileForm.edad,
      condicion: this.profileForm.condicion?.trim() || null
    };
    if (this.isEditing && this.selectedProfile) {
      this.profileService.updateProfile(this.selectedProfile.id, req, this.padreId).subscribe({
        next: () => { this.showProfileModal = false; this.loadProfiles(); },
        error: (e) => { this.formError = e.error?.message || 'Error al guardar.'; }
      });
    } else {
      this.profileService.createProfile(req, this.padreId).subscribe({
        next: () => { this.showProfileModal = false; this.loadProfiles(); },
        error: (e) => { this.formError = e.error?.message || 'Error al crear el perfil.'; }
      });
    }
  }

  toggleStatus(profile: ChildProfile, event: Event): void {
    event.stopPropagation();
    this.profileService.toggleStatus(profile.id, this.padreId).subscribe({
      next: () => this.loadProfiles(),
      error: () => { this.errorMessage = 'Error al cambiar el estado.'; }
    });
  }

  openDeleteModal(profile: ChildProfile, event: Event): void {
    event.stopPropagation(); this.profileToDelete = profile; this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.profileToDelete) return;
    this.profileService.deleteProfile(this.profileToDelete.id, this.padreId).subscribe({
      next: () => { this.showDeleteModal = false; this.profileToDelete = null; this.loadProfiles(); },
      error: () => { this.errorMessage = 'Error al eliminar.'; this.showDeleteModal = false; }
    });
  }

  cancelDelete(): void { this.showDeleteModal = false; this.profileToDelete = null; }
  closeModal(): void { this.showProfileModal = false; }

  formatLastPlayed(dateStr: string | null): string {
    if (!dateStr) return 'Nunca jugado';
    return new Date(dateStr).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
