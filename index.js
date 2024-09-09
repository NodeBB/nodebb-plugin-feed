
'use strict';

const _ = require.main.require('lodash');

const db = require.main.require('./src/database');
const routeHelpers = require.main.require('./src/routes/helpers');
const controllerHelpers = require.main.require('./src/controllers/helpers');
const posts = require.main.require('./src/posts');
const topics = require.main.require('./src/topics');
const categories = require.main.require('./src/categories');
const meta = require.main.require('./src/meta');
const translator = require.main.require('./src/translator');

const feed = module.exports;

feed.init = async function (params) {
	routeHelpers.setupPageRoute(params.router, '/feed', renderFeed);
};

async function renderFeed(req, res) {
	if (!req.loggedIn) {
		return controllerHelpers.notAllowed(req, res);
	}

	const cids = getCidsArray(req.query.cid);
	const showFollowed = req.query.users === 'followed';
	const page = Math.max(1, parseInt(req.query.page, 10) || 1);

	const [followedUids, categoryData] = await Promise.all([
		showFollowed ? db.getSortedSetRevRange(`following:${req.uid}`, 0, -1) : [],
		controllerHelpers.getSelectedCategory(cids),
	]);
	let readableCids = await categories.getCidsByPrivilege('categories:cid', req.uid, 'topics:read');
	readableCids = readableCids.filter(cid => cid !== -1);
	const selectedCids = cids || readableCids || [];

	const start = Math.max(0, (page - 1) * meta.config.postsPerPage);
	const stop = start + meta.config.postsPerPage - 1;
	let sets = [];
	if (showFollowed) {
		sets = _.flatten(
			followedUids.map(uid => selectedCids.map(cid => `cid:${cid}:uid:${uid}:pids`))
		);
	} else {
		sets = selectedCids.map(cid => `cid:${cid}:pids`);
	}
	const pagePids = await db.getSortedSetRevRange(sets, start, stop);
	const postData = await posts.getPostSummaryByPids(pagePids, req.uid, {
		stripTags: false,
		extraFields: ['bookmarks'],
	});

	delete req.query._;

	const uniqTids = _.uniq(postData.map(p => p.tid));
	const [topicData, { upvotes }, bookmarkStatus] = await Promise.all([
		topics.getTopicsFields(uniqTids, ['tid', 'numThumbs']),
		posts.getVoteStatusByPostIDs(pagePids, req.uid),
		posts.hasBookmarked(pagePids, req.uid),
	]);

	const thumbs = await topics.thumbs.load(topicData);
	const tidToThumbs = _.zipObject(uniqTids, thumbs);
	postData.forEach((p, index) => {
		p.pid = encodeURIComponent(p.pid);
		p.topic.thumbs = tidToThumbs[p.tid];
		p.upvoted = upvotes[index];
		p.bookmarked = bookmarkStatus[index];
		if (!p.isMainpost) {
			p.repliedString = translator.compile('feed:replied-in-ago', p.topic.title, p.timestampISO);
		}
	});


	res.render('feed', {
		posts: postData,
		allCategoriesUrl: 'feed' + controllerHelpers.buildQueryString(req.query, 'cid', ''),
		allUsersUrl: 'feed' + controllerHelpers.buildQueryString(req.query, 'users', ''),
		followedUsersUrl: 'feed' + controllerHelpers.buildQueryString(req.query, 'users', 'followed'),
		currentPage: page,
		showFollowed,
		selectedCategory: categoryData.selectedCategory,
		selectedCids: categoryData.selectedCids,
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
