'use strict';

/* globals $, define, ajaxify, config, utils, app */
define('forum/feed', [
	'forum/infinitescroll',
	'categoryFilter',
], function (infinitescroll, categoryFilter) {
	var feed = {};
	var page = 1;
	feed.init = function () {
		categoryFilter.init($('[component="category/dropdown"]'));
		page = ajaxify.data.pagination.currentPage;
		if (!config.usePagination) {
			infinitescroll.init(loadMore);
		}
	};

	function loadMore(direction) {
		if (direction < 0) {
			return;
		}
		var params = utils.params();
		page += 1;
		params.page = page;

		infinitescroll.loadMoreXhr(params, function (data, done) {
			if (data.posts && data.posts.length) {
				onPostsLoaded(data.posts, done);
			} else {
				done();
			}
		});
	}

	function onPostsLoaded(posts, callback) {
		app.parseAndTranslate('feed', 'posts', { posts: posts }, function (html) {
			$('[component="posts"]').append(html);
			html.find('img:not(.not-responsive)').addClass('img-responsive');
			html.find('.timeago').timeago();
			app.createUserTooltips();
			utils.makeNumbersHumanReadable(html.find('.human-readable-number'));
			callback();
		});
	}

	return feed;
});
