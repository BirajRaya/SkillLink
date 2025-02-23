/**
 * Validation utilities for authentication
 */
const validateSignupInput = (data) => {
  const errors = [];
  const { fullName, email, password, phone, address } = data;
  
  // Required field validations
  if (!fullName) errors.push('Full Name is required');
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  if (!phone) errors.push('Phone number is required');
  if (!address) errors.push('Address is required');

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Password length validation
  if (password && password.length < 7) {
    errors.push('Password must be at least 7 characters long');
  }

  // Phone number format validation (optional)
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  if (phone && !phoneRegex.test(phone)) {
    errors.push('Invalid phone number format');
  }

  return errors;
};

module.exports = {
  validateSignupInput
};