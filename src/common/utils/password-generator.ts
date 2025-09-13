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
}

