{
	window.math = {};
	let Tensor = math.Tensor = function Tensor(value) {
		if(!(this instanceof Tensor)) {
			return new Tensor(...arguments);
		}
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
		Product(multiplier) {
			return (value => new Tensor(value))(
				!multiplier.dimension ?
					!this.dimension ?
						this.value * multiplier.value :
						this.value.map(value => value.Product(multiplier)) :
					multiplier.value.map(mul => this.Product(mul))
			);
		},
		Plus(pluser) {
			if(pluser.dimension !== this.dimension || !js.Equal(pluser.size)(this.size))
				throw new RangeError('Cannot plus two tensors with different type');
			return new Tensor(
				this.dimension === 0 ?
					this.value + pluser.value :
					this.value.map((v, i) => v.Plus(pluser.value[i]))
			)
		}
	})(Tensor.prototype);
}