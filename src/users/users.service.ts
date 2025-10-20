import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRegisterDto } from '../auth/dto/user-register.dto';
import { UserLoginDto } from '../auth/dto/user-login.dto';
import { CreateClinicaDto } from '../owners/dto/create-clinica.dto';
import { EmailService } from '../email/email.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ForgotPasswordDto } from '../auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../auth/dto/reset-password.dto';
import { randomBytes } from 'crypto';
import axios from 'axios';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async register(dto: UserRegisterDto) {
    try {
      console.log('🔍 Iniciando registro de usuario:', dto.email);
      
      // Verificar si el email ya existe
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });

      if (existingEmail) {
        console.log('❌ Email ya existe:', dto.email);
        throw new ConflictException('El email ya está registrado');
      }

      // Verificar si el username ya existe
      const existingUsername = await this.prisma.user.findFirst({
        where: { username: dto.username },
      });

      if (existingUsername) {
        console.log('❌ Username ya existe:', dto.username);
        throw new ConflictException('El nombre de usuario ya está en uso');
      }

      console.log('✅ Validaciones pasadas, creando usuario...');

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Crear el usuario con username
    const user = await this.prisma.user.create({
      data: {
          email: dto.email,
          username: dto.username,
        password: hashedPassword,
          name: dto.name,
                  role: 'ADMIN',
          clinicaId: null,
          preferredLanguage: dto.preferredLanguage || 'es', // Default a español si no se proporciona
      },
    });
      console.log('✅ Usuario creado exitosamente con username');

      // Hacer POST a la API externa de Fluentia
      console.log('🌐 ===== INICIANDO LLAMADA A API EXTERNA (USERS) =====');
      const startTime = Date.now();
      try {
        const externalApiUrl = 'https://fluentia-api-develop-latest.up.railway.app/auth/register';
        const externalApiData = {
          name: dto.username, // Usar el username del usuario
          email: dto.email,
          password: dto.password, // Contraseña en texto plano
        };
        
        console.log('📤 Datos que se enviarán a la API externa (USERS):', JSON.stringify(externalApiData, null, 2));
        console.log('🔗 URL de la API externa:', externalApiUrl);
        console.log('⏱️ Iniciando petición HTTP...');
        
        const externalApiResponse = await axios.post(externalApiUrl, externalApiData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos de timeout
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ ===== LLAMADA A API EXTERNA EXITOSA (USERS) =====');
        console.log('⏱️ Duración de la petición:', `${duration}ms`);
        console.log('📊 Status Code:', externalApiResponse.status);
        console.log('📋 Headers de respuesta:', JSON.stringify(externalApiResponse.headers, null, 2));
        console.log('📄 Datos de respuesta:', JSON.stringify(externalApiResponse.data, null, 2));
        console.log('✅ Usuario registrado exitosamente en Fluentia API (USERS)');
        
      } catch (externalApiError) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('❌ ===== ERROR EN LLAMADA A API EXTERNA (USERS) =====');
        console.log('⏱️ Duración antes del error:', `${duration}ms`);
        console.log('🚨 Tipo de error:', externalApiError.name || 'Unknown');
        console.log('📝 Mensaje de error:', externalApiError.message);
        
        if (externalApiError.response) {
          console.log('📊 Status Code de error:', externalApiError.response.status);
          console.log('📋 Headers de error:', JSON.stringify(externalApiError.response.headers, null, 2));
          console.log('📄 Datos de error:', JSON.stringify(externalApiError.response.data, null, 2));
        } else if (externalApiError.request) {
          console.log('🔌 Error de conexión - No se recibió respuesta');
          console.log('📋 Request config:', JSON.stringify(externalApiError.config, null, 2));
        } else {
          console.log('⚙️ Error de configuración:', externalApiError.message);
        }
        
        console.log('⚠️ IMPORTANTE: El registro local continúa normalmente');
        console.log('⚠️ El usuario se registra en el sistema local aunque falle la API externa');
      }

      // Generar token JWT
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name,
      };

      const token = this.jwtService.sign(payload);

    // Enviar email de bienvenida con credenciales
      try {
        await this.emailService.sendWelcomeEmail(
          dto.email,
          dto.name,
          dto.username,
          dto.password, // Pasar la contraseña en texto plano para el email
        );
    } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
        // No lanzamos error para no interrumpir el registro
    }

    return {
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          preferredLanguage: user.preferredLanguage || 'es',
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Error en registro de usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async login(dto: UserLoginDto) {
    try {
      console.log('🔥 USERS SERVICE - Login iniciado');
      console.log('📋 Datos recibidos:', dto);
      
      // Normalizar username a minúsculas para búsqueda case-insensitive
      const normalizedUsername = dto.username.toLowerCase();
      console.log('🔍 Username normalizado:', normalizedUsername);
      
      // Buscar usuario por username o email con información de la clínica
      const user = await this.prisma.user.findFirst({
        where: { 
          OR: [
            { username: normalizedUsername },
            { email: normalizedUsername },
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          password: true,
          role: true,
          clinicaId: true,
          preferredLanguage: true,
          permisos: true, // Incluir permisos
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
              estado: true,
              estadoPago: true,
              createdAt: true,
              colorPrimario: true,
              colorSecundario: true,
            }
          }
        }
      });
      
      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar contraseña
      console.log('🔍 Verificando contraseña para usuario:', user.email);
      console.log('🔍 Contraseña ingresada length:', dto.password ? dto.password.length : 'undefined');
      console.log('🔍 Hash en BD length:', user.password ? user.password.length : 'undefined');
      
      const isValidPassword = await bcrypt.compare(dto.password, user.password);
      console.log('🔍 Resultado comparación de contraseña:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Contraseña inválida para usuario:', user.email);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      console.log('✅ Credenciales válidas, iniciando login en API externa...');

      // Hacer POST a la API externa de Fluentia para login
      console.log('🌐 ===== INICIANDO LOGIN EN API EXTERNA (USERS) =====');
      const startTime = Date.now();
      try {
        const externalApiUrl = 'https://fluentia-api-develop-latest.up.railway.app/auth/login';
        const externalApiData = {
          email: user.email, // Usar el email del usuario encontrado
          password: dto.password, // Contraseña en texto plano
        };
        
        console.log('📤 Datos que se enviarán a la API externa (LOGIN):', JSON.stringify(externalApiData, null, 2));
        console.log('🔗 URL de la API externa:', externalApiUrl);
        console.log('⏱️ Iniciando petición HTTP...');
        
        const externalApiResponse = await axios.post(externalApiUrl, externalApiData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos de timeout
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ ===== LOGIN EN API EXTERNA EXITOSO (USERS) =====');
        console.log('⏱️ Duración de la petición:', `${duration}ms`);
        console.log('📊 Status Code:', externalApiResponse.status);
        console.log('📋 Headers de respuesta:', JSON.stringify(externalApiResponse.headers, null, 2));
        console.log('📄 Datos de respuesta:', JSON.stringify(externalApiResponse.data, null, 2));
        console.log('✅ Usuario logueado exitosamente en Fluentia API (USERS)');
        
      } catch (externalApiError) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('❌ ===== ERROR EN LOGIN DE API EXTERNA (USERS) =====');
        console.log('⏱️ Duración antes del error:', `${duration}ms`);
        console.log('🚨 Tipo de error:', externalApiError.name || 'Unknown');
        console.log('📝 Mensaje de error:', externalApiError.message);
        
        if (externalApiError.response) {
          console.log('📊 Status Code de error:', externalApiError.response.status);
          console.log('📋 Headers de error:', JSON.stringify(externalApiError.response.headers, null, 2));
          console.log('📄 Datos de error:', JSON.stringify(externalApiError.response.data, null, 2));
        } else if (externalApiError.request) {
          console.log('🔌 Error de conexión - No se recibió respuesta');
          console.log('📋 Request config:', JSON.stringify(externalApiError.config, null, 2));
        } else {
          console.log('⚙️ Error de configuración:', externalApiError.message);
        }
        
        console.log('⚠️ IMPORTANTE: El login local continúa normalmente');
        console.log('⚠️ El usuario se loguea en el sistema local aunque falle la API externa');
      }

      // Generar token JWT
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name,
        clinicaId: user.clinicaId,
        clinicaUrl: user.clinica?.url,
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          preferredLanguage: user.preferredLanguage || 'es',
          permisos: user.permisos || null, // Incluir permisos desde la BD
          clinica: user.clinica, // Incluir información de la clínica
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error en login de usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phone: true,
          role: true,
          estado: true,
          createdAt: true,
          avatar_url: true,
          preferredLanguage: true,
          permisos: true, // Incluir permisos
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
              estado: true,
              estadoPago: true,
              createdAt: true,
              colorPrimario: true,
              colorSecundario: true,
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          phone: user.phone,
          role: user.role,
          estado: user.estado,
          createdAt: user.createdAt,
          avatar_url: user.avatar_url,
          preferredLanguage: user.preferredLanguage || 'es',
          permisos: user.permisos || null, // Incluir permisos
          clinica: user.clinica, // Incluir información de la clínica
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener perfil:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getUserClinicas(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          clinicasAdministradas: {
      select: {
        id: true,
        name: true,
              url: true,
        estado: true,
              estadoPago: true,
        createdAt: true,
              colorPrimario: true,
              colorSecundario: true,
            },
          },
      },
    });

    if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return {
        success: true,
        clinicas: user.clinicasAdministradas,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener clínicas del usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createClinica(userId: string, dto: CreateClinicaDto) {
    console.log('🏥 USERS SERVICE - createClinica iniciado');
    console.log('🔍 User ID:', userId);
    console.log('🔍 DTO recibido:', JSON.stringify(dto, null, 2));
    console.log('🔍 PlanId en DTO:', dto.planId);
    console.log('🔍 PlanId tipo:', typeof dto.planId);
    
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Normalizar URL a minúsculas
      const urlNormalizada = dto.url.toLowerCase().trim();
      
      // Verificar que la URL de la clínica no existe
      const existingClinica = await this.prisma.clinica.findFirst({
        where: { url: urlNormalizada },
      });

      if (existingClinica) {
        throw new ConflictException('La URL de la clínica ya está en uso');
      }

      // Crear la clínica
      const clinica = await this.prisma.clinica.create({
        data: {
          name: dto.nombre,
          url: urlNormalizada,
          email: dto.email,
          address: dto.direccion,
          phone: dto.telefono,
          descripcion: dto.descripcion,
          colorPrimario: dto.colorPrimario,
          colorSecundario: dto.colorSecundario,
          estado: dto.estado,
          administradorId: userId,
          defaultLanguage: dto.defaultLanguage || 'es',
      },
    });

      // Crear un usuario ADMIN para la clínica
      const adminPassword = Math.random().toString(36).slice(-8); // Contraseña temporal
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedAdminPassword,
          name: `Admin ${dto.nombre}`,
          role: 'ADMIN',
        clinicaId: clinica.id,
      },
    });

      // Enviar email con credenciales del admin
      try {
        await this.emailService.sendAdminCredentialsEmail(
          dto.email,
          adminPassword,
          `Admin ${dto.nombre}`,
          dto.nombre,
          dto.url,
        );
      } catch (emailError) {
        console.error('Error al enviar email de credenciales:', emailError);
        // No lanzamos error para no interrumpir la creación
      }

      // Crear suscripción automática si se proporciona planId
      console.log('🔍 VERIFICANDO SUSCRIPCIÓN AUTOMÁTICA EN USERS SERVICE');
      console.log('🔍 dto.planId existe:', !!dto.planId);
      console.log('🔍 dto.planId valor:', dto.planId);
      console.log('🔍 dto.planId tipo:', typeof dto.planId);
      
      let subscription: any = null;
      if (dto.planId) {
        console.log('✅ PlanId detectado en Users Service, creando suscripción automática');
        try {
          console.log(`🏥 Creando suscripción automática para clínica ${clinica.id} con plan ${dto.planId}`);
          const subscriptionResult = await this.subscriptionsService.createTrialSubscription(
            clinica.id,
            dto.planId
          );
          console.log(`✅ Suscripción creada exitosamente:`, subscriptionResult);
          subscription = subscriptionResult.suscripcion;
        } catch (subscriptionError) {
          console.error('❌ Error al crear suscripción automática:', subscriptionError);
          // No lanzamos error para no interrumpir la creación de la clínica
        }
      } else {
        console.log('❌ No hay planId en Users Service, saltando suscripción automática');
      }

      // Hacer POST a la API externa de Fluentia para registrar la clínica (después de crear admin)
      console.log('🌐 ===== INICIANDO REGISTRO DE CLÍNICA EN API EXTERNA (USERS) =====');
      const startTime = Date.now();
      try {
        // PASO 1: Hacer login en Fluentia para obtener el token
        console.log('🔑 PASO 1: Obteniendo token de Fluentia...');
        console.log('🔍 Usuario logueado:', JSON.stringify({ id: user.id, email: user.email }, null, 2));
        console.log('🔍 DTO recibido para login:', JSON.stringify({ 
          userPassword: dto.userPassword ? '***' : 'UNDEFINED',
          adminPassword: dto.password ? '***' : 'UNDEFINED'
        }, null, 2));
        
        console.log('🔍 TODOS LOS CAMPOS DEL DTO:', JSON.stringify({
          nombre: dto.nombre,
          url: dto.url,
          email: dto.email,
          password: dto.password ? '***' : 'UNDEFINED',
          userPassword: dto.userPassword ? '***' : 'UNDEFINED',
          direccion: dto.direccion,
          telefono: dto.telefono,
          descripcion: dto.descripcion,
          planId: dto.planId
        }, null, 2));
        
        // Intentar primero con userPassword, si no está disponible usar adminPassword
        let loginEmail, loginPassword;
        
        if (dto.userPassword) {
          console.log('🔑 Usando contraseña del usuario logueado');
          loginEmail = user.email;
          loginPassword = dto.userPassword;
        } else {
          console.log('🔑 userPassword no disponible, usando contraseña del admin de la clínica');
          loginEmail = dto.email; // Email del admin de la clínica
          loginPassword = dto.password; // Contraseña del admin de la clínica
        }
        
        if (!loginPassword) {
          console.log('⚠️ No se encontró contraseña en DTO, usando contraseña generada para admin');
          // Usar la contraseña generada automáticamente para el admin
          loginEmail = dto.email; // Email del admin de la clínica
          loginPassword = adminPassword; // Contraseña generada automáticamente (disponible en este scope)
          console.log('🔑 Usando credenciales del admin generado:', { email: loginEmail, password: '***' });
        }
        
        const loginUrl = 'https://fluentia-api-develop-latest.up.railway.app/auth/login';
        const loginData = {
          email: loginEmail,
          password: loginPassword,
        };
        
        console.log('📤 Datos de login a Fluentia:', JSON.stringify(loginData, null, 2));
        
        const loginResponse = await axios.post(loginUrl, loginData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }).catch(error => {
          console.log('❌ ERROR EN LOGIN A FLUENTIA:');
          console.log('📊 Status Code:', error.response?.status);
          console.log('📋 Headers de error:', JSON.stringify(error.response?.headers, null, 2));
          console.log('📄 Datos de error:', JSON.stringify(error.response?.data, null, 2));
          throw error;
        });
        
        console.log('📊 Status Code de Fluentia:', loginResponse.status);
        console.log('📋 Headers de respuesta de Fluentia:', JSON.stringify(loginResponse.headers, null, 2));
        console.log('📄 Respuesta completa de Fluentia:', JSON.stringify(loginResponse.data, null, 2));
        
        const fluentiaToken = loginResponse.data.content?.accessToken || loginResponse.data.access_token || loginResponse.data.token;
        let fluentiaUserId = loginResponse.data.content?.user?.id || loginResponse.data.user?.id || loginResponse.data.user_id;
        
        console.log('🔍 Estructura completa del user:', JSON.stringify(loginResponse.data.content?.user, null, 2));
        console.log('🔍 ¿User tiene ID?', loginResponse.data.content?.user?.id ? 'SÍ' : 'NO');
        console.log('🔍 User ID directo:', loginResponse.data.content?.user?.id);
        
        // Si no hay ID en el user, intentar extraerlo del JWT
        if (!fluentiaUserId && fluentiaToken) {
          try {
            const tokenPayload = JSON.parse(Buffer.from(fluentiaToken.split('.')[1], 'base64').toString());
            fluentiaUserId = tokenPayload['user.id'];
            console.log('🔍 User ID extraído del JWT:', fluentiaUserId);
          } catch (error) {
            console.log('⚠️ Error decodificando JWT:', error.message);
          }
        }
        
        console.log('🔍 Token extraído:', fluentiaToken ? fluentiaToken.substring(0, 50) + '...' : 'No encontrado');
        console.log('🔍 User ID extraído:', fluentiaUserId || 'No encontrado');
        console.log('✅ Token obtenido de Fluentia:', fluentiaToken ? 'Sí' : 'No');
        console.log('✅ User ID obtenido de Fluentia:', fluentiaUserId || 'No encontrado');
        
        if (!fluentiaToken) {
          throw new Error('No se pudo obtener el token de Fluentia');
        }
        
        // PASO 2: Crear business en Fluentia con el token
        console.log('🏥 PASO 2: Creando business en Fluentia...');
        const businessUrl = 'https://fluentia-api-develop-latest.up.railway.app/businesses';
        // Función para crear nombre válido para Fluentia
        const normalizeName = (name: string) => {
          // Remover números y caracteres especiales, solo letras y espacios
          const cleanName = name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-zA-Z\s]/g, '') // Solo letras y espacios
            .replace(/\s+/g, ' ') // Múltiples espacios a uno
            .trim();
          
          // Si queda vacío, usar nombre por defecto
          return cleanName || 'Clinica';
        };
        
        const normalizedName = normalizeName(dto.nombre);
        
        console.log('🔍 Nombre original:', dto.nombre);
        console.log('🔍 Nombre normalizado:', normalizedName);
        
        const businessData = {
          name: normalizedName, // Nombre de la clínica normalizado
          email: dto.email, // Email de la clínica
          phone: dto.telefono || '', // Teléfono de la clínica
          business_id: clinica.id, // ID de la clínica como business_id
        };
        
        console.log('📤 Datos que se enviarán a la API externa (BUSINESS):', JSON.stringify(businessData, null, 2));
        console.log('🔗 URL de la API externa:', businessUrl);
        
        const businessResponse = await axios.post(businessUrl, businessData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fluentiaToken}`,
          },
          timeout: 10000,
        });
        
        console.log('✅ Business creado exitosamente en Fluentia');
        console.log('📊 Status Code:', businessResponse.status);
        console.log('📄 Datos de respuesta:', JSON.stringify(businessResponse.data, null, 2));
        
        // PASO 3: Asociar usuario con business usando PATCH
        if (fluentiaUserId) {
          console.log('🔗 PASO 3: Asociando usuario con business...');
          const patchUrl = `https://fluentia-api-develop-latest.up.railway.app/users/${fluentiaUserId}`;
          
          console.log('📤 PATCH URL:', patchUrl);
          console.log('📤 Business ID:', clinica.id);
          
          const patchResponse = await axios.patch(patchUrl, {}, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${fluentiaToken}`,
              'X-Business-id': clinica.id,
            },
            timeout: 10000,
          });
          
          console.log('✅ Usuario asociado con business exitosamente');
          console.log('📊 Status Code:', patchResponse.status);
          console.log('📄 Datos de respuesta:', JSON.stringify(patchResponse.data, null, 2));
        } else {
          console.log('⚠️ No se pudo obtener USER_ID de Fluentia, saltando PATCH');
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ ===== REGISTRO DE CLÍNICA EN API EXTERNA EXITOSO (USERS) =====');
        console.log('⏱️ Duración total:', `${duration}ms`);
        console.log('✅ Clínica registrada exitosamente en Fluentia API (USERS)');
        
      } catch (externalApiError) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('❌ ===== ERROR EN REGISTRO DE CLÍNICA EN API EXTERNA (USERS) =====');
        console.log('⏱️ Duración antes del error:', `${duration}ms`);
        console.log('🚨 Tipo de error:', externalApiError.name || 'Unknown');
        console.log('📝 Mensaje de error:', externalApiError.message);
        
        if (externalApiError.response) {
          console.log('📊 Status Code de error:', externalApiError.response.status);
          console.log('📋 Headers de error:', JSON.stringify(externalApiError.response.headers, null, 2));
          console.log('📄 Datos de error:', JSON.stringify(externalApiError.response.data, null, 2));
        } else if (externalApiError.request) {
          console.log('🔌 Error de conexión - No se recibió respuesta');
          console.log('📋 Request config:', JSON.stringify(externalApiError.config, null, 2));
        } else {
          console.log('⚙️ Error de configuración:', externalApiError.message);
        }
        
        console.log('⚠️ IMPORTANTE: La creación de clínica local continúa normalmente');
        console.log('⚠️ La clínica se crea en el sistema local aunque falle la API externa');
      }

      const response = {
        success: true,
        message: 'Clínica creada exitosamente',
        clinica: {
          id: clinica.id,
          name: clinica.name,
          url: clinica.url,
          estado: clinica.estado,
        },
        adminCredentials: {
          email: dto.email,
          password: adminPassword,
          note: 'Guarda estas credenciales para acceder a la clínica',
        },
        subscription: subscription ? {
          id: subscription.id,
          estado: subscription.estado,
          fechaInicio: subscription.fechaInicio,
          fechaTrialFin: subscription.fechaTrialFin,
          trialDias: subscription.trialDias,
          plan: subscription.plan
        } : null,
      };

      console.log('🔍 RESPUESTA FINAL USERS SERVICE:');
      console.log('🔍 subscription en response:', response.subscription);
      console.log('🔍 subscription existe:', !!response.subscription);

      return response;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error('Error al crear clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async checkClinicaAccess(userId: string, clinicaUrl: string) {
    try {
      const user = await this.prisma.user.findUnique({
      where: { id: userId },
        include: {
          clinicasAdministradas: {
            where: { url: clinicaUrl },
      select: {
        id: true,
        name: true,
              url: true,
        estado: true,
            },
          },
      },
    });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const clinica = user.clinicasAdministradas[0];

      if (!clinica) {
        throw new UnauthorizedException('No tienes acceso a esta clínica');
      }

      return {
        success: true,
        hasAccess: true,
        clinica,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error al verificar acceso a clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updateUserLanguage(userId: string, preferredLanguage: string) {
    try {
      console.log(`🌍 Actualizando idioma del usuario ${userId} a: ${preferredLanguage}`);

      // Validar que el idioma sea válido
      const idiomasValidos = ['es', 'pt-BR', 'en'];
      if (!idiomasValidos.includes(preferredLanguage)) {
        throw new BadRequestException('Idioma no válido. Idiomas disponibles: es, pt-BR, en');
      }

      // Actualizar el idioma del usuario
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { preferredLanguage },
        select: {
          id: true,
          email: true,
          name: true,
          preferredLanguage: true,
        }
      });

      console.log(`✅ Idioma actualizado exitosamente para usuario ${userId}`);

      return {
        success: true,
        message: 'Idioma actualizado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredLanguage: user.preferredLanguage,
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar idioma del usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getUserLanguage(userId: string) {
    try {
      console.log(`🌍 Obteniendo idioma del usuario ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          preferredLanguage: true,
        }
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      console.log(`✅ Idioma obtenido para usuario ${userId}: ${user.preferredLanguage}`);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredLanguage: user.preferredLanguage || 'es', // Default a español si no está configurado
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener idioma del usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  // ===== MÉTODOS DE VALIDACIÓN =====

  async validateEmail(email: string, clinicaId?: string) {
    try {
      // Normalizar email a minúsculas
      const normalizedEmail = email.toLowerCase().trim();
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return {
          success: true,
          available: false,
          message: 'El formato del email no es válido',
        };
      }

      // Buscar usuario con ese email
      const user = await this.prisma.user.findFirst({
        where: { 
          email: normalizedEmail,
          clinicaId: clinicaId || undefined
        },
      });
      
      return {
        success: true,
        available: !user,
        message: user ? 'El email ya está registrado' : 'El email está disponible',
      };
    } catch (error) {
      console.error('Error validando email:', error);
      throw new BadRequestException('Error al validar email');
    }
  }

  async validateUsername(username: string, clinicaId?: string) {
    try {
      // Normalizar username a minúsculas
      const normalizedUsername = username.toLowerCase().trim();
      
      // Validar formato de username (letras, números, guiones, guiones bajos)
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(normalizedUsername)) {
        return {
          success: true,
          available: false,
          message: 'El username solo puede contener letras, números, guiones y guiones bajos',
        };
      }

      // Validar longitud mínima
      if (normalizedUsername.length < 3) {
        return {
          success: true,
          available: false,
          message: 'El username debe tener al menos 3 caracteres',
        };
      }

      // Buscar usuario con ese username
      const user = await this.prisma.user.findFirst({
        where: { 
          username: normalizedUsername,
          clinicaId: clinicaId || undefined
        },
      });
      
      return {
        success: true,
        available: !user,
        message: user ? 'El username ya está en uso' : 'El username está disponible',
      };
    } catch (error) {
      console.error('Error validando username:', error);
      throw new BadRequestException('Error al validar username');
    }
  }

  // ===== MÉTODOS DE RECUPERACIÓN DE CONTRASEÑA =====

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      console.log('🔑 USERS SERVICE - Solicitud de recuperación de contraseña para:', dto.email);
      
      // Buscar usuario por email
      // Normalizar email a minúsculas para búsqueda case-insensitive
      const normalizedEmail = dto.email.toLowerCase();
      const user = await this.prisma.user.findFirst({
          where: { 
            email: normalizedEmail
          },
      });

      if (!user) {
        console.log('⚠️ Usuario no encontrado para email:', dto.email);
        // Por seguridad, no revelamos si el email existe o no
        return {
          success: true,
          message:
            'Si el email está registrado, recibirás un enlace para restablecer tu contraseña',
        };
      }

      console.log('✅ Usuario encontrado:', user.id);

      // Generar token único
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Guardar token en base de datos
      await this.prisma.passwordResetToken.create({
        data: {
          email: dto.email,
          token: resetToken,
          expiresAt,
          used: false,
        },
      });

      console.log('✅ Token de recuperación creado:', resetToken.substring(0, 10) + '...');

      // Enviar email
      const emailSent = await this.emailService.sendPasswordResetEmail(
        dto.email,
        resetToken,
        user.name || 'Usuario',
      );

      if (!emailSent) {
        console.error('❌ Error al enviar email de recuperación');
        throw new BadRequestException(
          'Error al enviar el email de recuperación',
        );
      }

      console.log('✅ Email de recuperación enviado exitosamente');

      return {
        success: true,
        message:
          'Si el email está registrado, recibirás un enlace para restablecer tu contraseña',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en forgotPassword (Users Service):', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      console.log('🔑 USERS SERVICE - Intentando restablecer contraseña con token:', dto.token ? dto.token.substring(0, 10) + '...' : 'undefined');
      
      // Validar que el token esté presente
      if (!dto.token || !dto.newPassword) {
        throw new BadRequestException('Token y nueva contraseña son requeridos');
      }
      
      // Buscar token válido
      const resetToken = await this.prisma.passwordResetToken.findFirst({
        where: {
          token: dto.token,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!resetToken) {
        console.log('❌ Token inválido o expirado');
        throw new BadRequestException('Token inválido o expirado');
      }

      console.log('✅ Token válido encontrado, buscando usuario...');

      // Buscar usuario
      // Normalizar email a minúsculas para búsqueda case-insensitive
      const normalizedEmail = resetToken.email.toLowerCase();
      const user = await this.prisma.user.findFirst({
          where: { 
            email: normalizedEmail
          },
      });

      if (!user) {
        console.log('❌ Usuario no encontrado para email:', resetToken.email);
        throw new BadRequestException('Usuario no encontrado');
      }

      console.log('✅ Usuario encontrado, actualizando contraseña...');
      console.log('🔍 Usuario ID:', user.id);
      console.log('🔍 Usuario email:', user.email);

      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
      console.log('🔑 Nueva contraseña hasheada generada:', hashedPassword.substring(0, 20) + '...');
      
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
        select: { id: true, email: true, password: true }
      });
      
      console.log('✅ Contraseña actualizada en BD. Usuario actualizado:', {
        id: updatedUser.id,
        email: updatedUser.email,
        passwordHash: updatedUser.password.substring(0, 20) + '...'
      });

      // Verificar que la contraseña se guardó correctamente
      const verificationPassword = await bcrypt.compare(dto.newPassword, updatedUser.password);
      console.log('🔍 Verificación: nueva contraseña coincide con hash guardado:', verificationPassword);
      
      if (!verificationPassword) {
        console.error('❌ ERROR: La nueva contraseña no coincide con el hash guardado');
        throw new BadRequestException('Error al guardar la nueva contraseña');
      }

      // Marcar token como usado
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });

      console.log('✅ Contraseña actualizada, enviando email de confirmación...');

      // Enviar email de confirmación
      await this.emailService.sendPasswordChangedEmail(
        user.email,
        user.name || 'Usuario',
      );

      console.log('✅ Proceso de restablecimiento completado exitosamente');

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en resetPassword (Users Service):', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }
}