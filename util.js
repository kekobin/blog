export default {
  scrollTop() => {
		return document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
	},
	innerHeight() => {
		return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	},
	scrollHeight() => {
		return document.documentElement.scrollHeight || document.body.scrollHeight;
	}
}
