import fs from 'node:fs/promises';
import { escape as escapeHtml } from 'lodash-es';
import { minify as minifyHtml } from 'html-minifier-terser';

const slugify = (name) => {
	const slug = name.toLowerCase()
		.replaceAll('’', '')
		.replaceAll('-', '')
		.replaceAll(' ', '-');
	return slug;
};

const formatNumber = (number) => {
	return `${number.toFixed(2)}%`;
};

const renderBoss = (boss) => {
	return `
		<figure>
			<img src="_img/${escapeHtml(slugify(boss))}.webp" width="64" height="64" alt="">
			<figcaption>${escapeHtml(boss)}</figcaption>
		</figure>
	`;
};

const render = ({ date, boosted, boostableTomorrow, boostableButNotTomorrow }) => {
	const output = [
		`<p>Today’s boosted boss is: ${renderBoss(boosted)}`,
		`<h2>Boostable bosses that can be boosted tomorrow</h2>`,
		`<p>Tomorrow’s ${boostableTomorrow.length} boostable bosses are: ${boostableTomorrow.map(renderBoss).join(' ')}`,
		`<h2>Boostable bosses that cannot be boosted tomorrow</h2>`,
		`<p>These ${boostableButNotTomorrow.length} bosses cannot be boosted tomorrow since they have been boosted recently: ${boostableButNotTomorrow.map(renderBoss).join(' ')}`,
		`<p>Last updated on <time>${escapeHtml(date)}</time>.`,
	];
	const html = output.join('');
	return html;
};

const getData = async () => {
	const history = JSON.parse(
		await fs.readFile(`./data/boosted-boss-history.json`, 'utf8')
	);
	const last = Array.from(Object.entries(history)).at(-1);
	const [date, boostedToday] = last;

	const boostable = JSON.parse(
		await fs.readFile(`./data/boostable-bosses.json`, 'utf8')
	);
	const boostableTomorrow = JSON.parse(
		await fs.readFile(`./data/boostable-bosses-tomorrow.json`, 'utf8')
	);

	const a = new Set(boostable);
	const b = new Set(boostableTomorrow);
	const boostableButNotTomorrow = [...a].filter(x => !b.has(x));

	const data = {
		date: date,
		boosted: boostedToday,
		boostableTomorrow: boostableTomorrow,
		boostableButNotTomorrow: boostableButNotTomorrow,
	};
	return data;
};

const data = await getData();

const htmlTemplate = await fs.readFile('./templates/index.html', 'utf8');
const html = htmlTemplate.toString()
	.replace('%%%DATA%%%', render(data));
const minifiedHtml = await minifyHtml(html, {
	collapseBooleanAttributes: true,
	collapseInlineTagWhitespace: false,
	collapseWhitespace: true,
	conservativeCollapse: false,
	decodeEntities: true,
	html5: true,
	includeAutoGeneratedTags: false,
	minifyCSS: true,
	minifyJS: true,
	preserveLineBreaks: false,
	preventAttributesEscaping: true,
	removeAttributeQuotes: true,
	removeComments: true,
	removeEmptyAttributes: true,
	removeEmptyElements: false,
	removeOptionalTags: false,
	removeRedundantAttributes: true,
	removeTagWhitespace: false,
	sortAttributes: true,
	sortClassName: true,
});
await fs.writeFile('./dist/index.html', minifiedHtml);
