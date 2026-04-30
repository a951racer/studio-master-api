import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';

export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    next();
  };
}
