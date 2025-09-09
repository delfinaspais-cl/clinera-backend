export interface Permisos {
  // Permisos generales
  puedeVerDashboard: boolean;
  puedeGestionarUsuarios: boolean;
  puedeGestionarClinica: boolean;
  
  // Permisos de ventas
  puedeVerVentas: boolean;
  puedeCrearVentas: boolean;
  puedeEditarVentas: boolean;
  puedeEliminarVentas: boolean;
  
  // Permisos de turnos
  puedeVerTurnos: boolean;
  puedeCrearTurnos: boolean;
  puedeEditarTurnos: boolean;
  puedeCancelarTurnos: boolean;
  
  // Permisos de pacientes
  puedeVerPacientes: boolean;
  puedeCrearPacientes: boolean;
  puedeEditarPacientes: boolean;
  puedeEliminarPacientes: boolean;
  
  // Permisos de reportes
  puedeVerReportes: boolean;
  puedeExportarDatos: boolean;
  
  // Permisos de configuración
  puedeConfigurarSistema: boolean;
  puedeGestionarSucursales: boolean;
  puedeGestionarTratamientos: boolean;
}

export const PERMISOS_PREDEFINIDOS: Record<string, Permisos> = {
  ADMIN: {
    puedeVerDashboard: true,
    puedeGestionarUsuarios: true,
    puedeGestionarClinica: true,
    puedeVerVentas: true,
    puedeCrearVentas: true,
    puedeEditarVentas: true,
    puedeEliminarVentas: true,
    puedeVerTurnos: true,
    puedeCrearTurnos: true,
    puedeEditarTurnos: true,
    puedeCancelarTurnos: true,
    puedeVerPacientes: true,
    puedeCrearPacientes: true,
    puedeEditarPacientes: true,
    puedeEliminarPacientes: true,
    puedeVerReportes: true,
    puedeExportarDatos: true,
    puedeConfigurarSistema: true,
    puedeGestionarSucursales: true,
    puedeGestionarTratamientos: true,
  },
  SECRETARY: {
    puedeVerDashboard: true,
    puedeGestionarUsuarios: false,
    puedeGestionarClinica: false,
    puedeVerVentas: true,
    puedeCrearVentas: true,
    puedeEditarVentas: true,
    puedeEliminarVentas: false,
    puedeVerTurnos: true,
    puedeCrearTurnos: true,
    puedeEditarTurnos: true,
    puedeCancelarTurnos: true,
    puedeVerPacientes: true,
    puedeCrearPacientes: true,
    puedeEditarPacientes: true,
    puedeEliminarPacientes: false,
    puedeVerReportes: true,
    puedeExportarDatos: true,
    puedeConfigurarSistema: false,
    puedeGestionarSucursales: false,
    puedeGestionarTratamientos: false,
  },
  PROFESSIONAL: {
    puedeVerDashboard: true,
    puedeGestionarUsuarios: false,
    puedeGestionarClinica: false,
    puedeVerVentas: false,
    puedeCrearVentas: false,
    puedeEditarVentas: false,
    puedeEliminarVentas: false,
    puedeVerTurnos: true,
    puedeCrearTurnos: false,
    puedeEditarTurnos: false,
    puedeCancelarTurnos: false,
    puedeVerPacientes: true,
    puedeCrearPacientes: false,
    puedeEditarPacientes: false,
    puedeEliminarPacientes: false,
    puedeVerReportes: false,
    puedeExportarDatos: false,
    puedeConfigurarSistema: false,
    puedeGestionarSucursales: false,
    puedeGestionarTratamientos: false,
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
