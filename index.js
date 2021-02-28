
'use strict';

const db = require.main.require('./src/database');
const routeHelpers = require.main.require('./src/routes/helpers');
const controllerHelpers = require.main.require('./src/controllers/helpers');
const posts = require.main.require('./src/posts');
const privileges = require.main.require('./src/privileges');
const pagination = require.main.require('./src/pagination');
const meta = require.main.require('./src/meta');

const feed = module.exports;

feed.init = async function (params) {
	routeHelpers.setupPageRoute(params.router, '/feed', params.middleware, [], renderFeed);
};

async function renderFeed(req, res) {
	if (!req.loggedIn) {
		return controllerHelpers.notAllowed(req, res);
	}

	const uids = await db.getSortedSetRevRange(`following:${req.uid}`, 0, -1);
	const allPids = await db.getSortedSetRevRange(uids.map(uid => `uid:${uid}:posts`), 0, 500);

	const pids = await privileges.posts.filter('topics:read', allPids, req.uid);

	const pageCount = Math.max(1, Math.ceil(pids.length / meta.config.postsPerPage));
	const page = Math.min(parseInt(req.query.page, 10) || 1, pageCount);

	const start = Math.max(0, (page - 1) * meta.config.postsPerPage);
	const stop = start + meta.config.postsPerPage - 1;
	const pagePids = pids.slice(start, stop + 1);
	const postData = await posts.getPostSummaryByPids(pagePids, req.uid, { stripTags: false });
	res.render('feed', {
		posts: postData,
		pagination: pagination.create(page, pageCount, req.query),
	});
}

feed.defineWidgetAreas = async function (areas) {
	areas = areas.concat([
		{
			name: 'Feed Page (Header)',
			template: 'feed.tpl',
			location: 'header',
		},
		{
			name: 'Feed Page (Left)',
			template: 'feed.tpl',
			location: 'left',
		},
		{
			name: 'Feed Page (Right)',
			template: 'feed.tpl',
			location: 'right',
		},
		{
			name: 'Feed Page (Footer)',
			template: 'feed.tpl',
			location: 'footer',
		},
	]);
	return areas;
};
