'use strict';

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
	var loadedAll = false;

	feed.init = function () {
		categoryFilter.init($('[component="category/dropdown"]'), {
			states: ['watching', 'tracking', 'notwatching'],
		});
		page = ajaxify.data.currentPage;
		const feedEl = $('.feed');
		if (!config.usePagination) {
			infinitescroll.init(feedEl, loadMore);
		}
		const currentShowAllPosts = $('#showAllPosts').is(':checked');
		const currentShowFollowedUsers = $('#showFollowedUsers').is(':checked');
		feedEl.on('hidden.bs.dropdown', '#options-dropdown', function () {
			const query = utils.params();
			const optionsChanged = currentShowAllPosts !== $('#showAllPosts').is(':checked') ||
				currentShowFollowedUsers !== $('#showFollowedUsers').is(':checked');

			if ($('#showAllPosts').is(':checked')) {
				query.posts = 'all';
			} else {
				delete query.posts;
			}
			if ($('#showFollowedUsers').is(':checked')) {
				query.users = 'followed';
			} else {
				delete query.users;
			}
			if (optionsChanged) {
				const qs = decodeURIComponent($.param(query));
				ajaxify.go(`/feed${qs.length ? '?' + qs : ''}`);
			}
		});

		feedEl.on('click', '[data-action="bookmark"]', function () {
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

		feedEl.on('click', '[data-action="upvote"]', function () {
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

		feedEl.on('click', '[data-action="reply"]', function () {
			const $this = $(this);
			const isMain = $this.attr('data-is-main') === 'true';
			app.newReply({
				tid: $this.attr('data-tid'),
				pid: !isMain ? $this.attr('data-pid') : undefined,
			}).catch(alerts.error);
		});

		toggleShowMoreButtons(feedEl);

		feedEl.on('click', '[component="show/more"]', function () {
			const $el = $(this);
			const postContent = $el.parents('.post-body').find('[component="post/content"]');
			const isShowingMore = parseInt($el.attr('ismore'), 10) === 1;
			postContent.toggleClass('truncate-post-content', isShowingMore);
			$el.translateText(isShowingMore ? '[[feed:see-more]]' : '[[feed:see-less]]');
			$el.attr('ismore', isShowingMore ? 0 : 1);
		});
	};

	function toggleShowMoreButtons(feedEl) {
		feedEl.find('[component="post/content"]').each((index, el) => {
			if (el.clientHeight < el.scrollHeight) {
				$(el).parent().find('[component="show/more"]').removeClass('hidden');
			}
		});
	}

	function loadMore(direction) {
		if (direction < 0) {
			return;
		}
		var params = utils.params();
		page += 1;
		if (loadedAll) {
			return;
		}
		params.page = page;

		infinitescroll.loadMoreXhr(params, function (data, done) {
			if (data.posts && data.posts.length) {
				onPostsLoaded(data.posts, done);
			} else {
				loadedAll = true;
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
			toggleShowMoreButtons(html);
			callback();
		});
	}

	return feed;
});
