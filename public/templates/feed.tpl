<div data-widget-area="header">
	{{{each widgets.header}}}
	{{widgets.header.html}}
	{{{end}}}
</div>
<style>.feed .post-body .content > p:last-child { margin-bottom: 0px;}</style>
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
			{{{ if posts.length }}}
			<div class="d-flex justify-content-end py-2 mb-2 gap-1">
				<!-- IMPORT partials/category/filter-dropdown-right.tpl -->
				<!-- IMPORT partials/users/filter-dropdown-right.tpl -->
			</div>
			{{{ end }}}

			{{{ if !posts.length  }}}
			<div class="alert alert-warning text-center">[[feed:no-posts-found]] {{{ if !following.length }}}[[feed:are-you-following-anyone]] {{{ end }}}</div>
			{{{ end }}}

			<ul component="posts" class="list-unstyled" data-nextstart="{nextStart}">
				{{{ each posts }}}
				<li component="post" class="shadow-sm p-3 mb-3 rounded border posts-list-item  {{{ if ./deleted }}} deleted{{{ else }}}{{{ if ./topic.deleted }}} deleted{{{ end }}}{{{ end }}}{{{ if ./topic.scheduled }}} scheduled{{{ end }}}" data-pid="{./pid}" data-uid="{./uid}">
					{{{ if ./isMainPost }}}
					<a class="topic-title fw-semibold fs-5 mb-2 text-reset text-break d-block" href="{config.relative_path}/topic/{./topic.slug}">
					{./topic.title}
					</a>
					{{{ end }}}

					<div class="d-flex gap-2">
						<div>
							<a class="lh-1 text-decoration-none" href="{config.relative_path}/user/{./user.userslug}">{buildAvatar(./user, "40px", true, "not-responsive")}</a>
						</div>
						<div class="post-body d-flex flex-column gap-2 flex-grow-1" style="min-width: 0px;">
							<div class="d-flex gap-2 post-info text-sm align-items-center">
								<div class="post-author d-flex align-items-center gap-1">
									<a class="lh-1 fw-semibold" href="{config.relative_path}/user/{./user.userslug}">{../user.displayname}</a>
								</div>
								{{{ if !./isMainPost}}}{./repliedString}{{{ else }}}<span class="timeago text-muted lh-1" title="{./timestampISO}"></span>{{{ end}}}
							</div>

							<div component="post/content" class="content text-sm text-break position-relative">
								<a href="{config.relative_path}/post/{./pid}" class="stretched-link"></a>
								{./content}
							</div>
							<hr class="my-2"/>
							<div class="d-flex justify-content-between">
								<a href="{config.relative_path}/post/{./pid}" class="btn-ghost-sm"><i class="fa-fw fa-regular fa-message text-xs text-muted"></i> {humanReadableNumber(./topic.postcount)}</a>

								<a href="#" data-pid="{./pid}" data-action="bookmark" data-bookmarked="{./bookmarked}" data-bookmarks="{./bookmarks}" class="btn-ghost-sm"><i class="fa-fw fa-bookmark text-xs {{{ if ./bookmarked }}}fa text-primary{{{ else }}}fa-regular text-muted{{{ end }}}"></i> <span component="bookmark-count">{humanReadableNumber(./bookmarks)}</span></a>

								<a href="#" data-pid="{./pid}" data-action="upvote" data-upvoted="{./upvoted}" data-upvotes="{./upvotes}" class="btn-ghost-sm"><i class="fa-fw fa-heart text-xs {{{ if ./upvoted }}}fa text-danger{{{ else }}}fa-regular text-muted{{{ end }}}"></i> <span component="upvote-count">{humanReadableNumber(./upvotes)}</span></a>

								<a href="#" data-pid="{./pid}" data-tid="{./tid}" data-action="reply" class="btn-ghost-sm"><i class="fa-fw fa fa-reply text-xs text-muted"></i> [[topic:reply]]</a>
							</div>
						</div>
					</div>
				</li>
				{{{ end }}}
			</ul>

			{{{ if config.usePagination }}}
			<!-- IMPORT partials/paginator.tpl -->
			{{{ end }}}
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
