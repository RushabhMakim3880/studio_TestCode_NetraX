
export type Template = {
  id: string;
  name: string;
  type: 'Email' | 'SMS';
  subject?: string;
  body: string;
};

export const initialTemplates: Template[] = [
  {
    id: 'TPL-001',
    name: 'Urgent Password Reset',
    type: 'Email',
    subject: 'Action Required: Your {{company}} password has expired',
    body: 'Dear {{name}},\n\nOur records indicate that your password for your {{company}} account has expired. For security reasons, you must reset it immediately.\n\nPlease click the link below to update your password:\n[Link]\n\nIf you did not request this, please contact IT support.\n\nThank you,\n{{company}} IT Department'
  },
  {
    id: 'TPL-002',
    name: 'Unusual Login Attempt SMS',
    type: 'SMS',
    body: '{{company}} Alert: We detected an unusual login attempt on your account from a new device. If this was not you, please secure your account immediately at [Link].'
  },
    {
    id: 'TPL-003',
    name: 'Invoice Overdue',
    type: 'Email',
    subject: 'Action Needed: Invoice {{invoice_number}} is Overdue',
    body: 'Hi {{name}},\n\nThis is a reminder that invoice #{{invoice_number}} for ${{amount}} is now overdue. Please make a payment as soon as possible to avoid service interruption.\n\nYou can view and pay the invoice here:\n[Link]\n\nRegards,\n{{company}} Billing Team'
  },
  {
    id: 'TPL-004',
    name: 'HR Policy Update',
    type: 'Email',
    subject: 'Important: New {{company}} Work From Home Policy',
    body: 'Hello Team,\n\nPlease be advised that there has been an important update to our Work From Home policy, effective immediately. All employees are required to read and acknowledge the new policy document.\n\nYou can access the updated policy here:\n[Link]\n\nThank you,\n{{company}} Human Resources'
  },
  {
    id: 'TPL-005',
    name: 'Missed Package Delivery',
    type: 'Email',
    subject: 'We missed you! Your package delivery from {{courier}}',
    body: 'Hello {{name}},\n\nOur driver attempted to deliver your package today but was unable to. To avoid having the package returned to the sender, please schedule a new delivery date.\n\nTracking Number: {{tracking_number}}\n\nReschedule your delivery here: [Link]\n\nSincerely,\nThe {{courier}} Team'
  },
  {
    id: 'TPL-006',
    name: 'Shared Document Notification',
    type: 'Email',
    subject: '{{sender_name}} has shared a document with you',
    body: 'Hi {{name}},\n\n{{sender_name}} has shared a file with you titled "{{document_title}}".\n\nPlease review the document by clicking the link below.\n\n[Open Document]\n\nThis link will expire in 24 hours.'
  },
  {
    id: 'TPL-007',
    name: 'IT Security Scan',
    type: 'Email',
    subject: 'Mandatory Security Scan for Your Device',
    body: 'Dear Employee,\n\nAs part of our regular security updates, we require all employees to run a mandatory security scan on their primary work device. Please install the updated security agent from the link below to begin the scan.\n\n[Install Security Agent]\n\nCompliance is required by end of day.\n\nThanks,\n{{company}} IT Security'
  },
  {
    id: 'TPL-008',
    name: 'Cloud Storage Full',
    type: 'Email',
    subject: 'Warning: Your {{cloud_service}} account storage is almost full',
    body: 'Your {{cloud_service}} account has reached 95% of its storage capacity. To avoid losing access to your files, please upgrade your storage plan or free up space.\n\nClick here to manage your storage:\n[Manage Storage]\n\nThank you for using {{cloud_service}}.'
  },
  {
    id: 'TPL-009',
    name: 'CEO Urgent Request (BEC)',
    type: 'Email',
    subject: 'Urgent task - Need your help',
    body: '{{name}},\n\nI need you to handle an urgent wire transfer for me. I\'m in a meeting and can\'t do it myself. Please let me know if you are available to help and I will send the details.\n\nSent from my iPhone\n\n{{ceo_name}}\nCEO, {{company}}'
  },
  {
    id: 'TPL-010',
    name: 'Video Conference Invitation',
    type: 'Email',
    subject: 'Invitation: Project Titan Kick-off Meeting',
    body: 'You are invited to a project kick-off meeting for Project Titan.\n\nPlease join the meeting using the link below:\n[Join Zoom/Teams Meeting]\n\nWe look forward to seeing you there.\n\nBest,\n{{sender_name}}'
  },
  {
    id: 'TPL-011',
    name: 'LinkedIn Connection Request',
    type: 'Email',
    subject: 'You have a new connection request on LinkedIn',
    body: 'Hi {{name}},\n\nYou have a new invitation to connect on LinkedIn from {{sender_name}}, a {{sender_role}} at {{sender_company}}.\n\n[View Invitation]\n\n'
  },
  {
    id: 'TPL-012',
    name: 'E-Fax Notification',
    type: 'Email',
    subject: 'You have received a new E-Fax of {{pages}} pages',
    body: 'You have received a new secure fax.\n\nTo view the document, please log in to our secure portal using the link below.\n\n[View Fax]\n\nReference ID: {{fax_id}}'
  },
  {
    id: 'TPL-013',
    name: 'Microsoft 365 Password Sync Error',
    type: 'Email',
    subject: 'Action Required: Microsoft 365 Password Sync Failed',
    body: 'We were unable to sync your password for your Microsoft 365 account. This might be due to a recent password change.\n\nPlease re-enter your credentials to re-sync your account and avoid being locked out.\n\n[Re-sync Account]\n\nMicrosoft 365 Team'
  },
  {
    id: 'TPL-014',
    name: 'Quarterly Payroll Report',
    type: 'Email',
    subject: 'Confidential: Quarterly Payroll Report',
    body: 'Hi {{name}},\n\nPlease find the attached quarterly payroll report for your review. This document contains sensitive information and should be handled with care.\n\n[Download Report.zip]\n\nThanks,\nFinance Department'
  },
  {
    id: 'TPL-015',
    name: 'Customer Satisfaction Survey',
    type: 'Email',
    subject: 'Share your feedback and get a $25 gift card',
    body: 'Hello {{name}},\n\nThank you for being a loyal customer. We value your opinion! Please take 2 minutes to complete our satisfaction survey. As a thank you, the first 100 respondents will receive a $25 gift card.\n\n[Start Survey]\n\nBest regards,\n{{company}}'
  },
  {
    id: 'TPL-016',
    name: 'IT Helpdesk Ticket Closed',
    type: 'Email',
    subject: 'RE: Your Helpdesk Ticket #{{ticket_id}} has been closed',
    body: 'Hello,\n\nYour support ticket #{{ticket_id}} regarding "{{ticket_subject}}" has been marked as resolved and closed. If you feel this issue is not resolved, please re-open the ticket by clicking the link below.\n\n[View Ticket Details]\n\n{{company}} IT Support'
  },
  {
    id: 'TPL-017',
    name: 'Website Voicemail Notification',
    type: 'Email',
    subject: 'You have a new voicemail from your website',
    body: 'You have a new voicemail message.\n\nCaller ID: {{caller_id}}\nDuration: {{duration}}\n\nClick the attachment to listen to the message.\n\n[voicemail.wav]'
  },
  {
    id: 'TPL-018',
    name: 'Social Media Mention',
    type: 'Email',
    subject: 'Your brand was mentioned on {{platform}}',
    body: 'Hi team,\n\nYour brand, {{company}}, was mentioned in a new post on {{platform}}. View the post to see what people are saying.\n\n[View Mention]\n\nThis is an automated notification.'
  },
  {
    id: 'TPL-019',
    name: 'Secure Document Delivery',
    type: 'Email',
    subject: 'You have received a secure document from {{sender_name}}',
    body: '{{sender_name}} has sent you a secure document via {{secure_service}}.\n\nTo access the document, you will need to verify your identity. Please click the link below to proceed to the secure portal.\n\n[Access Document]\n\nThis link is valid for one-time use only.'
  },
  {
    id: 'TPL-020',
    name: 'Benefits Enrollment Reminder',
    type: 'Email',
    subject: 'REMINDER: Open Enrollment for {{company}} Benefits Ends Soon',
    body: 'Dear {{name}},\n\nThis is a reminder that the open enrollment period for your {{company}} benefits ends in 3 days. If you do not make any changes, your current elections will roll over.\n\nTo review or change your benefits, please visit the employee portal:\n[Employee Portal]\n\nHR Department'
  },
];
