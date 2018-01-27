let matrix0 = math.Tensor([
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8]
]);
let vector0 = math.Tensor([0, 1, 2]);
let vector1 = math.Tensor([1, 2, 3]);
console.log(matrix0.Dot(vector0).Raw());
console.table(vector0.Product(vector1).Raw());