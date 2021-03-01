
'use strict';

const querystring = require('querystring');

const _ = require.main.require('lodash');

const db = require.main.require('./src/database');
const routeHelpers = require.main.require('./src/routes/helpers');
const controllerHelpers = require.main.require('./src/controllers/helpers');
const user = require.main.require('./src/user');
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

	const cids = getCidsArray(req.query.cid);
	const uid = parseInt(req.query.uid, 10);

	const [uids, categoryData] = await Promise.all([
		db.getSortedSetRevRange(`following:${req.uid}`, 0, -1),
		controllerHelpers.getSelectedCategory(cids),
	]);

	const currentUids = uid ? [uid] : uids;
	const sets = _.flatten(currentUids.map((uid) => {
		if (cids) {
			return cids.map(cid => `cid:${cid}:uid:${uid}:pids`);
		}
		return `uid:${uid}:posts`;
	}));

	const [allPids, following] = await Promise.all([
		db.getSortedSetRevRange(
			sets, 0, 499
		),
		user.getUsersFields(uids, ['username', 'uid', 'picture']),
	]);

	delete req.query._;
	following.forEach((user) => {
		user.selected = user.uid === uid;
		user.url = `feed?${querystring.stringify({ ...req.query, uid: user.uid })}`;
	});

	const pids = await privileges.posts.filter('topics:read', allPids, req.uid);

	const pageCount = Math.max(1, Math.ceil(pids.length / meta.config.postsPerPage));
	const page = Math.min(parseInt(req.query.page, 10) || 1, pageCount);

	const start = Math.max(0, (page - 1) * meta.config.postsPerPage);
	const stop = start + meta.config.postsPerPage - 1;
	const pagePids = pids.slice(start, stop + 1);
	const postData = await posts.getPostSummaryByPids(pagePids, req.uid, { stripTags: false });

	res.render('feed', {
		posts: postData,
		following: following,
		allCategoriesUrl: 'feed' + controllerHelpers.buildQueryString(req.query, 'cid', ''),
		allUsersUrl: 'feed' + controllerHelpers.buildQueryString(req.query, 'uid', ''),
		selectedUser: following.find(u => u.uid === uid),
		selectedCategory: categoryData.selectedCategory,
		selectedCids: categoryData.selectedCids,
		pagination: pagination.create(page, pageCount, req.query),
	});
}

function getCidsArray(cid) {
	if (cid && !Array.isArray(cid)) {
		cid = [cid];
	}
	return cid && cid.map(cid => parseInt(cid, 10));
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
