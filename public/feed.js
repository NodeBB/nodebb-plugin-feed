'use strict';

/* globals $, define, ajaxify, config, utils, app */
define('forum/feed', [
	'forum/infinitescroll',
	'categoryFilter',
	'api',
	'alerts',
	'hooks',
	'helpers',
], function (infinitescroll, categoryFilter, api, alerts, hooks, helpers) {
	var feed = {};
	var page = 1;
	var pageCount = 1;

	feed.init = function () {
		categoryFilter.init($('[component="category/dropdown"]'));
		page = ajaxify.data.pagination.currentPage;
		pageCount = ajaxify.data.pagination.pageCount;
		if (!config.usePagination) {
			infinitescroll.init(loadMore);
		}


		$('.feed').on('click', '[data-action="bookmark"]', function () {
			const $this = $(this);
			const isBookmarked = $this.attr('data-bookmarked') === 'true';
			const pid = $this.attr('data-pid');
			const bookmarkCount = parseInt($this.attr('data-bookmarks'), 10);
			const method = isBookmarked ? 'del' : 'put';

			api[method](`/posts/${pid}/bookmark`, undefined, function (err) {
				if (err) {
					return alerts.error(err);
				}
				const type = isBookmarked ? 'unbookmark' : 'bookmark';
				const newBookmarkCount = bookmarkCount + (isBookmarked ? -1 : 1);
				$this.find('[component="bookmark-count"]').text(
					helpers.humanReadableNumber(newBookmarkCount)
				);
				$this.attr('data-bookmarks', newBookmarkCount);
				$this.attr('data-bookmarked', isBookmarked ? 'false' : 'true');
				$this.find('i').toggleClass('fa text-primary', !isBookmarked)
					.toggleClass('fa-regular text-muted', isBookmarked);
				hooks.fire(`action:post.${type}`, { pid: pid });
			});
		});

		$('.feed').on('click', '[data-action="upvote"]', function () {
			const $this = $(this);
			const isUpvoted = $this.attr('data-upvoted') === 'true';
			const pid = $this.attr('data-pid');
			const upvoteCount = parseInt($this.attr('data-upvotes'), 10);
			const method = isUpvoted ? 'del' : 'put';
			const delta = 1;
			api[method](`/posts/${pid}/vote`, { delta }, function (err) {
				if (err) {
					return alerts.error(err);
				}

				const newUpvoteCount = upvoteCount + (isUpvoted ? -1 : 1);
				$this.find('[component="upvote-count"]').text(
					helpers.humanReadableNumber(newUpvoteCount)
				);
				$this.attr('data-upvotes', newUpvoteCount);
				$this.attr('data-upvoted', isUpvoted ? 'false' : 'true');
				$this.find('i').toggleClass('fa text-danger', !isUpvoted)
					.toggleClass('fa-regular text-muted', isUpvoted);

				hooks.fire('action:post.toggleVote', {
					pid: pid,
					delta: delta,
					unvote: method === 'del',
				});
			});
		});

		$('.feed').on('click', '[data-action="reply"]', function () {
			const $this = $(this);
			app.newReply({
				tid: $this.attr('data-tid'),
				pid: $this.attr('data-pid'),
			}).catch(alerts.error);
		});
	};

	function loadMore(direction) {
		if (direction < 0) {
			return;
		}
		var params = utils.params();
		page += 1;
		if (page > pageCount) {
			return;
		}
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
			html.find('img:not(.not-responsive)').addClass('img-fluid');
			html.find('.timeago').timeago();
			utils.makeNumbersHumanReadable(html.find('.human-readable-number'));
			callback();
		});
	}

	return feed;
});
