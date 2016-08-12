import chai from 'chai';
import {
	readTimeStampAsync,
	readXstats,
	readXstatsAsync,
	updateXattrPermissionAsync,
	updateXattrHashAsync,
	testing
} from '../../src/lib/xstat.js';

const expect = chai.expect;
const FRUITMIX = 'user.fruitmix';

// describe(function(){});
