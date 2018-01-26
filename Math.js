{
	window.math = {};
	let Tensor = math.Tensor = js.Class(function Tensor(value) {
			if(value instanceof Array) {    // value is iteratable, should've use that Symbol or something
				this.value = value.map(v => new Tensor(v));
				this.dimension = this.value[0].dimension + 1;
				this.size = [value.length].concat(this.value[0].size);
			} else if(js.IsInstanceOf(Tensor)(value)) {
				this.value = new Tensor(value.Raw()).value;
				this.size = value.size.slice();
			} else {
				this.value = value;
				this.dimension = 0;
				this.size = [];
			}
		}
	)
	({})({
		Raw() {
			return this.dimension === 0 ? this.value : this.value.map(v => v.Raw());
		}
	});
}