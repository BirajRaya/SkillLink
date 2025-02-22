/**
 * Validation utilities for authentication
 */
const validateSignupInput = (data) => {
    const errors = [];
    const { fullName, email, password, phone, address } = data;
    
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
  
    return errors;
  };
  
  module.exports = {
    validateSignupInput
  };