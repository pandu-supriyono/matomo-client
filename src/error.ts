import { ZodIssue } from 'zod';

export class UnexpectedMatomoResponse extends Error {
	public readonly details: ZodIssue[];

	constructor(details: ZodIssue[]) {
		super('The Matomo API returned an unexpected response and could not be safely typed');

		this.details = details;
	}
}