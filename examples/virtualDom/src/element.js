class Element {
	constructor(tagName, props, children) {
		this.tagName = tagName
		this.props = props
		this.children = children

		this.key = props ? props.key : undefined

		if (props instanceof Array) {
			this.children = props
			this.props = {}
		}

		/*
		 * 设置当前元素子节点及所有子孙节点的节点个数，据此就可以标记每一个节点的索引了
		 * 如：
		 *			0
		 *		1		4	
		 *
		 *	2	3			5
		 *
		 * 要计算节点4的索引，可由节点1有两个子节点，所以节点4的索引 index_4 = 当前索引数(1) + 同级左侧节点所有子节点个数 + 节点4本身(1)
		 *
		*/
		let allChildNodes = 0

		children.forEach(ch => {
			// 如果ch是Element实例，则获取它上面的所有子节点个数
			if (ch instanceof Element) {
				allChildNodes += ch.allChildNodes
			}

			// 然后统一加上ch节点本身，即加1即可
			allChildNodes++
		})

		// 设置到每个节点元素上
		this.allChildNodes = allChildNodes
	}

	// 渲染得到实例的js描述，也可视为是js dom 树(AST)
	render() {
		// 创建元素标签
		const el = document.createElement(this.tagName)

		const { children, props } = this

		// 赋上元素属性
		for(let k in props) {
			el.setAttribute(k, props[k])
		}

		// 渲染子元素，并赋给 父元素 el
		children.forEach(ch => {
			// 如果是Element实例，则调用对应的render方法得到它本身的el js描述，否则视为文本节点
			const child = ch instanceof Element ? ch.render() : document.createTextNode(ch)
			el.appendChild(child)
		})

		// 返回当前Element实例的el
		return el
	}
}

export default function el(tagName, props, children) {
	return new Element(tagName, props, children)
}