import { config } from 'dotenv';
import { MatomoClient, MatomoClientOptions } from '../src/matomo-client';

config();

describe('Matomo Client', () => {
	let matomoClient: MatomoClient;

	beforeEach(() => {
		matomoClient = new MatomoClient({
			url: process.env.MATOMO_SITE_URL,
			authToken: process.env.MATOMO_AUTH_TOKEN,
			siteId: process.env.MATOMO_SITE_ID
		} as MatomoClientOptions);
	});

	describe('get visitors', () => {
		it('calls with default params', async () => {
			await (expect(matomoClient.getVisitors()).resolves.toBeDefined());
		});

		it('calls with date ranges', async () => {
			await (expect(matomoClient.getVisitors({
				period: {
					from: new Date('2020-01-01'),
					to: new Date('2021-01-1')
				}
			})).resolves.toBeDefined());
		});
	});

	describe('get page titles', () => {
		it('calls with default params', async () => {
			await (expect(matomoClient.getPageTitles()).resolves.toBeDefined());
		});

		it('calls with date ranges', async () => {
			await (expect(matomoClient.getPageTitles({
				period: {
					from: new Date('2020-01-01'),
					to: new Date('2021-01-1')
				}
			})).resolves.toBeDefined());
		});
	});
});