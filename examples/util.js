const util = {
  	scrollTop: () => {
		return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
	},
	innerHeight: () => {
		return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	},
	scrollHeight: () => {
		return document.documentElement.scrollHeight || document.body.scrollHeight;
	},
	isElemInViewport: (el) => {
		const rt = el.getBoundingClientRect();

		return (
			rt.top >=0 &&
			rt.left >= 0 &&
			rt.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			rt.right <= (window.innerWidth || document.documentElement.clientWidth)
		)
	},
	getPosition: (el) => {
		let left = 0, top = 0;

		while(el.offsetParent) {
			//获取偏移父元素的样式,在计算偏移的时候需要加上它的border
			const pStyle = getComputedStyle(el.offsetParent, false);
			left += el.offsetLeft + parseFloat(pStyle.borderLeftWidth, 10);
			top += el.offsetTop + parseFloat(pStyle.borderTopWidth, 10);
			el = el.offsetParent;
		}

		return { left, top }
	}
}
