const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail: mockSendMail }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((_key: string, def?: string) => def ?? ''),
          },
        },
      ],
    }).compile();
    service = module.get<EmailService>(EmailService);
    jest.clearAllMocks();
  });

  it('envoie un email de vérification', async () => {
    await service.sendVerificationEmail({ email: 'u@test.com', firstName: 'Test' }, 'rawtoken');
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u@test.com',
        subject: expect.stringContaining('Vérifie'),
        html: expect.stringContaining('rawtoken'),
      }),
    );
  });

  it('envoie un email de reset', async () => {
    await service.sendPasswordResetEmail({ email: 'u@test.com', firstName: 'Test' }, 'resettoken');
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u@test.com',
        subject: expect.stringContaining('mot de passe'),
        html: expect.stringContaining('resettoken'),
      }),
    );
  });
});
