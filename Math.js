{
	window.math = {};
	let Tensor = math.Tensor = function Tensor(value) {
		if(!(this instanceof Tensor))
			return new Tensor(...arguments);
		if(value instanceof Array) {    // value is iteratable, should've use that Symbol or something
			this.value = value.map(v => new Tensor(v));
			this.dimension = this.value[0].dimension + 1;
			this.size = [value.length].concat(this.value[0].size);
		} else if(value instanceof Tensor) {
			this.value = new Tensor(value.Raw()).value;
			this.dimension = value.dimension;
			this.size = value.size.slice();
		} else {
			this.value = value;
			this.dimension = 0;
			this.size = [];
		}
	};
	js.HardMixin({
		Raw() {
			return this.dimension === 0 ? this.value : this.value.map(v => v.Raw());
		},
		Product(operatee) {
			if(!(operatee instanceof Tensor))
				operatee = Tensor(operatee);
			return (value => new Tensor(value))(
				!operatee.dimension ?
					!this.dimension ?
						this.value * operatee.value :
						this.value.map(value => value.Product(operatee)) :
					operatee.value.map(mul => this.Product(mul))
			);
		},
		Plus(operatee) {
			if(!(operatee instanceof Tensor))
				operatee = Tensor(operatee);
			if(operatee.dimension !== this.dimension || !js.Equal(operatee.size)(this.size))
				throw new RangeError('Cannot plus two tensors with different type');
			return new Tensor(
				this.dimension === 0 ?
					this.value + operatee.value :
					this.value.map((v, i) => v.Plus(operatee.value[i]))
			)
		},
		Get(indexes) {
			return indexes.length ? new Tensor(this.dimension ? this.value[indexes[0]].Get(indexes.slice(1)) : this.value) : this;
		},
		Set(indexes, operatee) {
			if(!(operatee instanceof Tensor))
				operatee = Tensor(operatee);
			indexes.length ? this.value[indexes[0]].Set(indexes.slice(1), operatee) : this.value = operatee.value;
		}
	})(Tensor.prototype);
}