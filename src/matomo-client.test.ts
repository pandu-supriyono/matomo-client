import { MatomoClient } from './matomo-client';
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('axios');

describe('matomo client', () => {
	let matomoClient: MatomoClient;
	const getSpy = jest.spyOn(axios, 'get');


	beforeEach(() => {
		jest.resetAllMocks();
		matomoClient = new MatomoClient({
			siteId: '1',
			url: 'url',
			authToken: 'token',
		});

		mockedAxios.get.mockResolvedValue({
			data: {
				'nb_visits': 11635,
				'nb_actions': 24481,
				'nb_visits_converted': 0,
				'bounce_count': 6926,
				'sum_visit_length': 1451671,
				'max_actions': 46,
				'bounce_rate': '60%',
				'nb_actions_per_visit': 2.1,
				'avg_time_on_site': 125
			}
		});

	});

	it('throws when the config is not set', () => {
		//@ts-expect-error test for missing required options
		expect(() => new MatomoClient()).toThrowError('MatomoClient: missing required options');
	});

	describe('throws when the config is not complete', () => {
		it('throws when a site ID is not supplied', () => {
			//@ts-expect-error test for missing required options
			expect(() => new MatomoClient({
				authToken: '2',
				url: 'url'
			})).toThrowError('MatomoClient: missing required option: siteId');
		});

		it('throws when an auth token is not supplied', () => {
			//@ts-expect-error test for missing required options
			expect(() => new MatomoClient({
				siteId: 2,
				url: 'url'
			})).toThrowError('MatomoClient: missing required option: authToken');
		});

		it('throws when a url is not supplied', () => {
			//@ts-expect-error test for missing required options
			expect(() => new MatomoClient({
				siteId: 2,
				authToken: '2',
			})).toThrowError('MatomoClient: missing required option: url');
		});

	});

	describe('get visitors', () => {
		it('decodes an expected response', async () => {
			const result = await matomoClient.getVisitors();

			const expected = {
				visits: 11635,
				actions: 24481,
				visitsConverted: 0,
				bounceCount: 6926,
				sumVisitLength: 1451671,
				maxActions: 46,
				bounceRate: '60%',
				actionsPerVisit: 2.1,
				avgTimeOnSite: 125
			};

			expect(result).toEqual(expected);
		});

		it('throws an error on an unexpected response', async () => {
			mockedAxios.get.mockResolvedValue({
				data: {
					'nb_actions': 'unexpected'
				}
			});

			await expect(matomoClient.getVisitors()).rejects.toThrowError('The Matomo API returned an unexpected response and could not be safely typed');
		});

		it('calls axios get with the supplied url', async() => {
			await matomoClient.getVisitors();

			expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('url?'));
		});

		it('formats a date range', async() => {
			await matomoClient.getVisitors({
				period: {
					from: new Date('2020-01-01'),
					to: new Date('2021-01-01')
				}
			});

			expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('date=2020-01-01%2C2021-01-01'));
			expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('period=range'));
		});

		it('formats a non-date range', async () => {
			await matomoClient.getVisitors({
				period: 'month',
				date: new Date('2022-12-01')	
			});

			expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('date=2022-12-01'));
			expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('period=month'));
		});


	});

});