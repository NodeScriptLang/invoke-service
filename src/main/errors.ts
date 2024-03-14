import { BaseError } from '@nodescript/errors';

export class PreconditionFailedError extends BaseError {
    override status = 499;
}

export class ModuleLoadFailedError extends BaseError {
    override status = 500;
}

export class ModuleImportsNotSupported extends BaseError {
    override status = 500;
}
