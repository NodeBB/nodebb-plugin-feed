
'use strict';

const _ = require.main.require('lodash');

const db = require.main.require('./src/database');
const routeHelpers = require.main.require('./src/routes/helpers');
const controllerHelpers = require.main.require('./src/controllers/helpers');
const posts = require.main.require('./src/posts');
const topics = require.main.require('./src/topics');
const categories = require.main.require('./src/categories');
const user = require.main.require('./src/user');
const meta = require.main.require('./src/meta');
const privileges = require.main.require('./src/privileges');
const translator = require.main.require('./src/translator');

const feed = module.exports;

feed.init = async function (params) {
	routeHelpers.setupPageRoute(params.router, '/feed', renderFeed);
};

async function renderFeed(req, res) {
	let cids = getCidsArray(req.query.cid);
	const showFollowed = req.loggedIn && req.query.users === 'followed';
	const showAllPosts = req.query.posts === 'all';
	const page = Math.max(1, parseInt(req.query.page, 10) || 1);

	const [followedUids, categoryData, userCids] = await Promise.all([
		showFollowed ? db.getSortedSetRevRange(`following:${req.uid}`, 0, -1) : [],
		controllerHelpers.getSelectedCategory(cids),
		user.getCategoriesByStates(req.uid, [
			categories.watchStates.watching,
			categories.watchStates.tracking,
			categories.watchStates.notwatching,
		]),
	]);

	const readableCids = await privileges.categories.filterCids('topics:read', userCids, req.uid);

	if (Array.isArray(cids)) {
		cids = cids.filter(cid => readableCids.includes(cid));
	}
	let selectedCids = cids || readableCids || [];
	if (!cids) {
		selectedCids = readableCids.filter(cid => cid !== -1);
	}
	const start = Math.max(0, (page - 1) * meta.config.postsPerPage);
	const stop = start + meta.config.postsPerPage - 1;
	let sets = [];
	let pagePids = [];
	if (showAllPosts) {
		if (showFollowed) {
			sets = _.flatten(
				followedUids.map(uid => selectedCids.map(cid => `cid:${cid}:uid:${uid}:pids`))
			);
		} else {
			sets = selectedCids.map(cid => `cid:${cid}:pids`);
		}
		pagePids = await db.getSortedSetRevRange(sets, start, stop);
	} else if (showFollowed) {
		sets = _.flatten(
			followedUids.map(uid => selectedCids.map(cid => `cid:${cid}:uid:${uid}:tids`))
		);
		const pageTids = await db.getSortedSetRevRange(sets, start, stop);
		pagePids = (await topics.getTopicsFields(pageTids, ['mainPid'])).map(t => t && t.mainPid);
	} else {
		sets = selectedCids.map(cid => `cid:${cid}:tids:create`);
		const pinnedSets = selectedCids.map(cid => `cid:${cid}:tids:pinned`);
		const [pageTids, pinnedTids] = await Promise.all([
			db.getSortedSetRevRange(sets, start, stop),
			db.getSortedSetRevRange(pinnedSets, 0, -1),
		]);

		const [pageTopics, pinnedTopics] = await Promise.all([
			topics.getTopicsFields(pageTids, ['mainPid', 'timestamp']),
			topics.getTopicsFields(pinnedTids, ['mainPid', 'timestamp']),
		]);

		const lastTid = pageTopics[pageTids.length - 1];
		if (lastTid) {
			const firstTs = start === 0 ? Date.now() : await getTopicTs(sets, start - 1);
			const lastTs = lastTid.timestamp;
			const pinnedTopicsOnThisPage = pinnedTopics.filter(
				t => t && t.timestamp >= lastTs && t.timestamp <= firstTs
			);

			pagePids = pageTopics.concat(pinnedTopicsOnThisPage).sort(
				(t1, t2) => t2.timestamp - t1.timestamp
			).map(t => t.mainPid);
		}
	}

	const postData = await posts.getPostSummaryByPids(pagePids, req.uid, {
		stripTags: false,
		extraFields: ['bookmarks'],
	});

	delete req.query._;

	const uniqTids = _.uniq(postData.map(p => p.tid));
	const [topicData, { upvotes }, bookmarkStatus] = await Promise.all([
		topics.getTopicsFields(uniqTids, ['tid', 'numThumbs', 'mainPid']),
		posts.getVoteStatusByPostIDs(pagePids, req.uid),
		posts.hasBookmarked(pagePids, req.uid),
	]);

	const thumbs = await topics.thumbs.load(topicData);
	const tidToThumbs = _.zipObject(uniqTids, thumbs);
	postData.forEach((p, index) => {
		p.pid = encodeURIComponent(p.pid);
		if (p.topic) {
			p.topic.thumbs = tidToThumbs[p.tid];
			p.topic.postcount = Math.max(0, p.topic.postcount - 1);
			p.topic.teaserPid = p.topic.teaserPid ? encodeURIComponent(p.topic.teaserPid) : p.topic.teaserPid;
		}
		p.upvoted = upvotes[index];
		p.bookmarked = bookmarkStatus[index];
		if (!p.isMainpost) {
			p.repliedString = translator.compile('feed:replied-in-ago', p.topic.title, p.timestampISO);
		}
	});


	res.render('feed', {
		posts: postData,
		allCategoriesUrl: 'feed' + controllerHelpers.buildQueryString(req.query, 'cid', ''),
		currentPage: page,
		showFollowed,
		showAllPosts,
		selectedCategory: categoryData.selectedCategory,
		selectedCids: categoryData.selectedCids,
		showThumbs: req.loggedIn || meta.config.privateUploads !== 1,
	});
}

async function getTopicTs(sets, index) {
	const topic = await db.getSortedSetRangeWithScores(sets, index, index);
	return topic ? topic.score : Date.now();
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

feed.addNavItem = async function (items) {
	items.push({
		id: 'feed',
		route: '/feed',
		title: '[[feed:feed]]',
		enabled: true,
		iconClass: 'fa-list',
		textClass: 'd-lg-none',
		text: '[[feed:feed]]',
		groups: [],
	});

	return items;
};
