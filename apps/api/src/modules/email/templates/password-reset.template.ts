export function passwordResetTemplate(firstName: string, link: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;padding:40px 32px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:32px;font-weight:900;color:#E11D48;letter-spacing:-1px">VEYA</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px">Réinitialisation du mot de passe</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px">
      Salut ${firstName}, tu as demandé à réinitialiser ton mot de passe VEYA. Clique ci-dessous.
    </p>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${link}" style="background:#E11D48;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">
      Ce lien expire dans 1 heure. Si tu n'as pas demandé cette réinitialisation, ignore cet email.
    </p>
  </div>
</body>
</html>`;
}
