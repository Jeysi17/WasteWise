// Validation utility functions
const validation = {
  
  // ================== COMMON VALIDATORS ==================
  
  /**
   * Validate required fields
   */
  validateRequired: (fields, fieldNames = []) => {
    const errors = [];
    
    fields.forEach((field, index) => {
      if (!field || (typeof field === 'string' && field.trim() === '')) {
        const fieldName = fieldNames[index] || `Field ${index + 1}`;
        errors.push(`${fieldName} is required`);
      }
    });
    
    return errors;
  },
  
  /**
   * Validate email format
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * Validate password strength
   */
  validatePassword: (password) => {
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  },
  
  /**
   * Validate date format (YYYY-MM-DD)
   */
  validateDate: (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return 'Date must be in YYYY-MM-DD format';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return null;
  },
  
  /**
   * Validate numeric range
   */
  validateNumberRange: (value, min, max, fieldName = 'Value') => {
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName} must be a number`;
    }
    if (min !== undefined && num < min) {
      return `${fieldName} must be at least ${min}`;
    }
    if (max !== undefined && num > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return null;
  },
  
  /**
   * Validate file type
   */
  validateFileType: (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
    if (!file) return null;
    
    if (!allowedTypes.includes(file.mimetype)) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }
    
    return null;
  },
  
  /**
   * Validate file size
   */
  validateFileSize: (file, maxSizeInMB = 10) => {
    if (!file) return null;
    
    const maxSize = maxSizeInMB * 1024 * 1024; // Convert to bytes
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }
    
    return null;
  },
  
  // ================== AUTH VALIDATORS ==================
  
  /**
   * Validate user registration data
   */
  validateRegistration: (data) => {
    const errors = [];
    const { username, password, barangay } = data;
    
    // Check required fields
    const requiredErrors = validation.validateRequired([username, password, barangay], ['Username', 'Password', 'Barangay']);
    errors.push(...requiredErrors);
    
    // Validate username length
    if (username && username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    // Validate password strength
    const passwordError = validation.validatePassword(password);
    if (passwordError) errors.push(passwordError);
    
    return errors;
  },
  
  /**
   * Validate login data
   */
  validateLogin: (data) => {
    const errors = [];
    const { username, password } = data;
    
    // Check required fields
    const requiredErrors = validation.validateRequired([username, password], ['Username', 'Password']);
    errors.push(...requiredErrors);
    
    return errors;
  },
  
  // ================== POST/VALIDATION VALIDATORS ==================
  
  /**
   * Validate post creation data
   */
  validatePostCreation: (data, file = null) => {
    const errors = [];
    const { name, title, details, location } = data;
    
    // Check required fields
    const requiredErrors = validation.validateRequired([name, title, location], ['Name', 'Title', 'Location']);
    errors.push(...requiredErrors);
    
    // Validate title length
    if (title && title.length < 5) {
      errors.push('Title must be at least 5 characters long');
    }
    
    // Validate details length
    if (details && details.length < 10) {
      errors.push('Details must be at least 10 characters long');
    }
    
    // Validate file if provided
    if (file) {
      const fileTypeError = validation.validateFileType(file);
      if (fileTypeError) errors.push(fileTypeError);
      
      const fileSizeError = validation.validateFileSize(file);
      if (fileSizeError) errors.push(fileSizeError);
    }
    
    return errors;
  },
  
  // ================== SCHEDULE VALIDATORS ==================
  
  /**
   * Validate schedule creation data
   */
  validateScheduleCreation: (data) => {
    const errors = [];
    const { barangay, zone_number, schedule_date } = data;
    
    // Check required fields
    const requiredErrors = validation.validateRequired([barangay, zone_number, schedule_date], ['Barangay', 'Zone Number', 'Schedule Date']);
    errors.push(...requiredErrors);
    
    // Validate zone number
    if (zone_number) {
      const zoneError = validation.validateNumberRange(zone_number, 1, 100, 'Zone number');
      if (zoneError) errors.push(zoneError);
    }
    
    // Validate date
    if (schedule_date) {
      const dateError = validation.validateDate(schedule_date);
      if (dateError) errors.push(dateError);
      
      // Validate that date is not in the past
      if (!dateError) {
        const scheduleDate = new Date(schedule_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (scheduleDate < today) {
          errors.push('Schedule date cannot be in the past');
        }
      }
    }
    
    return errors;
  },
  
  // ================== DEVICE REGISTRATION VALIDATORS ==================
  
  /**
   * Validate device registration data
   */
  validateDeviceRegistration: (data) => {
    const errors = [];
    const { barangay, expo_push_token } = data;
    
    // Check required fields
    const requiredErrors = validation.validateRequired([barangay, expo_push_token], ['Barangay', 'Expo Push Token']);
    errors.push(...requiredErrors);
    
    // Validate Expo push token format (basic validation)
    if (expo_push_token && !expo_push_token.startsWith('ExponentPushToken[')) {
      errors.push('Invalid Expo push token format');
    }
    
    return errors;
  },
  
  // ================== WASTE ENTRIES VALIDATORS ==================
  
  /**
   * Validate waste entry data
   */
  validateWasteEntry: (data) => {
    const errors = [];
    const { category, kilograms, barangay, week_of_month } = data;
    
    // Check required fields
    const requiredErrors = validation.validateRequired([category, kilograms, barangay, week_of_month], ['Category', 'Kilograms', 'Barangay', 'Week of Month']);
    errors.push(...requiredErrors);
    
    // Validate kilograms
    if (kilograms) {
      const kgError = validation.validateNumberRange(kilograms, 0.1, 10000, 'Kilograms');
      if (kgError) errors.push(kgError);
    }
    
    // Validate week of month
    if (week_of_month) {
      const weekError = validation.validateNumberRange(week_of_month, 1, 5, 'Week of month');
      if (weekError) errors.push(weekError);
    }
    
    // Validate category
    const validCategories = ['plastic', 'paper', 'metal', 'glass', 'organic', 'hazardous', 'other'];
    if (category && !validCategories.includes(category.toLowerCase())) {
      errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    
    return errors;
  },
  
  /**
   * Validate bulk waste entries
   */
  validateBulkWasteEntries: (rows) => {
    const errors = [];
    
    if (!Array.isArray(rows)) {
      errors.push('Rows must be an array');
      return errors;
    }
    
    if (rows.length === 0) {
      errors.push('No data provided');
      return errors;
    }
    
    rows.forEach((row, index) => {
      const rowErrors = validation.validateWasteEntry(row);
      if (rowErrors.length > 0) {
        errors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
      }
    });
    
    return errors;
  },
  
  // ================== KPI VALIDATORS ==================
  
  /**
   * Validate KPI data
   */
  validateKPI: (data) => {
    const errors = [];
    const { kpi_date, complaints, solved, users_count } = data;
    
    // Check required fields
    if (!kpi_date) {
      errors.push('KPI date is required');
    }
    
    // Validate date
    if (kpi_date) {
      const dateError = validation.validateDate(kpi_date);
      if (dateError) errors.push(dateError);
    }
    
    // Validate numeric fields
    if (complaints !== undefined) {
      const complaintsError = validation.validateNumberRange(complaints, 0, 1000000, 'Complaints');
      if (complaintsError) errors.push(complaintsError);
    }
    
    if (solved !== undefined) {
      const solvedError = validation.validateNumberRange(solved, 0, 1000000, 'Solved');
      if (solvedError) errors.push(solvedError);
    }
    
    if (users_count !== undefined) {
      const usersError = validation.validateNumberRange(users_count, 0, 1000000, 'Users count');
      if (usersError) errors.push(usersError);
    }
    
    return errors;
  },
  
  // ================== COMPLAINT VALIDATORS ==================
  
  /**
   * Validate complaint entry data
   */
  validateComplaintEntry: (data) => {
    const errors = [];
    const { category, count, barangay, week_of_month } = data;
    
    // Check required fields
    const requiredErrors = validation.validateRequired([category, barangay, week_of_month], ['Category', 'Barangay', 'Week of Month']);
    errors.push(...requiredErrors);
    
    // Validate count
    if (count !== undefined) {
      const countError = validation.validateNumberRange(count, 0, 1000000, 'Count');
      if (countError) errors.push(countError);
    }
    
    // Validate week of month
    if (week_of_month) {
      const weekError = validation.validateNumberRange(week_of_month, 1, 5, 'Week of month');
      if (weekError) errors.push(weekError);
    }
    
    return errors;
  },
  
  /**
   * Validate bulk complaint entries
   */
  validateBulkComplaintEntries: (rows) => {
    const errors = [];
    
    if (!Array.isArray(rows)) {
      errors.push('Rows must be an array');
      return errors;
    }
    
    if (rows.length === 0) {
      errors.push('No data provided');
      return errors;
    }
    
    rows.forEach((row, index) => {
      const rowErrors = validation.validateComplaintEntry(row);
      if (rowErrors.length > 0) {
        errors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
      }
    });
    
    return errors;
  },
  
  // ================== ANALYTICS VALIDATORS ==================
  
  /**
   * Validate analytics query parameters
   */
  validateAnalyticsQuery: (query) => {
    const errors = [];
    const { period, year, month, week, barangay } = query;
    
    // Validate period
    const validPeriods = ['week', 'month', 'year'];
    if (period && !validPeriods.includes(period)) {
      errors.push(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }
    
    // Validate year
    if (year) {
      const yearError = validation.validateNumberRange(year, 2000, 2100, 'Year');
      if (yearError) errors.push(yearError);
    }
    
    // Validate month
    if (month) {
      const monthError = validation.validateNumberRange(month, 1, 12, 'Month');
      if (monthError) errors.push(monthError);
    }
    
    // Validate week
    if (week) {
      const weekError = validation.validateNumberRange(week, 1, 53, 'Week');
      if (weekError) errors.push(weekError);
    }
    
    return errors;
  },
  
  // ================== NOTIFICATION VALIDATORS ==================
  
  /**
   * Validate notification data
   */
  validateNotification: (data) => {
    const errors = [];
    const { title, message, user_id, barangay } = data;
    
    // Check required fields
    if (!title && !message) {
      errors.push('Either title or message is required');
    }
    
    // Validate title length
    if (title && title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }
    
    // Validate message length
    if (message && message.length > 1000) {
      errors.push('Message must be less than 1000 characters');
    }
    
    // Either user_id or barangay must be provided
    if (!user_id && !barangay) {
      errors.push('Either user_id or barangay must be provided');
    }
    
    return errors;
  },
  
  // ================== ID VALIDATION ==================
  
  /**
   * Validate ID parameter
   */
  validateId: (id) => {
    const errors = [];
    
    if (!id || id.trim() === '') {
      errors.push('ID is required');
    }
    
    if (id && id.length > 100) {
      errors.push('ID is too long');
    }
    
    return errors;
  },
  
  // ================== MIDDLEWARE FUNCTIONS ==================
  
  /**
   * Middleware to validate request body against a validator function
   */
  validateRequestBody: (validatorFn) => {
    return (req, res, next) => {
      const errors = validatorFn(req.body);
      
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      
      next();
    };
  },
  
  /**
   * Middleware to validate request query parameters
   */
  validateRequestQuery: (validatorFn) => {
    return (req, res, next) => {
      const errors = validatorFn(req.query);
      
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: errors
        });
      }
      
      next();
    };
  },
  
  /**
   * Middleware to validate ID parameter
   */
  validateIdParam: (req, res, next) => {
    const errors = validation.validateId(req.params.id);
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Invalid ID',
        details: errors
      });
    }
    
    next();
  },
  
  /**
   * Middleware to validate file upload
   */
  validateFileUpload: (req, res, next) => {
    if (!req.file) {
      return next(); // File is optional in some cases
    }
    
    const fileTypeError = validation.validateFileType(req.file);
    const fileSizeError = validation.validateFileSize(req.file);
    
    const errors = [];
    if (fileTypeError) errors.push(fileTypeError);
    if (fileSizeError) errors.push(fileSizeError);
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'File validation failed',
        details: errors
      });
    }
    
    next();
  },
  
  /**
   * Utility to handle validation and send errors
   */
  handleValidation: (errors, res) => {
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    return null;
  }
};

module.exports = validation;