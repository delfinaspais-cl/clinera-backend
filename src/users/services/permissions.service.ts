export interface Permisos {
  puedeGestionarCitas: boolean;
  puedeGestionarVentas: boolean;
  puedeGestionarPacientes: boolean;
  puedeGestionarProfesionales: boolean;
  puedeGestionarUsuarios: boolean;
  puedeGestionarTratamientosYEspecialidades: boolean;
  puedeGestionarSucursales: boolean;
}

export const PERMISOS_PREDEFINIDOS: Record<string, Permisos> = {
  ADMIN: {
    puedeGestionarCitas: true,
    puedeGestionarVentas: true,
    puedeGestionarPacientes: true,
    puedeGestionarProfesionales: true,
    puedeGestionarUsuarios: true,
    puedeGestionarTratamientosYEspecialidades: true,
    puedeGestionarSucursales: true,
  },
  SECRETARY: {
    puedeGestionarCitas: true,
    puedeGestionarVentas: true,
    puedeGestionarPacientes: true,
    puedeGestionarProfesionales: true,
    puedeGestionarUsuarios: true,
    puedeGestionarTratamientosYEspecialidades: true,
    puedeGestionarSucursales: true,
  },
  PROFESSIONAL: {
    puedeGestionarCitas: true,
    puedeGestionarVentas: true,
    puedeGestionarPacientes: true,
    puedeGestionarProfesionales: true,
    puedeGestionarUsuarios: true,
    puedeGestionarTratamientosYEspecialidades: true,
    puedeGestionarSucursales: true,
  },
};

export class PermissionsService {
  static getPermisosPorRol(role: string): Permisos {
    return PERMISOS_PREDEFINIDOS[role] || PERMISOS_PREDEFINIDOS.SECRETARY;
  }

  static getPermisosAsString(permisos: Permisos): string {
    return JSON.stringify(permisos);
  }

  static getPermisosFromString(permisosString: string): Permisos {
    try {
      return JSON.parse(permisosString);
    } catch {
      return PERMISOS_PREDEFINIDOS.SECRETARY;
    }
  }
}
