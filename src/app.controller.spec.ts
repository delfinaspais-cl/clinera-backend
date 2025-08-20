import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClinicasService } from './clinicas/clinicas.service';
import { NotificationsService } from './notifications/notifications.service';
import { OwnersService } from './owners/owners.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ClinicasService,
          useValue: {
            getClinicaLanding: jest.fn(),
            getTurnosByClinicaUrl: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: OwnersService,
          useValue: {
            getAllClinicas: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('health', () => {
    it('should return health status', () => {
      const result: { status: string; timestamp: string } = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
      jest.spyOn(appService, 'healthCheck').mockImplementation(() => result);
      expect(appController.healthCheck()).toBe(result);
    });
  });
});
