import * as fs from 'node:fs/promises';
import { toPrettyName } from './normalize-names.mjs';

const getBossBoostInfo = async () => {
	console.log('Getting list of boostable Tibia bosses + today’s boosted boss…');
	const response = await fetch('https://api.tibiadata.com/v4/boostablebosses');
	const data = await response.json();
	const boostableBossesUgly = data.boostable_bosses
		.boostable_boss_list
		.map(entry => entry.name)
		.sort();
	const boostableBosses = boostableBossesUgly
		.map(name => toPrettyName(name))
		.sort(); // Normalization might affect the sort order.
	const todaysBoostedBoss = toPrettyName(data.boostable_bosses.boosted.name);
	const result = {
		boostableBossesUgly,
		boostableBosses,
		todaysBoostedBoss,
	};
	return result;
};

const {
	boostableBossesUgly,
	boostableBosses,
	todaysBoostedBoss,
} = await getBossBoostInfo();

const stringify = (object) => {
	return JSON.stringify(object, null, '\t') + '\n';
};

await fs.writeFile(
	`./data/ugly-names.json`,
	stringify(boostableBossesUgly)
);

await fs.writeFile(
	`./data/boostable-bosses.json`,
	stringify(boostableBosses)
);

const isoDate = (date) => {
	return date.toISOString().slice(0, 10);
};

const getDateIds = () => {
	const date = new Date();
	const today = isoDate(date);
	date.setDate(date.getDate() - 1);
	const yesterday = isoDate(date);
	return {
		yesterday,
		today,
	};
};

{
	const {yesterday, today} = getDateIds();
	const HISTORY_FILE_PATH = './data/boosted-boss-history.json';
	const json = await fs.readFile(HISTORY_FILE_PATH, 'utf8');
	const boostedBossHistory = JSON.parse(json);
	if (boostedBossHistory[yesterday] === todaysBoostedBoss) {
		throw new Error('Upstream website hasn’t updated yet.');
	}
	if (!Object.hasOwn(boostedBossHistory, today)) {
		boostedBossHistory[today] = todaysBoostedBoss;
	}
	await fs.writeFile(
		HISTORY_FILE_PATH,
		stringify(boostedBossHistory)
	);
}
