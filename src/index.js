'use strict';
const {resolve, parse} = require('url'); // eslint-disable-line node/no-deprecated-api
const cheerio = require('cheerio');
const normalizeUrl = require('normalize-url');

const FAKE_PROTOCOL = 'http:';
const FAKE_HOSTNAME = 'base.url';

const defaultNormalizeOpts = {
	stripWWW: false,
	defaultProtocol: ''
};
const defaultAllowedProtocols = {
	http: true,
	https: true
};

const unique = arr => [...new Set(arr)];

const tryNormalize = (url, opts) => {
	try {
		return normalizeUrl(url, opts);
	} catch (error) {
		return url;
	}
};

const isFake = url =>
	url.protocol === FAKE_PROTOCOL && url.hostname === FAKE_HOSTNAME;

const stripFake = url =>
	url.slice(FAKE_PROTOCOL.length + FAKE_HOSTNAME.length + 2);

const getHrefs = (
	html,
	{
		baseUrl = `${FAKE_PROTOCOL}//${FAKE_HOSTNAME}`,
		allowedProtocols,
		...normalizeOpts
	} = {}
) => {
	if (typeof html !== 'string') {
		throw new TypeError(
			`getHrefs expected a \`string\` but got: \`${typeof html}\``
		);
	}

	const opts = {...defaultNormalizeOpts, ...normalizeOpts};
	const protocols = {...defaultAllowedProtocols, ...allowedProtocols};
	const $ = cheerio.load(html);
	const base = $('base');

	if (base.length !== 0) {
		baseUrl = resolve(baseUrl, base.first().attr('href') || '');
	}

	const hrefs = $('a')
		.map((_, el) => $(el).attr('href'))
		.get();

	const filteredHrefs = hrefs.reduce((hrefs, href) => {
		if (!href || href === '#') {
			return hrefs;
		}

		try {
			const url = parse(resolve(baseUrl, href));
			if (isFake(url)) {
				hrefs.push(stripFake(tryNormalize(url.format(), opts)));
			} else if (protocols[url.protocol.slice(0, -1)]) {
				hrefs.push(tryNormalize(url.format(), opts));
			}
		} catch (error) {
			// Ignore errors (they are caused by invalid URLs and we don't care about them anyway)
		}

		return hrefs;
	}, []);

	return unique(filteredHrefs);
};

module.exports = getHrefs;
