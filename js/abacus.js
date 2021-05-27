(function(){

	function Abacus(htmlRoot){
		this.htmlRoot=htmlRoot;
		this.attributes={
			direction:'vertical',
			rows:'6x4',
			counter:true,
			colors:"brown",
		}
		
		this.loadAttributes=()=>{
			this.attributes = {...this.attributes, ...this.htmlRoot.dataset}
			this.attributes.rows = this.extendRowsNotation(this.attributes.rows)
			this.attributes.colors = this.extendColorsNotation(this.attributes.colors)
		}
		this.extendRowsNotation = base => {
			return base.trim().replace(/\s+/g,' ').split(',')
				.map( line => line.trim().split(' ')
					.flatMap( number => {
						if(number.match(/^\d+$/)){ return Number(number) }
						else if(number.match(/^\d+x\d+$/)){
							let [rep,val]=number.split('x')
							return new Array(Number(rep)).fill(Number(val))
						} 
						throw "wrong rows notation"
					}))
		}
		this.extendColorsNotation = base => {
			return base.trim().replace(/\s+/g,' ')
				.replace(/\d+x\([^\)]*\)/g, group => {
					let [rep,val]=group.split('x(')
					val = val.slice(0,-1)+" "
					return val.repeat( Number(rep) ).trim()
				})
				.split(' ')
		}
		this.buildHtmlContent = ()=>{
			removeClass(this.htmlRoot,'vertical horizontal')
			addClass(this.htmlRoot,this.attributes.direction)
			this.attributes.rows.forEach( this.addColumnGroup )
			this.colorizePearls()
			this.resizePearls()
		}
		
		this.addColumnGroup = colGroupLength => {
			let colGroup = document.createElement('div')
			colGroup.setAttribute('class','column-group')
			
			colGroupLength.forEach( columnLength => this.addColumn(colGroup,columnLength) )
			
			this.htmlRoot.appendChild(colGroup)
		}
		this.addColumn = (columnGroupNode, length) => {
			let column = document.createElement('div')
			column.setAttribute('class','column')
			
			let spacer = document.createElement('div')
			spacer.setAttribute('class','spacer active')
			column.appendChild(spacer)
			
			for(let i=0;i<length;i++){
			 	let pearl = document.createElement('div')
			 	pearl.setAttribute('class','pearl')
				pearl.addEventListener('click', evt => this.togglePearl(evt.target))
				column.appendChild(pearl)
			 	let spacer = document.createElement('div')
			 	spacer.setAttribute('class','spacer')
				column.appendChild(spacer)
			}
			
			columnGroupNode.appendChild(column)
		}
		this.togglePearl = pearl => {
			console.log(pearl)
			let siblings = [...pearl.parentNode.children];
			let foundPearl = false
			let foundActive = false
			
			for(let i=0;i<siblings.length;i++){
				let element = siblings[i]
				
				if(!foundPearl && element == pearl){
					foundPearl=true
					if(foundActive){
						addClass(siblings[i+1],'active')
						break;
					}else{
						addClass(siblings[i-1],'active')
					}
				}
				if( hasClass(element,'spacer') ){
					if( hasClass(element,'active') ){
						foundActive=true
						removeClass(element,'active')
					}
				}
			}
		}
		this.colorizePearls = () => {
			let pearls = [...this.htmlRoot.getElementsByClassName("pearl")];
			let lastColor = this.attributes.colors[0];
			for(let i=0;i<pearls.length;i++){
				let color =	lastColor = (i<this.attributes.colors.length)? this.attributes.colors[i] : lastColor;
				pearls[i].style.backgroundColor=color;
			}
		}
		this.resizePearls = () => {
			//we want round pearls taking as much space as possible
			let size = [...this.htmlRoot.getElementsByClassName("column")].reduce( (acc,column) => {
				let maxSize = acc
				let pearlCount = column.getElementsByClassName("pearl").length;
				
				if(this.attributes.direction=="horizontal"){ 
					maxSize = Math.min(
						maxSize,
						column.offsetHeight,
						column.offsetWidth/(pearlCount+1)) 
				}else{ 
					maxSize = Math.min(
						maxSize,
						column.offsetWidth,
						column.offsetHeight/(pearlCount+1)) 
				} 
				return maxSize
			},window.innerWidth);
			
			[...this.htmlRoot.getElementsByClassName("pearl")].forEach(pearl => {
				pearl.style.width = size
				pearl.style.height = size
				})
		}
		
		this.init=()=>{
			try{
				truncate(htmlRoot)
				this.loadAttributes()
				this.buildHtmlContent()
			}catch(e){
				console.warn("problem generating the abacus : "+e)
			}
		}
		this.refresh = this.init;
		this.init();
	}
	
	//dom utilities
	const truncate = node=>{
		while(node.hasChildNodes()){ node.firstChild.remove() }
	}
	const removeClass = (node, classes) =>{
		node.setAttribute('class', classes.split(" ")
			.reduce( (attr, clazz) => attr.replace(clazz,"").trim() , node.getAttribute("class"))
			.replace(/\s+/g," ")
		)
	}
	const addClass = (node, classes) =>{
		node.setAttribute('class', (node.getAttribute("class")+" "+classes).replace(/\s+/g," "))
	}
	const hasClass = (node, clazz) => node.getAttribute("class").split(/\s+/).includes(clazz)
	
	
	
	//boostrap : launch after the page content is loaded
	document.addEventListener('DOMContentLoaded', (event) => {
		let abacuses = document.getElementsByClassName("abacus")
		for( x=0; x<abacuses.length; x++){
			let jsObject = new Abacus(abacuses.item(x));
			abacuses.item(x).abacus = jsObject;
		}
	});

})();