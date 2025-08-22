export enum ErrorCode {
  // Common Validation
  V000 = 'common.validation.error',

  // Validation
  V001 = 'user.validation.is_empty',
  V002 = 'user.validation.is_invalid',

  // Error
  E001 = 'username_or_email_exists',
  E002 = 'not_found',
  E003 = 'email_not_exists',
  E004 = 'account_not_active',
}
