import { BaseError } from '@nodescript/errors';

export class PreconditionFailedError extends BaseError {

    override status = 499;

}
