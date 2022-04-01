(function(win) {
	var doc = win.document;
	var docEl = doc.documentElement;
	var tid;

	function refreshRem() {
		var width = docEl.getBoundingClientRect().width;
		if (width < 1200) { // 最大宽度
			width = 1200;
		}
		var rem = width / 12;
		docEl.style.fontSize = rem + 'px';

	}
	win.addEventListener('resize', function() {
		clearTimeout(tid);
		tid = setTimeout(refreshRem, 10);
	}, false);
	refreshRem();
})(window);