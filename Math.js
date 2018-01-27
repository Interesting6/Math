{
	window.math = {};
	let Tensor = math.Tensor = js.Class(function Tensor(value) {
		if(value instanceof Array) {
			this.value = value.map(v => new Tensor(v));
			this.dimension = this.value[0].dimension + 1;
			this.size = [value.length].concat(this.value[0].size);
		} else if(js.IsInstanceOf(Tensor)(value)) {
			this.value = new Tensor(value.Raw()).value;
			this.dimension = value.dimension;
			this.size = value.size.slice();
		} else {
			this.value = value;
			this.dimension = 0;
			this.size = [];
		}
	})({})({
		Raw() {
			return this.dimension === 0 ? this.value : this.value.map(value => value.Raw());
		},
		Product(operatee) {
			if(!(operatee instanceof Tensor))
				operatee = new Tensor(operatee);
			return new Tensor(
				operatee.dimension === 0?
					this.dimension === 0?
						this.value * operatee.value :
						this.value.map(value => value.Product(operatee)) :
					operatee.value.map(sub => this.Product(sub))
			);
		},
		Plus(operatee) {
			if(!(operatee instanceof Tensor))
				operatee = new Tensor(operatee);
			if(operatee.dimension !== this.dimension || !js.Equal(operatee.size)(this.size))
				throw new RangeError('Cannot plus two tensors with different type');
			return new Tensor(
				this.dimension === 0 ?
					this.value + operatee.value :
					this.value.map((v, i) => v.Plus(operatee.value[i]))
			);
		},
		Get(indexes) {
			return indexes.length ? new Tensor(this.dimension ? this.value[indexes[0]].Get(indexes.slice(1)) : this.value) : this;
		},
		Set(indexes, operatee) {
			if(!(operatee instanceof Tensor))
				operatee = new Tensor(operatee);
			indexes.length ? this.value[indexes[0]].Set(indexes.slice(1), operatee) : this.value = operatee.value;
		},
		Dot(operatee) {
			if(!(operatee instanceof Tensor))
				operatee = new Tensor(operatee);
			return new Tensor(!operatee.dimension ?
				!this.dimension ?
					operatee.value * this.value :
					this.value.map(value => value.Dot(operatee)).reduce((a, b) => a.Plus(b), new Tensor(0)) :
				operatee.value.map(sub => this.Dot(sub)).reduce((a, b) => a.Plus(b), new Tensor(0))
			)
		}
	});
}