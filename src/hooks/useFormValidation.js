import { useCallback, useState } from 'react';
import { validateEmail, validateName, validatePassword } from '../lib/validationService';

/**
 * Custom hook for form validation with detailed error messages
 */
export const useFormValidation = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    let error = null;

    if (!value || value.trim() === '') {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    } else {
      switch (name.toLowerCase()) {
        case 'email':
          const emailValidation = validateEmail(value);
          if (!emailValidation.isValid) {
            error = 'Please enter a valid email address (e.g., user@example.com)';
          }
          break;
        case 'password':
          const passwordValidation = validatePassword(value);
          if (!passwordValidation.isValid) {
            error = passwordValidation.error || 'Password must be at least 8 characters';
          }
          break;
        case 'name':
        case 'fullname':
        case 'full_name':
          const nameValidation = validateName(value);
          if (!nameValidation.isValid) {
            error = 'Name must be 2-50 characters and contain only letters, spaces, and hyphens';
          }
          break;
        case 'confirmpassword':
          if (value !== values.password) {
            error = 'Passwords do not match';
          }
          break;
        case 'phone':
          if (!/^[\d\s\-\+\(\)]{10,}$/.test(value)) {
            error = 'Please enter a valid phone number';
          }
          break;
        case 'description':
          if (value.length < 10) {
            error = 'Description must be at least 10 characters';
          }
          if (value.length > 500) {
            error = 'Description cannot exceed 500 characters';
          }
          break;
        default:
          break;
      }
    }

    return error;
  }, [values]);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    const error = validateField(name, values[name]);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [values, validateField]);

  const validateForm = useCallback((fieldsToValidate) => {
    const newErrors = {};
    let isValid = true;

    Object.entries(fieldsToValidate).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setValues,
    setErrors,
  };
};
