import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('FACEBOOK_APP_ID') || 'disabled',
      clientSecret: config.get('FACEBOOK_APP_SECRET') || 'disabled',
      callbackURL: `${config.get('API_URL', 'http://localhost:4000')}/api/v1/auth/facebook/callback`,
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'picture'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; name: { givenName: string; familyName: string }; emails?: { value: string }[]; photos?: { value: string }[] },
    done: (err: Error | null, user?: unknown) => void,
  ) {
    const { id, name, emails, photos } = profile;
    done(null, {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatar: photos?.[0]?.value,
    });
  }
}
