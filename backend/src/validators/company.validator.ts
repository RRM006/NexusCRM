import { body, param, ValidationChain } from 'express-validator';
import { prisma } from '../index';

export const createCompanyValidator: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('slug')
    .optional()
    .trim()
    .isSlug()
    .withMessage('Invalid slug format')
    .custom(async (slug: string) => {
      if (slug) {
        const existingCompany = await prisma.company.findUnique({
          where: { slug }
        });
        if (existingCompany) {
          throw new Error('This slug is already taken');
        }
      }
      return true;
    }),

  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL'),

  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry must be less than 100 characters'),

  body('size')
    .optional()
    .trim()
    .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .withMessage('Invalid company size'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number')
];

export const updateCompanyValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid company ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('slug')
    .optional()
    .trim()
    .isSlug()
    .withMessage('Invalid slug format')
    .custom(async (slug: string, { req }) => {
      if (slug) {
        const existingCompany = await prisma.company.findFirst({
          where: {
            slug,
            NOT: { id: req.params?.id }
          }
        });
        if (existingCompany) {
          throw new Error('This slug is already taken');
        }
      }
      return true;
    }),

  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
];

export const companyIdValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid company ID')
];

