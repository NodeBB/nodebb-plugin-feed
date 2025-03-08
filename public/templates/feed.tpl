<div data-widget-area="header">
	{{{each widgets.header}}}
	{{widgets.header.html}}
	{{{end}}}
</div>
<style>.feed .post-body .content > p:last-child { margin-bottom: 0px; }</style>
<div class="feed">
	<div class="row">
		<div data-widget-area="left" class="col-lg-3 col-sm-12 {{{ if !widgets.left.length }}}hidden{{{ end }}}">
			{{{each widgets.left}}}
			{{widgets.left.html}}
			{{{end}}}
		</div>
		{{{ if ((widgets.left.length && widgets.right.length) || (!widgets.left.length && !widgets.right.length))}}}
		<div class="col-lg-6 col-sm-12 mx-auto">
		{{{ end }}}
		{{{ if (widgets.left.length && !widgets.right.length) }}}
		<div class="col-lg-6 col-sm-12 me-auto">
		{{{ end }}}
		{{{ if (!widgets.left.length && widgets.right.length) }}}
		<div class="col-lg-6 col-sm-12 ms-auto">
		{{{ end }}}

			<div class="d-flex justify-content-between py-2 mb-2 gap-1">
				{{{ if canPost }}}
				<button id="new_topic" class="btn btn-primary btn-sm">[[category:new-topic-button]]</button>
				{{{ end }}}
				{{{ if (!loggedIn && !canPost) }}}
				<a href="{config.relative_path}/login" class="btn btn-primary btn-sm">[[category:guest-login-post]]</a>
				{{{ end }}}

				<div class="d-flex justify-content-end gap-1">
					<!-- IMPORT partials/category/filter-dropdown-right.tpl -->

					<div id="options-dropdown" class="btn-group dropdown dropdown-right bottom-sheet">
						<button type="button" class="btn btn-ghost btn-sm d-flex align-items-center gap-2 ff-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							<i class="fa fa-fw fa-gear text-primary"></i>
						</button>
						<ul class="dropdown-menu p-1 text-sm" role="menu">
							<li class="py-1 px-3">
								<div class="form-check form-switch d-flex px-0 align-items-center justify-content-between gap-3">
									<label class="form-check-label text-nowrap" for="showAllPosts">[[feed:show-all-posts]]</label>
									<input class="form-check-input float-none m-0 pointer" type="checkbox" role="switch" id="showAllPosts" {{{ if showAllPosts }}}checked{{{ end }}}>
								</div>
							</li>
							{{{ if loggedIn }}}
							<li class="py-1 px-3">
								<div class="form-check form-switch d-flex px-0 align-items-center justify-content-between gap-3">
									<label class="form-check-label text-nowrap" for="showFollowedUsers">[[feed:followed-users-only]]</label>
									<input class="form-check-input float-none m-0 pointer" type="checkbox" role="switch" id="showFollowedUsers" {{{ if showFollowed }}}checked{{{ end }}}>
								</div>
							</li>
							{{{ end }}}
						</ul>
					</div>
				</div>
			</div>

			{{{ if !posts.length  }}}
			<div class="alert alert-warning text-center">[[feed:no-posts-found]] {{{ if !following.length }}}[[feed:are-you-following-anyone]] {{{ end }}}</div>
			{{{ end }}}

			<ul component="posts" class="list-unstyled" data-nextstart="{nextStart}">
				{{{ each posts }}}
				<li component="post" class="shadow-sm mb-3 rounded-2 border posts-list-item  {{{ if ./deleted }}} deleted{{{ else }}}{{{ if ./topic.deleted }}} deleted{{{ end }}}{{{ end }}}{{{ if ./topic.scheduled }}} scheduled{{{ end }}}" data-pid="{./pid}" data-uid="{./uid}">

					{{{ if (showThumbs && ./topic.thumbs.length)}}}
					<div class="p-1 position-relative">
						<div class="overflow-hidden rounded-1" style="max-height: 300px;">
							<a href="{config.relative_path}/topic/{./topic.slug}">
								<img class="w-100" src="{./topic.thumbs.0.url}">
							</a>
						</div>

						<div class="position-absolute end-0 bottom-0 p-3 d-flex gap-2 align-items-center pe-none">
							{{{ each ./topic.thumbs }}}
							{{{ if (@index != 0) }}}
							<img class="rounded-1" style="max-height: 64px; object-fit: contain;" src="{./url}">
							{{{ end }}}
							{{{ end }}}
						</div>
					</div>
					{{{ end }}}

					<div class="d-flex gap-2 p-3">
						<div class="d-none d-lg-block">
							<a class="lh-1 text-decoration-none" href="{config.relative_path}/user/{./user.userslug}">{buildAvatar(./user, "40px", true, "not-responsive")}</a>
						</div>
						<div class="post-body d-flex flex-column gap-2 flex-grow-1 hover-parent" style="min-width: 0px;">
							{{{ if ./isMainPost }}}
							<a class="lh-1 topic-title fw-semibold fs-5 text-reset text-break d-block" href="{config.relative_path}/topic/{./topic.slug}">
							{./topic.title}
							</a>
							{{{ end }}}

							<div class="d-flex gap-1 post-info text-sm align-items-center">
								<div class="post-author d-flex align-items-center gap-1">
									<a class="d-inline d-lg-none lh-1 text-decoration-none" href="{config.relative_path}/user/{./user.userslug}">{buildAvatar(./user, "16px", true, "not-responsive")}</a>
									<a class="lh-normal fw-semibold text-nowrap" href="{config.relative_path}/user/{./user.userslug}">{./user.displayname}</a>
								</div>
								{{{ if !./isMainPost}}}{./repliedString}{{{ else }}}<span class="timeago text-muted lh-normal" title="{./timestampISO}"></span>{{{ end}}}
							</div>

							<div component="post/content" class="content text-sm text-break position-relative truncate-post-content">
								<a href="{config.relative_path}/post/{./pid}" class="stretched-link"></a>
								{./content}
							</div>
							<div class="position-relative hover-visible">
								<button component="show/more" class="btn btn-light btn-sm rounded-pill position-absolute start-50 translate-middle-x bottom-0 z-1 hidden ff-secondary">[[feed:see-more]]</button>
							</div>
							<hr class="my-2"/>
							<div class="d-flex justify-content-between">
								<a href="{config.relative_path}/post/{{{ if ./topic.teaserPid }}}{./topic.teaserPid}{{{ else }}}{./pid}{{{ end }}}" class="btn btn-link btn-sm text-body {{{ if !./isMainPost }}}invisible{{{ end }}}"><i class="fa-fw fa-regular fa-message text-muted"></i> {humanReadableNumber(./topic.postcount)}</a>

								<a href="#" data-pid="{./pid}" data-action="bookmark" data-bookmarked="{./bookmarked}" data-bookmarks="{./bookmarks}" class="btn btn-link btn-sm text-body"><i class="fa-fw fa-bookmark {{{ if ./bookmarked }}}fa text-primary{{{ else }}}fa-regular text-muted{{{ end }}}"></i> <span component="bookmark-count">{humanReadableNumber(./bookmarks)}</span></a>

								<a href="#" data-pid="{./pid}" data-action="upvote" data-upvoted="{./upvoted}" data-upvotes="{./upvotes}" class="btn btn-link btn-sm text-body"><i class="fa-fw fa-heart {{{ if ./upvoted }}}fa text-danger{{{ else }}}fa-regular text-muted{{{ end }}}"></i> <span component="upvote-count">{humanReadableNumber(./upvotes)}</span></a>

								<a href="#" data-pid="{./pid}" data-is-main="{./isMainPost}" data-tid="{./tid}" data-action="reply" class="btn btn-link btn-sm text-body"><i class="fa-fw fa fa-reply text-muted"></i> [[topic:reply]]</a>
							</div>
						</div>
					</div>
				</li>
				{{{ end }}}
			</ul>
		</div>

		<div data-widget-area="right" class="col-lg-3 col-sm-12 {{{ if !widgets.right.length }}}hidden{{{ end }}}">
			{{{each widgets.right}}}
			{{widgets.right.html}}
			{{{end}}}
		</div>
	</div>
</div>

<div data-widget-area="footer">
	{{{each widgets.footer}}}
	{{widgets.footer.html}}
	{{{end}}}
</div>
