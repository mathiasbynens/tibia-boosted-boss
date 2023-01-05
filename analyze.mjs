import * as fs from 'node:fs/promises';

const readJsonFile = async (fileName) => {
	const json = await fs.readFile(fileName, 'utf8');
	const data = JSON.parse(json);
	return data;
};

const writeJsonFile = async (fileName, data) => {
	const json = JSON.stringify(data, null, '\t') + '\n';
	await fs.writeFile(fileName, json);
};

const BOOSTABLE_BOSSES = new Set(await readJsonFile('./data/boostable-bosses.json'));
const HISTORY = new Map(Object.entries(await readJsonFile('./data/boosted-boss-history.json')));
const PREVIOUSLY_BOOSTED = [...HISTORY.values()];

// Which bosses could be boosted tomorrow?
// “The boosted boss system has the same cooldown as the boosted
// creature system. A boosted boss can’t become boosted again for
// 30 days.” — CipSoft
{
	const lastThirtyBosses = new Set(PREVIOUSLY_BOOSTED.slice(-30).sort());
	const boostableTomorrow = new Set();
	for (const boss of BOOSTABLE_BOSSES) {
		if (!lastThirtyBosses.has(boss)) {
			boostableTomorrow.add(boss);
		}
	}
	await writeJsonFile('./data/non-boostable-bosses-tomorrow.json', [...lastThirtyBosses]);
	await writeJsonFile('./data/boostable-bosses-tomorrow.json', [...boostableTomorrow]);
}

// Which bosses have never been boosted?
{
	const PREVIOUSLY_BOOSTED_SET = new Set(PREVIOUSLY_BOOSTED);
	const NOT_PREVIOUSLY_BOOSTED = new Set(
		Array.from(BOOSTABLE_BOSSES).filter(x => !PREVIOUSLY_BOOSTED_SET.has(x))
	);
	await writeJsonFile('./data/not-previously-boosted.json', [...NOT_PREVIOUSLY_BOOSTED]);
}

// Which bosses have been boosted most often?
{
	// boss → count
	const boostedCounts = new Map();
	for (const boss of BOOSTABLE_BOSSES) {
		boostedCounts.set(boss, 0);
	}
	for (const boss of HISTORY.values()) {
		boostedCounts.set(boss, boostedCounts.get(boss) + 1);
	}
	// count → [boss1, boss2, …]
	const bossesPerBoostedCount = new Map();
	for (const [boss, count] of boostedCounts) {
		if (bossesPerBoostedCount.has(count)) {
			bossesPerBoostedCount.get(count).push(boss);
		} else {
			bossesPerBoostedCount.set(count, [boss]);
		}
	}
	for (const [count, bosses] of bossesPerBoostedCount) {
		bossesPerBoostedCount.set(count, bosses.sort());
	}

	await writeJsonFile('./data/boost-counts.json', Object.fromEntries(bossesPerBoostedCount));
}
