import * as fs from 'node:fs/promises';

// Map from uglyNameAsUsedOnBoostedPage => prettyName.
const normalizedToPrettyNames = new Map([
	// Infuriatingly, we cannot just reuse the name mappings from the
	// kill stats at [1] since the “boostable bosses” page has its own
	// unique casings.
	// [1]: https://github.com/tibiamaps/tibia-kill-stats/blob/HEAD/normalize-names.mjs
	['Abyssador', 'Abyssador'],
	['Ahau', 'Ahau'],
	['Amenef The Burning', 'Amenef the Burning'],
	['Anomaly', 'Anomaly'],
	['Black Vixen', 'Black Vixen'],
	['Bloodback', 'Bloodback'],
	['Brain Head', 'Brain Head'],
	['Brokul', 'Brokul'],
	['Chagorz', 'Chagorz'],
	['Count Vlarkorth', 'Count Vlarkorth'],
	['Darkfang', 'Darkfang'],
	['Deathstrike', 'Deathstrike'],
	['Drume', 'Drume'],
	['Duke Krule', 'Duke Krule'],
	['Earl Osam', 'Earl Osam'],
	['Ekatrix', 'Ekatrix'],
	['Eradicator', 'Eradicator'],
	['Essence Of Malice', 'Essence of Malice'],
	['Faceless Bane', 'Faceless Bane'],
	['Ghulosh', 'Ghulosh'],
	['Gnomevil', 'Gnomevil'],
	['Gorzindel', 'Gorzindel'],
	['Goshnar\'s Cruelty', 'Goshnar’s Cruelty'],
	['Goshnar\'s Greed', 'Goshnar’s Greed'],
	['Goshnar\'s Hatred', 'Goshnar’s Hatred'],
	['Goshnar\'s Malice', 'Goshnar’s Malice'],
	['Goshnar\'s Spite', 'Goshnar’s Spite'],
	['Grand Master Oberon', 'Grand Master Oberon'],
	['Ichgahal', 'Ichgahal'],
	['Irgix The Flimsy', 'Irgix the Flimsy'],
	['Katex Blood Tongue', 'Katex Blood Tongue'],
	['King Zelos', 'King Zelos'],
	['Kusuma', 'Kusuma'],
	['Lady Tenebris', 'Lady Tenebris'],
	['Lloyd', 'Lloyd'],
	['Lokathmor', 'Lokathmor'],
	['Lord Azaram', 'Lord Azaram'],
	['Lord Retro', 'Lord Retro'],
	['Magma Bubble', 'Magma Bubble'],
	['Mazoran', 'Mazoran'],
	['Mazzinor', 'Mazzinor'],
	['Megasylvan Yselda', 'Megasylvan Yselda'],
	['Melting Frozen Horror', 'Melting Frozen Horror'],
	['Murcion', 'Murcion'],
	['Neferi The Spy', 'Neferi the Spy'],
	['Outburst', 'Outburst'],
	['Plagirath', 'Plagirath'],
	['Ragiaz', 'Ragiaz'],
	['Ratmiral Blackwhiskers', 'Ratmiral Blackwhiskers'],
	['Ravenous Hunger', 'Ravenous Hunger'],
	['Razzagorn', 'Razzagorn'],
	['Realityquake', 'Realityquake'],
	['Rupture', 'Rupture'],
	['Scarlett Etzel', 'Scarlett Etzel'],
	['Shadowpelt', 'Shadowpelt'],
	['Sharpclaw', 'Sharpclaw'],
	['Shulgrax', 'Shulgrax'],
	['Sir Baeloc', 'Sir Baeloc'],
	['Sir Nictros', 'Sir Nictros'],
	['Sister Hetai', 'Sister Hetai'],
	['Soul Of Dragonking Zyrtarch', 'Soul of Dragonking Zyrtarch'],
	['Srezz Yellow Eyes', 'Srezz Yellow Eyes'],
	['Tarbaz', 'Tarbaz'],
	['Tentugly', 'Tentugly'],
	['Thaian', 'Thaian'],
	['The Blazing Rose', 'The Blazing Rose'],
	['The Brainstealer', 'The Brainstealer'],
	['The Diamond Blossom', 'The Diamond Blossom'],
	['The Dread Maiden', 'The Dread Maiden'],
	['The Enraged Thorn Knight', 'The Enraged Thorn Knight'],
	['The False God', 'The False God'],
	['The Fear Feaster', 'The Fear Feaster'],
	['The Flaming Orchid', 'The Flaming Orchid'],
	['The Lily Of Night', 'The Lily of Night'],
	['The Mega Magmaoid', 'The Mega Magmaoid'],
	['The Monster', 'The Monster'],
	['The Moonlight Aster', 'The Moonlight Aster'],
	['The Nightmare Beast', 'The Nightmare Beast'],
	['The Pale Worm', 'The Pale Worm'],
	['The Sandking', 'The Sandking'],
	['The Scourge Of Oblivion', 'The Scourge of Oblivion'],
	['The Souldespoiler', 'The Souldespoiler'],
	['The Source Of Corruption', 'The Source of Corruption'],
	['The Time Guardian', 'The Time Guardian'],
	['The Unarmored Voidborn', 'The Unarmored Voidborn'],
	['The Unwelcome', 'The Unwelcome'],
	['The Winter Bloom', 'The Winter Bloom'],
	['Timira The Many-Headed', 'Timira the Many-Headed'],
	['timira', 'Timira the Many-Headed'], // As seen on tibia.com @ 2023-04-27.
	['Unaz The Mean', 'Unaz the Mean'],
	['Urmahlullu The Weakened', 'Urmahlullu the Weakened'],
	['Utua Stone Sting', 'Utua Stone Sting'],
	['Vemiath', 'Vemiath'],
	['Vok The Freakish', 'Vok the Freakish'],
	['Yirkas Blue Scales', 'Yirkas Blue Scales'],
	['Zamulosh', 'Zamulosh'],
]);

const prettyToNormalizedNames = new Map();
for (const [uglyName, prettyName] of normalizedToPrettyNames) {
	prettyToNormalizedNames.set(prettyName, uglyName);
}

export const toPrettyName = (uglyName) => {
	const prettyName = normalizedToPrettyNames.get(uglyName);
	if (!prettyName) {
		console.log(`Unknown pretty name for uglyName=${JSON.stringify(uglyName)}`);
		return uglyName;
	}
	return prettyName;
};

export const toUglyName = (prettyName) => {
	const uglyName = normalizedToPrettyNames.get(prettyName);
	return uglyName;
};

const test = async () => {
	const readUglyNames = async () => {
		const filePath = './data/ugly-names.json';
		const json = await fs.readFile(filePath);
		const array = JSON.parse(json);
		const set = new Set(array);
		return set;
	};

	const UGLY_NAMES = await readUglyNames();

	for (const [uglyName, prettyName] of normalizedToPrettyNames) {
		console.assert(UGLY_NAMES.has(uglyName), `Expected ${uglyName} to appear in list of boostable bosses.`);
		if (uglyName !== prettyName) {
			console.assert(!UGLY_NAMES.has(prettyName), `Expected ${prettyName} to NOT appear in list of ugly boostable boss names.`);
		}
	}

	for (const race of UGLY_NAMES) {
		console.assert(normalizedToPrettyNames.has(race), `Missing normalization map entry: ${race}`);
	}
};

if (process.env.TEST) {
	await test();
}
