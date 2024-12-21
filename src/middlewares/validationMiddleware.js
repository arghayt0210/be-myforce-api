import { ZodError } from 'zod';
// Change to default export
const validateRequest = (schema) => async (req, res, next) => {
  try {
    // Parse form data fields
    const dataToValidate = { ...req.body };

    // Validate the data against the schema
    await schema.parseAsync(dataToValidate);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod errors
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }
    next(error);
  }
};
// Export as default
export default validateRequest;
