import { format } from 'date-fns';
import { StringifiableRecord, stringifyUrl } from 'query-string';
import axios, { AxiosResponse } from 'axios';
import * as z from 'zod';
import { UnexpectedMatomoResponse } from './error';

export interface MatomoClientOptions {
  siteId: number | string
  authToken: string
  url: string
}

export interface DateRange {
  from: Date
  to: Date
}

type Period = 'day' | 'week' | 'month' | 'year' | DateRange

const requiredOptions = ['siteId', 'authToken', 'url'];

export class MatomoClient {
	options: MatomoClientOptions;

	constructor(options: MatomoClientOptions) {
		if (!options) {
			throw new Error('MatomoClient: missing required options');
		}

		requiredOptions.forEach((key) => {
			if (options[key as keyof MatomoClientOptions] === undefined || options[key as keyof MatomoClientOptions] === null) {
				throw new Error('MatomoClient: missing required option: ' + key);
			}
		});
    
		this.options = options;
	}

	private baseConfig() {
		return {
			module: 'API',
			format: 'json',
			idSite: this.options.siteId,
			'token_auth': this.options.authToken,
		};
	}

	private url(query: StringifiableRecord) {
		return stringifyUrl({url: this.options.url, query});
	}

	private formatDateRange(date: DateRange) {
		const { from, to } = date;

		return `${this.formatDateObj(from)},${this.formatDateObj(to)}`;
	}

	private formatDateObj(date: Date) {
		return format(date, 'yyyy-MM-dd');
	}

  
	private isDateRange (date: Date | DateRange | Period): date is DateRange {
		return (date as DateRange).from !== undefined;
	}

	private formatDate(date: Date | DateRange) {

		return this.isDateRange(date) ? this.formatDateRange(date) : this.formatDateObj(date);
	}

	private parseWith<T extends z.ZodRawShape>(z: z.ZodObject<T> | z.ZodEffects<z.ZodObject<T>>, data: unknown) {
		const result = z.safeParse(data);

		if (result.success === true) {
			return result.data;
		} else {
			throw new UnexpectedMatomoResponse(result.error.errors);
		}
	}

	private parseAxiosResponse<T extends z.ZodRawShape>(z: z.ZodObject<T> | z.ZodEffects<z.ZodObject<T>>) {
		return (res: AxiosResponse) => this.parseWith(z, res.data);
	}

	public async getVisitors(options: {
    period: Period
    date?: Date
  } = { period: 'day', date: new Date()}) {
		const { period = 'day', date = new Date() } = options;

		const formattedDate = this.isDateRange(period) ? this.formatDate(period) : this.formatDate(date);

		const queryObj = {
			...this.baseConfig(),
			method: 'VisitsSummary.get',
			period: this.isDateRange(period) ? 'range' : period,
			date: formattedDate
		};

		const url = this.url(queryObj);

		const expect = z.object({
			'nb_visits': z.number(),
			'nb_actions': z.number(),
			'nb_visits_converted': z.number(),
			'bounce_count': z.number(),
			'sum_visit_length': z.number(),
			'max_actions': z.number(),
			'bounce_rate': z.string(),
			'nb_actions_per_visit': z.number(),
			'avg_time_on_site': z.number()
		});

		return axios.get(url)
			.then(this.parseAxiosResponse(expect)).then(((res) => ({
				visits: res.nb_visits,
				actions: res.nb_actions,
				visitsConverted: res.nb_visits_converted,
				bounceCount: res.bounce_count,
				sumVisitLength: res.sum_visit_length,
				maxActions: res.max_actions,
				bounceRate: res.bounce_rate,
				actionsPerVisit: res.nb_actions_per_visit,
				avgTimeOnSite: res.avg_time_on_site
			})));
	}
}