import { randomBytes } from 'crypto';

export class PasswordGenerator {
  /**
   * Genera una contraseña segura y legible
   * Formato: [Adjetivo][Sustantivo][Número][Símbolo]
   * Ejemplo: "RapidoGato42!"
   */
  static generateSecurePassword(): string {
    const adjectives = [
      'Rapido', 'Fuerte', 'Brillante', 'Calido', 'Fresco', 'Grande', 'Pequeño', 'Feliz',
      'Tranquilo', 'Activo', 'Suave', 'Dulce', 'Salado', 'Limpio', 'Nuevo', 'Viejo'
    ];
    
    const nouns = [
      'Gato', 'Perro', 'Casa', 'Arbol', 'Mar', 'Sol', 'Luna', 'Estrella',
      'Flor', 'Pajaro', 'Peces', 'Montana', 'Rio', 'Bosque', 'Campo', 'Ciudad'
    ];
    
    const symbols = ['!', '@', '#', '$', '%', '&', '*'];
    
    // Seleccionar elementos aleatorios
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 90) + 10; // Número entre 10 y 99
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    return `${adjective}${noun}${number}${symbol}`;
  }

  /**
   * Genera una contraseña completamente aleatoria (más segura pero menos legible)
   */
  static generateRandomPassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }

  /**
   * Genera una contraseña temporal para usuarios nuevos
   */
  static generateTempPassword(): string {
    // Usar la contraseña legible para usuarios nuevos
    return this.generateSecurePassword();
  }

  /**
   * Genera un username único basado en el nombre del usuario
   * Formato: [PrimerNombre][PrimerApellido][Número]
   * Ejemplo: "JuanPerez123"
   */
  static generateUsername(fullName: string): string {
    // Limpiar el nombre y dividir en partes
    const nameParts = fullName
      .trim()
      .toLowerCase()
      .replace(/[^a-záéíóúñ\s]/g, '') // Solo letras y espacios
      .split(/\s+/)
      .filter(part => part.length > 0);

    if (nameParts.length === 0) {
      // Si no hay nombre válido, generar uno aleatorio
      return this.generateRandomUsername();
    }

    // Tomar el primer nombre y apellido
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;
    
    // Crear base del username
    const baseUsername = `${firstName}${lastName}`;
    
    // Agregar número aleatorio para hacerlo único
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    
    return `${baseUsername}${randomNumber}`;
  }

  /**
   * Genera un username completamente aleatorio
   */
  static generateRandomUsername(): string {
    const adjectives = [
      'usuario', 'admin', 'user', 'staff', 'empleado', 'trabajador'
    ];
    
    const randomNumber = Math.floor(Math.random() * 9999) + 1;
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    return `${adjective}${randomNumber}`;
  }
}

