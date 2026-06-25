// ── Email 1: sent to school contact on request submission ──────────────────
export function requestReceivedEmail(contactName: string, schoolName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1a1a2e">
      <div style="background:#171D53;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;font-size:24px;margin:0">Tègbalé</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <h2 style="font-size:20px;margin-top:0">We've received your request!</h2>
        <p>Hi ${contactName},</p>
        <p>Thank you for your interest in Tègbalé. We've received your request to onboard <strong>${schoolName}</strong> onto our platform.</p>
        <p>Our team will review your request and reach out to you within <strong>1–2 business days</strong> to set up your school account.</p>
        <p>In the meantime, feel free to reply to this email if you have any questions.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:13px;color:#6b7280">Tègbalé — School Management Platform<br/>Built by Breme Technologies Limited</p>
      </div>
    </div>
  `;
}

// ── Email 2: sent to superadmin on new request ─────────────────────────────
export function newRequestNotificationEmail(
  schoolName: string,
  contactName: string,
  contactEmail: string,
  contactPhone: string | undefined,
  city: string | undefined,
  country: string | undefined,
  message: string | undefined,
  requestId: string,
): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1a1a2e">
      <div style="background:#171D53;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;font-size:24px;margin:0">Tègbalé</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <h2 style="font-size:20px;margin-top:0">New School Request</h2>
        <p>A new school has requested access to the platform:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#6b7280;width:40%">School name</td><td style="padding:8px 0;font-weight:600">${schoolName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Contact person</td><td style="padding:8px 0">${contactName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0">${contactEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Phone</td><td style="padding:8px 0">${contactPhone ?? '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Location</td><td style="padding:8px 0">${[city, country].filter(Boolean).join(', ') || '—'}</td></tr>
          ${message ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Message</td><td style="padding:8px 0">${message}</td></tr>` : ''}
        </table>
        <p style="margin-top:24px;font-size:13px;color:#6b7280">Request ID: ${requestId}<br/>Log in to the Tègbalé Super Admin portal to review and approve this request.</p>
      </div>
    </div>
  `;
}

// ── Email 3: sent to school admin when account is created ──────────────────
export function accountCreatedEmail(
  adminName: string,
  schoolName: string,
  loginEmail: string,
  tempPassword: string,
  loginUrl: string,
): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1a1a2e">
      <div style="background:#171D53;padding:24px 32px;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;font-size:24px;margin:0">Tègbalé</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
        <h2 style="font-size:20px;margin-top:0">Your school account is ready!</h2>
        <p>Hi ${adminName},</p>
        <p>Great news — your Tègbalé account for <strong>${schoolName}</strong> has been set up. You can now log in and start managing your school.</p>
        <div style="background:#f8f9ff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Your login credentials</p>
          <p style="margin:4px 0"><strong>Email:</strong> ${loginEmail}</p>
          <p style="margin:4px 0"><strong>Temporary password:</strong> <span style="font-family:monospace;background:#e5e7eb;padding:2px 6px;border-radius:4px">${tempPassword}</span></p>
        </div>
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-bottom:24px;font-size:13px">
          ⚠️ <strong>Please change your password immediately after your first login.</strong>
        </div>
        <a href="${loginUrl}" style="display:inline-block;background:#408ED5;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">Log in to Tègbalé</a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:13px;color:#6b7280">If you did not expect this email, please contact us at hello@tegbale.com</p>
      </div>
    </div>
  `;
}
