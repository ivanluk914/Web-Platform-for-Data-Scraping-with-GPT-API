/**
 * Validates an email address.
 * @param email The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
export const validateEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };
  
  /**
   * Validates a password.
   * @param password The password to validate.
   * @returns True if the password meets all criteria, false otherwise.
   */
  export const validatePassword = (password: string): boolean => {
    // Check for minimum length
    if (password.length < 8) return false;
  
    // Check for uppercase, lowercase, digit, and special symbol
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
  
    return hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;
  };
  
  /**
   * Generates an error message for password validation.
   * @returns A string containing the password requirements.
   */
  export const getPasswordErrorMessage = (): string => {
    return 'Password must be at least 8 characters long and include uppercase, lowercase, digit, and special symbol';
  };
  
  /**
   * Checks if a string is empty or only contains whitespace.
   * @param value The string to check.
   * @returns True if the string is empty or only contains whitespace, false otherwise.
   */
  export const isEmpty = (value: string): boolean => {
    return value.trim().length === 0;
  };
  
  /**
   * Validates a name (first name or last name).
   * @param name The name to validate.
   * @returns True if the name is valid, false otherwise.
   */
  export const validateName = (name: string): boolean => {
    return /^[a-zA-Z-' ]{2,30}$/.test(name);
  };
  
  /**
   * Validates a phone number.
   * @param phone The phone number to validate.
   * @returns True if the phone number is valid, false otherwise.
   */
  export const validatePhone = (phone: string): boolean => {
    // This is a simple validation. Adjust as needed for your specific requirements.
    return /^\+?[\d\s-]{10,14}$/.test(phone);
  };

  /**
   * Validates a URL.
   * @param url The URL to validate.
   * @returns True if the URL is valid, false otherwise.
   */
  export const validateURL = (url: string): boolean => {
    const re = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return re.test(url);
  };

  /**
   * Validates that all items in an array are non-empty strings.
   * @param items The array of strings to validate.
   * @returns True if all items are non-empty, false otherwise.
   */
  export const validateNonEmptyArray = (items: string[]): boolean => {
    return items.every(item => item.trim() !== '');
  };

  /**
   * Validates that a string is a positive integer.
   * @param value The string to validate.
   * @returns True if the string is a positive integer, false otherwise.
   */
  export const validatePositiveInteger = (value: string): boolean => {
    return /^\d+$/.test(value) && parseInt(value, 10) > 0;
  };
