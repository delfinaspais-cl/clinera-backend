import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
  action?: string;
  resource?: string;
  skip?: boolean;
  includeBody?: boolean;
  includeResponse?: boolean;
}

export const AUDIT_KEY = 'audit';

export const Audit = (options: AuditOptions = {}) => SetMetadata(AUDIT_KEY, options);
