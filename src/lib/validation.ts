// Input validation utilities for server-side use

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

export function validatePositiveNumber(value: unknown, fieldName: string): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num) || num <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` };
  }
  return { valid: true };
}

export function validateDate(value: unknown, fieldName: string): ValidationResult {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName} must be a valid date` };
  }
  return { valid: true };
}

export function validateStringLength(
  value: unknown,
  fieldName: string,
  minLength: number,
  maxLength: number
): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.trim().length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  if (value.trim().length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }
  return { valid: true };
}

export function validateEmail(value: unknown): ValidationResult {
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { valid: false, error: 'Valid email is required' };
  }
  return { valid: true };
}

// Validate income input
export function validateIncomeInput(args: {
  source: string;
  amount: number;
  date: string;
  category?: string;
  description?: string;
}): ValidationResult {
  const checks = [
    validateStringLength(args.source, 'Source', 1, 100),
    validatePositiveNumber(args.amount, 'Amount'),
    validateDate(args.date, 'Date'),
  ];

  if (args.category) {
    checks.push(validateStringLength(args.category, 'Category', 1, 50));
  }
  if (args.description) {
    checks.push(validateStringLength(args.description, 'Description', 1, 500));
  }

  for (const check of checks) {
    if (!check.valid) return check;
  }
  return { valid: true };
}

// Validate spending input
export function validateSpendingInput(args: {
  name: string;
  amount: number;
  date: string;
  category?: string;
  description?: string;
}): ValidationResult {
  const checks = [
    validateStringLength(args.name, 'Name', 1, 100),
    validatePositiveNumber(args.amount, 'Amount'),
    validateDate(args.date, 'Date'),
  ];
  if (args.category) checks.push(validateStringLength(args.category, 'Category', 1, 50));
  if (args.description) checks.push(validateStringLength(args.description, 'Description', 1, 500));
  for (const check of checks) {
    if (!check.valid) return check;
  }
  return { valid: true };
}

// Validate goal input
export function validateGoalInput(args: {
  title: string;
  targetAmount: number;
}): ValidationResult {
  const checks = [
    validateStringLength(args.title, 'Goal name', 1, 100),
    validatePositiveNumber(args.targetAmount, 'Target amount'),
  ];

  for (const check of checks) {
    if (!check.valid) return check;
  }
  return { valid: true };
}

// Validate recurring input
export function validateRecurringInput(args: {
  name: string;
  amount: number;
  category?: string;
}): ValidationResult {
  const checks = [
    validateStringLength(args.name, 'Name', 1, 100),
    validatePositiveNumber(args.amount, 'Amount'),
  ];

  if (args.category) {
    checks.push(validateStringLength(args.category, 'Category', 1, 50));
  }

  for (const check of checks) {
    if (!check.valid) return check;
  }
  return { valid: true };
}

// Validate password change
export function validatePasswordChange(args: {
  currentPassword: string;
  newPassword: string;
}): ValidationResult {
  const checks = [
    validateRequired(args.currentPassword, 'Current password'),
    validateStringLength(args.newPassword, 'New password', 8, 128),
  ];

  for (const check of checks) {
    if (!check.valid) return check;
  }
  return { valid: true };
}
