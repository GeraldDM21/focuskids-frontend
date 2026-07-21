// Estructura de datos de un perfil de nino que viene del backend
export interface ChildProfile {
  id: number;
  nombre: string;
  avatar: string;
  edad: number | null;
  diagnostico: string | null;
  activo: boolean;
  docente?: {
    id: number;
    usuario?: { nombre?: string; email?: string; };
    institucion?: string;
    gradoGrupo?: string;
  } | null;
}

// Datos que se envian al backend para crear o editar un perfil
export interface ChildProfileRequest {
  nombre: string;
  avatar: string;
  edad: number | null;
  diagnostico: string | null;
}

// Guarda cual es el perfil de nino que esta activo en este momento
export interface ActiveProfileState {
  profileId: number | null;
  profileName: string | null;
  profileAvatar: string | null;
}

// Lista de avatares disponibles para elegir al crear un perfil
export const AVATAR_EMOJIS: string[] = [
  'fox','frog','lion','panda','koala','unicorn','dog','cat','rabbit','tiger','bear','mouse'
];
