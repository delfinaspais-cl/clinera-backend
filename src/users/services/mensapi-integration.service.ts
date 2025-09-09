import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface MensapiUser {
  name: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  profile_picture_url?: string;
  status_message?: string;
  is_online: number;
  last_seen_at?: string;
  email: string;
  email_verified_at?: string;
  is_active: number;
  remember_token?: string;
  created_at: string;
  updated_at: string;
}

export interface MensapiRegistrationResponse {
  message: string;
  content: {
    user: MensapiUser;
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable()
export class MensapiIntegrationService {
  private readonly logger = new Logger(MensapiIntegrationService.name);
  private readonly mensapiUrl: string;
  private readonly mensapiServiceEmail: string;
  private readonly mensapiServicePassword: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.mensapiUrl = process.env.MENSAPI_URL || 'https://mensapi.clinera.io';
    this.mensapiServiceEmail = process.env.MENSAPI_SERVICE_EMAIL || '';
    this.mensapiServicePassword = process.env.MENSAPI_SERVICE_PASSWORD || '';
  }

  private async authenticate(): Promise<boolean> {
    try {
      // Verificar si ya tenemos un token válido
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return true;
      }

      // Si no tenemos credenciales de servicio, intentar registro público
      if (!this.mensapiServiceEmail || !this.mensapiServicePassword) {
        this.logger.warn('No hay credenciales de servicio configuradas para mensapi');
        return false;
      }

      this.logger.log('Autenticando con mensapi...');

      const response = await axios.post(
        `${this.mensapiUrl}/auth/login`,
        {
          email: this.mensapiServiceEmail,
          password: this.mensapiServicePassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.status === 200 && response.data?.content?.accessToken) {
        this.accessToken = response.data.content.accessToken;
        // Establecer expiración 5 minutos antes del tiempo real
        this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000) - (5 * 60 * 1000);
        this.logger.log('Autenticación exitosa con mensapi');
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error autenticando con mensapi: ${error.message}`);
      return false;
    }
  }

  async registerUser(userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
  }): Promise<MensapiRegistrationResponse | null> {
    try {
      this.logger.log(`Registrando usuario en mensapi: ${userData.email}`);

      // Intentar autenticación si tenemos credenciales
      const isAuthenticated = await this.authenticate();
      
      const registrationData = {
        name: userData.name,
        email: userData.email,
        password: userData.password || 'password123', // Contraseña por defecto
      };

      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Agregar token de autenticación si está disponible
      if (isAuthenticated && this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await axios.post(
        `${this.mensapiUrl}/auth/register`,
        registrationData,
        {
          headers,
          timeout: 10000, // 10 segundos de timeout
        }
      );

      if (response.status === 200 || response.status === 201) {
        this.logger.log(`Usuario registrado exitosamente en mensapi: ${userData.email}`);
        return response.data;
      } else {
        this.logger.warn(`Respuesta inesperada de mensapi: ${response.status}`);
        return null;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          this.logger.error(
            `Error registrando usuario en mensapi: ${error.response.status} - ${error.response.data?.message || error.message}`
          );
          
          // Si es error 401, limpiar token y reintentar una vez
          if (error.response.status === 401 && this.accessToken) {
            this.logger.log('Token expirado, reintentando autenticación...');
            this.accessToken = null;
            this.tokenExpiry = 0;
            
            // Reintentar una vez
            try {
              const retryResponse = await axios.post(
                `${this.mensapiUrl}/auth/register`,
                {
                  name: userData.name,
                  email: userData.email,
                  password: userData.password || 'password123',
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.authenticate() ? this.accessToken : ''}`,
                  },
                  timeout: 10000,
                }
              );
              
              if (retryResponse.status === 200 || retryResponse.status === 201) {
                this.logger.log(`Usuario registrado exitosamente en mensapi (reintento): ${userData.email}`);
                return retryResponse.data;
              }
            } catch (retryError) {
              this.logger.error(`Error en reintento de registro: ${retryError.message}`);
            }
          }
        } else if (error.request) {
          this.logger.error(`Error de conexión con mensapi: ${error.message}`);
        } else {
          this.logger.error(`Error configurando request a mensapi: ${error.message}`);
        }
      } else {
        this.logger.error(`Error inesperado registrando usuario en mensapi: ${error.message}`);
      }
      return null;
    }
  }

  async isMensapiAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.mensapiUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Mensapi no disponible: ${error.message}`);
      return false;
    }
  }
}
