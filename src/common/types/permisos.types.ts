export interface Permisos {
  gestionarTurnos?: boolean;
  gestionarPacientes?: boolean;
  gestionarUsuarios?: boolean;
  gestionarProfesionales?: boolean;
  gestionarVentas?: boolean;
  gestionarReportes?: boolean;
  gestionarEspecialidades?: boolean;
  gestionarTratamientos?: boolean;
  gestionarSucursales?: boolean;
  gestionarMensajeria?: boolean;
  gestionarIA?: boolean;
  gestionarFichasMedicas?: boolean;
  [key: string]: boolean | undefined;
}

export const PERMISOS_DEFAULT: Permisos = {
  gestionarTurnos: false,
  gestionarPacientes: false,
  gestionarUsuarios: false,
  gestionarProfesionales: false,
  gestionarVentas: false,
  gestionarReportes: false,
  gestionarEspecialidades: false,
  gestionarTratamientos: false,
  gestionarSucursales: false,
  gestionarMensajeria: false,
  gestionarIA: false,
  gestionarFichasMedicas: false,
};


