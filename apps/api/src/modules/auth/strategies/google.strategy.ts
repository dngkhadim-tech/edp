import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') || 'disabled',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') || 'disabled',
      callbackURL: `${config.get('API_URL', 'http://localhost:4000')}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; name: { givenName: string; familyName: string }; emails: { value: string }[]; photos: { value: string }[] },
    done: VerifyCallback,
  ) {
    const { id, name, emails, photos } = profile;
    done(null, {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatar: photos[0]?.value,
    });
  }
}
