(function(){

	function Abacus(htmlRoot){
		this.htmlRoot=htmlRoot;
		this.attributes={
			direction:'vertical',
			rows:'6x4',
			counter:true,
			colors:"brown",
			weights:"1",
		}
		
		this.loadAttributes=()=>{
			this.attributes = {...this.attributes, ...this.htmlRoot.dataset}
			this.attributes.rows = this.extendRowsNotation(this.attributes.rows)
			this.attributes.colors = this.extendColorsNotation(this.attributes.colors)
			this.attributes.weights = this.extendWeightsNotation(this.attributes.weights)
		}
		this.extendRowsNotation = base => {
			return base.trim().replace(/\s+/g,' ').split(',')
				.map( line => line.trim().split(' ')
					.flatMap( number => {
						if(number.match(/^\d+$/)){ return Number(number) }
						else if(number.match(/^\d+x-?\d+$/)){
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
		this.extendWeightsNotation = base => {
			return base.trim().replace(/\s+/g,' ').split(',')
				.map( line => line.trim().split(' ')
					.flatMap( number => {
						if(number.match(/^\d+$/)){ return Number(number) }
						else if(number.match(/^\d+x\d+$/)){
							let [rep,val]=number.split('x')
							return new Array(Number(rep)).fill(Number(val))
						} 
						throw "wrong weights notation"
					}))
		}
		this.buildHtmlContent = ()=>{
			removeClass(this.htmlRoot,'vertical horizontal')
			addClass(this.htmlRoot,this.attributes.direction)
			this.attributes.rows.forEach( this.addColumnGroup )
			this.colorizePearls()
			this.resizePearls()
			this.addCounters()
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
			if(length<0){
				column.inverted=true
			}
			
			let firstSpacer = document.createElement('div')
			firstSpacer.setAttribute('class','spacer')
			column.appendChild(firstSpacer)
			
			let lastSpacer = null;
			
			for(let i=0;i<Math.abs(length);i++){
			 	let pearl = document.createElement('div')
			 	pearl.setAttribute('class','pearl')
				pearl.addEventListener('click', evt => this.togglePearl(evt.target))
				column.appendChild(pearl)
			 	lastSpacer = document.createElement('div')
			 	lastSpacer.setAttribute('class','spacer')
				column.appendChild(lastSpacer)
			}
			
			if(length>0){
				addClass(firstSpacer,'active')
			}else{
				addClass(lastSpacer,'active')
			}
			
			columnGroupNode.appendChild(column)
		}
		this.togglePearl = pearl => {
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
			this.refreshCounters()
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
			let columnGroups = [...this.htmlRoot.getElementsByClassName("column-group")]
			let maxColumns = columnGroups.reduce( (acc,columnGroup) => {
				return Math.max(acc,columnGroup.children.length)
			},0);
			
			let maxRows = [...this.htmlRoot.getElementsByClassName("column-group")].reduce( (acc,columnGroup) => {
				return acc + [...columnGroup.getElementsByClassName("column")].reduce( (acc,column) => {
					return Math.max(acc,column.getElementsByClassName("pearl").length);
					},0);
			},0);
			
			console.log(maxColumns+" x "+maxRows)
			
			let size = 0;
			if(this.attributes.direction=="horizontal"){ 
				size = Math.min(
					(this.htmlRoot.offsetHeight-20)/maxColumns-10,
					this.htmlRoot.offsetWidth/(maxRows+columnGroups.length+1)) 
			}else{ 
				size = Math.min(
					(this.htmlRoot.offsetWidth-20)/maxColumns-10,
					this.htmlRoot.offsetHeight/(maxRows+columnGroups.length+1)) 
			} 
			
			console.log(size);
			console.log(this.htmlRoot.offsetWidth + " x " + this.htmlRoot.offsetHeight);
			
			[...this.htmlRoot.getElementsByClassName("pearl")].forEach(pearl => {
				pearl.style.width = size
				pearl.style.height = size
				})
		}
		this.addCounters = () => {
			if(!this.attributes.counter) { return } 
			this.addWeights()
			let counterNum = this.attributes.rows.reduce( (acc, row) => {
				if(acc != row.length){  throw "unable to create counter : rows have different length" }
				return acc
			},this.attributes.rows[0].length)
			
			let counterGroup = document.createElement('div')
			counterGroup.setAttribute('class','counter-group')
			
			for(let i=0;i<counterNum;i++){
			 	let counter = document.createElement('div')
			 	counter.setAttribute('class','counter')
				counter.innerText = "0";
				counterGroup.appendChild(counter)
			}
			this.htmlRoot.appendChild(counterGroup)
		}
		
		this.addWeights = () => {
			console.log( this.attributes.weights )
				let colGroups = [...this.htmlRoot.getElementsByClassName("column-group")];
				for(let i=0;i<colGroups.length;i++){
					let colGroup = colGroups[i];
					let columns = [...colGroup.children]
					let lastWeight = this.attributes.weights[i][0];
					for(let j=0;j<columns.length;j++){
						columns[j].weight = lastWeight = (this.attributes.weights[i].length <= j)?lastWeight:this.attributes.weights[i][j]						
					}
				}
		}
		
		this.refreshCounters = () => {
			if(!this.attributes.counter) { return }
			
			for(let i=0;i<this.attributes.rows[0].length;i++){
				let sum=0
				for(let j=0;j<this.attributes.rows.length;j++){
					let column = this.htmlRoot.children[j].children[i]
					let divider = column.getElementsByClassName("active").item(0)
					let position = [...column.children].indexOf(divider)
					if(column.inverted){
						position = column.children.length-1-position
					}
					sum += position / 2 * column.weight
				}
				let counter = this.htmlRoot.getElementsByClassName("counter").item(i)
				counter.innerText = sum
			}
			
			
			
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