const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.verifyPromise = null;
  }

  isConfigured() {
    const hasService = Boolean(process.env.SMTP_SERVICE);
    const hasHostPort = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
    const hasAuth = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    return hasAuth && (hasService || hasHostPort);
  }

  getTransporter() {
    if (this.transporter) return this.transporter;
    if (!this.isConfigured()) return null;

    const transportConfig = {
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false'
      }
    };

    if (process.env.SMTP_SERVICE) {
      transportConfig.service = process.env.SMTP_SERVICE;
    } else {
      transportConfig.host = process.env.SMTP_HOST;
      transportConfig.port = Number(process.env.SMTP_PORT || 587);
      transportConfig.secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    }

    this.transporter = nodemailer.createTransport(transportConfig);

    return this.transporter;
  }

  async verifyConnection() {
    const transporter = this.getTransporter();
    if (!transporter) return { ok: false, reason: 'SMTP not configured' };

    if (!this.verifyPromise) {
      this.verifyPromise = transporter.verify()
        .then(() => ({ ok: true }))
        .catch((error) => ({ ok: false, reason: error.message || 'SMTP verify failed' }));
    }

    return this.verifyPromise;
  }

  getFromAddress() {
    return process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@astu.edu.et';
  }

  async sendMail({ to, subject, text, html }) {
    const transporter = this.getTransporter();
    if (!transporter) {
      console.warn(`Email not sent (SMTP not configured): ${subject} -> ${to}`);
      return false;
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        to,
        subject,
        text,
        html
      });
    } catch (error) {
      console.error(`Email send failed: ${subject} -> ${to}. ${error.message}`);
      return false;
    }

    return true;
  }

  async sendAccountCreationEmail(user, generatedPassword) {
    if (!user?.email) return false;

    const subject = 'Your ASTU Smart Complaint System Account';
    const text = [
      `Hello ${user.name},`,
      '',
      'An administrator has created your account in ASTU Smart Complaint System.',
      `Email: ${user.email}`,
      `Role: ${user.role}`,
      `Temporary password: ${generatedPassword}`,
      '',
      'Please sign in and change your password immediately.'
    ].join('\n');

    const html = `
      <p>Hello ${user.name},</p>
      <p>An administrator has created your account in <strong>ASTU Smart Complaint System</strong>.</p>
      <p><strong>Email:</strong> ${user.email}<br />
      <strong>Role:</strong> ${user.role}<br />
      <strong>Temporary password:</strong> ${generatedPassword}</p>
      <p>Please sign in and change your password immediately.</p>
    `;

    return this.sendMail({ to: user.email, subject, text, html });
  }

  async sendStatusUpdateEmail(user, complaint, oldStatus, newStatus) {
    if (!user?.email) return false;
    const subject = `Complaint Status Updated: ${complaint.title}`;
    const text = [
      `Hello ${user.name},`,
      '',
      `Your complaint "${complaint.title}" status changed from "${oldStatus}" to "${newStatus}".`,
      '',
      'Please log in to review details.'
    ].join('\n');

    const html = `
      <p>Hello ${user.name},</p>
      <p>Your complaint <strong>${complaint.title}</strong> status changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
      <p>Please log in to review details.</p>
    `;

    return this.sendMail({ to: user.email, subject, text, html });
  }

  async sendVerificationEmail(user, complaint, action, comment) {
    if (!user?.email) return false;
    const actionText = action === 'reopen' ? 'reopened' : 'confirmed as fixed';
    const subject = `Complaint ${action === 'reopen' ? 'Reopened' : 'Verified'}: ${complaint.title}`;
    const text = [
      `Hello ${user.name},`,
      '',
      `Complaint "${complaint.title}" was ${actionText} by student ${comment ? `with comment: "${comment}"` : ''}.`,
      '',
      'Please log in for details.'
    ].join('\n');
    const html = `
      <p>Hello ${user.name},</p>
      <p>Complaint <strong>${complaint.title}</strong> was ${actionText}${comment ? ` with comment: "${comment}"` : ''}.</p>
      <p>Please log in for details.</p>
    `;

    return this.sendMail({ to: user.email, subject, text, html });
  }

  async sendPasswordResetEmail(user, resetUrl) {
    if (!user?.email) return false;
    const subject = 'Reset your ASTU Smart account password';
    const text = [
      `Hello ${user.name},`,
      '',
      'You requested a password reset. Use the link below to set a new password:',
      resetUrl,
      '',
      'This link expires in 10 minutes. If you did not request this, ignore this email.'
    ].join('\n');

    const html = `
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Use the link below to set a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 10 minutes. If you did not request this, ignore this email.</p>
    `;

    return this.sendMail({ to: user.email, subject, text, html });
  }

  async sendRegistrationRequestAlert(adminUser, requestData) {
    if (!adminUser?.email) return false;
    const subject = `New Registration Request: ${requestData.studentId}`;
    const text = [
      `Hello ${adminUser.name || 'Admin'},`,
      '',
      'A new student registration request has been submitted.',
      `Name: ${requestData.name}`,
      `Email: ${requestData.email}`,
      `Student ID: ${requestData.studentId}`,
      '',
      'Please review the profile and ID photo in the admin panel.'
    ].join('\n');

    const html = `
      <p>Hello ${adminUser.name || 'Admin'},</p>
      <p>A new student registration request has been submitted.</p>
      <p><strong>Name:</strong> ${requestData.name}<br />
      <strong>Email:</strong> ${requestData.email}<br />
      <strong>Student ID:</strong> ${requestData.studentId}</p>
      <p>Please review the profile and ID photo in the admin panel.</p>
    `;

    return this.sendMail({ to: adminUser.email, subject, text, html });
  }

  async sendRegistrationPendingEmail(request) {
    const subject = 'Registration request received (Pending Review)';
    const text = [
      `Hello ${request.name},`,
      '',
      'Your registration request has been received and is currently pending admin review.',
      `Student ID: ${request.studentId}`,
      '',
      'You will receive another email once your request is approved or rejected.'
    ].join('\n');

    const html = `
      <p>Hello ${request.name},</p>
      <p>Your registration request has been received and is currently <strong>pending admin review</strong>.</p>
      <p><strong>Student ID:</strong> ${request.studentId}</p>
      <p>You will receive another email once your request is approved or rejected.</p>
    `;

    return this.sendMail({ to: request.email, subject, text, html });
  }

  async sendRegistrationApprovedEmail(request, generatedPassword) {
    const subject = 'Your ASTU registration request was approved';
    const text = [
      `Hello ${request.name},`,
      '',
      'Your registration request has been approved.',
      `Email: ${request.email}`,
      `Temporary password: ${generatedPassword}`,
      '',
      'Please sign in and change your password immediately.'
    ].join('\n');

    const html = `
      <p>Hello ${request.name},</p>
      <p>Your registration request has been <strong>approved</strong>.</p>
      <p><strong>Email:</strong> ${request.email}<br />
      <strong>Temporary password:</strong> ${generatedPassword}</p>
      <p>Please sign in and change your password immediately.</p>
    `;

    return this.sendMail({ to: request.email, subject, text, html });
  }

  async sendRegistrationRejectedEmail(request, rejectionReason = '') {
    const subject = 'Your ASTU registration request was rejected';
    const text = [
      `Hello ${request.name},`,
      '',
      'Your registration request has been rejected.',
      rejectionReason ? `Reason: ${rejectionReason}` : '',
      '',
      'Please contact support if you need assistance.'
    ].filter(Boolean).join('\n');

    const html = `
      <p>Hello ${request.name},</p>
      <p>Your registration request has been <strong>rejected</strong>.</p>
      ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
      <p>Please contact support if you need assistance.</p>
    `;

    return this.sendMail({ to: request.email, subject, text, html });
  }

  async sendUserRemovalEmail(user, reason = '') {
    if (!user?.email) return false;
    const subject = 'Your ASTU Account Has Been Removed';
    const text = [
      `Hello ${user.name},`,
      '',
      'Your account in the ASTU Smart Complaint System has been removed by an administrator.',
      reason ? `Reason: ${reason}` : '',
      '',
      'If you believe this is an error, please contact support.'
    ].filter(Boolean).join('\n');

    const html = `
      <p>Hello ${user.name},</p>
      <p>Your account in the <strong>ASTU Smart Complaint System</strong> has been removed by an administrator.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this is an error, please contact support.</p>
    `;

    return this.sendMail({ to: user.email, subject, text, html });
  }

  async sendAccountDeletionEmail(user, reason = '') {
    if (!user?.email) return false;
    const subject = 'Your ASTU Student Account Has Been Removed';
    const text = [
      `Hello ${user.name},`,
      '',
      'Your student account in the ASTU Smart Complaint System has been removed by staff.',
      reason ? `Reason: ${reason}` : '',
      '',
      'If you believe this is an error, please contact your department staff or support.'
    ].filter(Boolean).join('\n');

    const html = `
      <p>Hello ${user.name},</p>
      <p>Your student account in the <strong>ASTU Smart Complaint System</strong> has been removed by staff.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this is an error, please contact your department staff or support.</p>
    `;

    return this.sendMail({ to: user.email, subject, text, html });
  }

  async sendStudentCredentialsEmail(student, generatedPassword) {
    if (!student?.email) return false;
    const subject = 'Your ASTU Student Account Has Been Created';
    const text = [
      `Hello ${student.name},`,
      '',
      'A staff member has created your student account in the ASTU Smart Complaint System.',
      `Student ID: ${student.studentId}`,
      `Email: ${student.email}`,
      `Password: ${generatedPassword}`,
      `Department: ${student.department}`,
      '',
      'You can now log in using your Student ID and the password above.',
      'Please change your password after your first login for security.',
      '',
      `Login at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
    ].join('\n');

    const html = `
      <p>Hello <strong>${student.name}</strong>,</p>
      <p>A staff member has created your student account in the <strong>ASTU Smart Complaint System</strong>.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Student ID:</strong> ${student.studentId}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${student.email}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #fff; padding: 3px 8px; border-radius: 4px;">${generatedPassword}</code></p>
        <p style="margin: 5px 0;"><strong>Department:</strong> ${student.department}</p>
      </div>
      <p>You can now log in using your <strong>Student ID</strong> and the password above.</p>
      <p>Please change your password after your first login for security.</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px;">Login Now</a></p>
    `;

    return this.sendMail({ to: student.email, subject, text, html });
  }
}

module.exports = new EmailService();
