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
				nbVisits: 11635,
				nbActions: 24481,
				nbVisitsConverted: 0,
				bounceCount: 6926,
				sumVisitLength: 1451671,
				maxActions: 46,
				bounceRate: '60%',
				nbActionsPerVisit: 2.1,
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

			await expect(matomoClient.getVisitors()).rejects.toThrowError();
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

	describe('get counters', () => {

		beforeEach(() => {
			mockedAxios.get.mockResolvedValue({
				data: [{
					'visits': '2532',
					'actions': '4988',
					'visitors': '2156',
					'visitsConverted': '0'
				}]
			});
		});
		it('throws an error when lastMinutes is not supplied', async () => {
			//@ts-expect-error test for missing required param
			await expect(() => matomoClient.getCounters()).rejects.toThrowError('lastMinutes must be supplied');
		});

		it('throws an error when lastMinutes is less than 1', async () => {
			await expect(() => matomoClient.getCounters(0)).rejects.toThrowError('lastMinutes must be greater than 0');
		});

		it('throws an error when lastMinutes greater than 4000', async () => {
			await expect(() => matomoClient.getCounters(4001)).rejects.toThrowError('lastMinutes can not be greater than 4000');
		});

		it('decodes an expected response', async () => {
			const expected = [{
				visits: 2532,
				actions: 4988,
				visitors: 2156,
				visitsConverted: 0
			}];

			const result = await matomoClient.getCounters(1);

			expect(result).toEqual(expected);
		});

		it('throws on an unexpected response', async () => {
			mockedAxios.get.mockResolvedValue({
				data: [{
					'visits': true,
					'actions': '4988',
					'visitors': '2156',
					'visitsConverted': '0'
				}]
			});

			await expect(() => matomoClient.getCounters(1)).rejects.toThrowError();
		});

		it('calls the REST API with the Live.getCounters method', async () => {
			await matomoClient.getCounters(1);

			expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('method=Live.getCounters'));
		});

		it('calls the REST API with lastMinutes', async () => {
			await matomoClient.getCounters(500);

			expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('lastMinutes=500'));
		});

	});

});