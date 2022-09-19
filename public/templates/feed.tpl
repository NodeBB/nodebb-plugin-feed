<div data-widget-area="header">
	{{{each widgets.header}}}
	{{widgets.header.html}}
	{{{end}}}
</div>

<div class="feed">
	<div class="topic-list-header d-flex justify-content-end gap-1">
		<!-- IMPORT partials/category-filter-right.tpl -->

		<div class="btn-group bottom-sheet {{{ if !following.length }}}hidden{{{ end }}}">
			<button type="button" class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
				{{{ if selectedUser }}}
				<span class="">{buildAvatar(selectedUser, "18px", true, "not-responsive")} {selectedUser.username}</span>
				{{{ else }}}
				<span class="">[[feed:all-users]]</span>
				{{{ end }}} <span class="caret"></span>
			</button>
			<ul class="dropdown-menu" role="menu">
				<li role="presentation" class="user {{{ if !selectedUser}}}selected{{{end}}}">
					<a class="dropdown-item" role="menu-item" href="{config.relative_path}/{allUsersUrl}"><i class="fa fa-fw {{{ if !selectedUser }}}fa-check{{{ end }}}"></i>[[feed:all-users]]</a>
				</li>
				{{{ each following }}}
				<li role="presentation" class="user {{{ if following.selected}}}selected{{{end}}}">
					<a class="dropdown-item" role="menu-item" href="{config.relative_path}/{following.url}"><i class="fa fa-fw {{{ if following.selected }}}fa-check{{{ end }}}"></i>{buildAvatar(@value, "18px", true, "not-responsive")} {following.username}</a>
				</li>
				{{{end}}}
			</ul>
		</div>
	</div>
	<div class="row">
		<div data-widget-area="left" class="col-lg-3 col-sm-12 {{{ if !widgets.left.length }}}hidden{{{ end }}}">
			{{{each widgets.left}}}
			{{widgets.left.html}}
			{{{end}}}
		</div>
		{{{ if (widgets.left.length && widgets.right.length) }}}
		<div class="col-lg-6 col-sm-12">
		{{{ end }}}
		{{{ if (!widgets.left.length && !widgets.right.length) }}}
		<div class="col-lg-12 col-sm-12">
		{{{ end }}}
		{{{ if ((widgets.left.length && !widgets.right.length) || (!widgets.left.length && widgets.right.length)) }}}
		<div class="col-lg-9 col-sm-12">
		{{{ end }}}
			{{{ if !posts.length  }}}
			<div class="alert alert-warning text-center">No posts found. {{{ if !following.length }}}Are you following anyone? {{{ end }}}</div>
			{{{ end }}}
			<!-- IMPORT partials/posts_list.tpl -->

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