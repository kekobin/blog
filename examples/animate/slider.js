class Slider {
	constructor(el, opts) {
		if (!el) return;
		this.el = document.querySelector(el);
		this.wraper = this.el.firstElementChild || this.el.firstChild;
		this.sliders = this.wraper.children;
		this.index = 0;
		this.length = this.sliders.length;
		this.speed = opts.speed || 2500;
		this.autoplay = opts.autoplay || true;
		this.perWidth = this.el.clientWidth;
		this.autotimeout = null;

		this.init();
	}

	init() {
		// reset wraper style
		this.el.style.position = 'relative';
		this.wraper.style.position = 'absolute';
		// (1)复制第一张图片item，添加到wraper后。这个是用来实现无限切换的一种方式。
        const newItem = this.wraper.children[0].cloneNode(true);
        this.wraper.appendChild(newItem);

		if (this.autoplay) {
			this.autotimeout = setInterval(this.autoPlay.bind(this), this.speed);
		}
	}

	autoPlay() {
		// (2)当切换完最后一张复制的item后到下一次新的切换之前，重置索引index到第二张(注意不是第一张)，
		// 由于(1)中复制item的存在，因为它和第一张是一样的，所以当此时切换的时候，可以无痕的掠过第一张
		// (比如说perWidth为100,那么到切换完复制item时，wraper.style.left=-100*6px=-600px,
		// 此时设置wraper.style.left=0,即由第六张位置切换到第一张位置，由于图片一样，并且这个切换是非常快速无动画的，看不出来
		// 由此实现了无限切换的效果。
		if (++this.index > this.length) {
			this.index = 1;
			this.wraper.style.left = 0;
		}

		this.animate(this.wraper, - this.index * this.perWidth);
	}

	animate(ele, target) {
		// 步长：控制每帧移动的距离，和移动方向
		// 每次移动一帧，以浏览器的刷新频率去增加帧数(即静止画面)，实现动画效果
		const step = target > ele.offsetLeft ? 10 : -10;
		ele.raf = requestAnimationFrame(function raf(){
			if(Math.abs(target - ele.offsetLeft) < Math.abs(step)) {
				ele.style.left = `${target}px`;
				cancelAnimationFrame(ele.raf);
			} else {
				ele.style.left = `${ele.offsetLeft + step}px`;
				requestAnimationFrame(raf);
			}
		});
	}
}
