{
	window.math = {};
	let Number = math.Number = js.Class(function Number() {
	
	})({})({});
	let Tensor = math.Tensor = js.Class(function Tensor(value) {
		if(typeof value[Symbol.iterator] !== 'undefined') {
			this.value = [];
			for(let row of value)
				this.value.push(new Tensor(row));
			this.degree = this.value[0].degree + 1;
			this.size = [value.length].concat(this.value[0].size);
		} else if(js.IsInstanceOf(Tensor)(value)) {
			this.value = new Tensor(value.Raw()).value;
			this.degree = value.degree;
			this.size = value.size.slice();
		} else {    // default case, e.g. numbers, complex numbers (not finished yet)
			this.value = value;
			this.degree = 0;
			this.size = [];
		}
		// validate size
		if(this.degree) {
			let standard = this.value[0].value.length;
			if(this.value.some(row => row.value.length !== standard))
				throw new RangeError('The tensor is not in a uniform size');
		}
	})({})({
		Raw() {
			return this.degree === 0 ? this.value : this.value.map(value => value.Raw());
		},
		Product(operatee) {
			if(!(operatee instanceof Tensor))
				operatee = new Tensor(operatee);
			return new Tensor(
				operatee.degree === 0 ?
					this.degree === 0 ?
						this.value * operatee.value :
						this.value.map(value => value.Product(operatee)) :
					operatee.value.map(sub => this.Product(sub))
			);
		},
		Plus(operatee) {
			if(!(operatee instanceof Tensor))
				operatee = new Tensor(operatee);
			if(operatee.degree !== this.degree || !js.Equal(operatee.size)(this.size))
				throw new RangeError('Cannot plus two tensors in different sizes');
			return new Tensor(
				this.degree === 0 ?
					this.value + operatee.value :
					this.value.map((v, i) => v.Plus(operatee.value[i]))
			);
		},
		Get(indexes) {
			return indexes.length ? new Tensor(this.degree ? this.value[indexes[0]].Get(indexes.slice(1)) : this.value) : this;
		},
		Set(indexes, operatee) {
			if(!(operatee instanceof Tensor))
				operatee = new Tensor(operatee);
			indexes.length ? this.value[indexes[0]].Set(indexes.slice(1), operatee) : this.value = operatee.value;
		},
		Dot(operatee) {
			if(!(operatee instanceof Tensor))
				operatee = new Tensor(operatee);
			return new Tensor(!operatee.degree ?
				!this.degree ?
					operatee.value * this.value :
					this.value.map(value => value.Dot(operatee)).reduce((a, b) => a.Plus(b), new Tensor(0)) :
				operatee.value.map(sub => this.Dot(sub)).reduce((a, b) => a.Plus(b), new Tensor(0))
			)
		}
	});
}