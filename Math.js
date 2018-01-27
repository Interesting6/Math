{
	window.math = {};
	math.Number = js.Class(function Number(real, imaginary) {
		if(arguments.length === 1) {
			if(+real === real) {
				[this.real, this.imaginary] = [real, 0];
			} else if(real instanceof math.Number) {
				this.real = real.real;
				this.imaginary = real.imaginary;
			} else
				throw new TypeError('Unresolvable input type');
		} else {
			[real, imaginary] = [+real, +imaginary];
			if(isNaN(real) || isNaN(imaginary))
				throw new TypeError('The components of a number must not be NaN');
			[this.real, this.imaginary] = [real, imaginary];
		}
	})({})({
		get modulus() {
			return this.real * this.real + this.imaginary * this.imaginary;
		},
		set modulus(value) {
			if(this.real === this.imaginary === 0)
				this.real = value;
			else {
				let ratio = value / this.modulus;
				this.real *= ratio;
				this.imaginary *= ratio;
			}
		},
		get argument() {
			return Math.atan2(this.imaginary, this.real);
		},
		set argument(value) {
			let sin = Math.sin(value), cos = Math.cos(value);
			[this.real, this.imaginary] = [
				this.real * cos - this.imaginary * sin,
				this.real * sin + this.imaginary * cos
			];
		},
		Plus(operatee) {
			let result = new math.Number(this);
			result.real += operatee.real;
			result.imaginary += operatee.imaginary;
			return result;
		},
		Multiply(operatee) {
			let result = new math.Number(this);
			result.modulus *= operatee.modulus;
			result.argument += operatee.argument;
			result.argument %= Math.PI;
			return result;
		}
	});
	math.Tensor = js.Class(function Tensor(value) {
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
			if(!(operatee instanceof math.Tensor))
				operatee = new math.Tensor(operatee);
			return new math.Tensor(
				operatee.degree === 0 ?
					this.degree === 0 ?
						this.value * operatee.value :
						this.value.map(value => value.Product(operatee)) :
					operatee.value.map(sub => this.Product(sub))
			);
		},
		Plus(operatee) {
			if(!(operatee instanceof math.Tensor))
				operatee = new math.Tensor(operatee);
			if(operatee.degree !== this.degree || !js.Equal(operatee.size)(this.size))
				throw new RangeError('Cannot plus two tensors in different sizes');
			return new math.Tensor(
				this.degree === 0 ?
					this.value + operatee.value :
					this.value.map((v, i) => v.Plus(operatee.value[i]))
			);
		},
		Get(indexes) {
			return indexes.length ? new math.Tensor(this.degree ? this.value[indexes[0]].Get(indexes.slice(1)) : this.value) : this;
		},
		Set(indexes, operatee) {
			if(!(operatee instanceof math.Tensor))
				operatee = new math.Tensor(operatee);
			indexes.length ? this.value[indexes[0]].Set(indexes.slice(1), operatee) : this.value = operatee.value;
		},
		Dot(operatee) {
			if(!(operatee instanceof math.Tensor))
				operatee = new math.Tensor(operatee);
			return new math.Tensor(!operatee.degree ?
				!this.degree ?
					operatee.value * this.value :
					this.value.map(value => value.Dot(operatee)).reduce((a, b) => a.Plus(b), new math.Tensor(0)) :
				operatee.value.map(sub => this.Dot(sub)).reduce((a, b) => a.Plus(b), new math.Tensor(0))
			)
		}
	});
}