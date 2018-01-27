let number0 = new math.Number(0, 1);
let number1 = new math.Number(1);
console.log(number0.Multiply(number0).Plus(number1));

let matrix0 = new math.Tensor([
	[1, 2]
]);
let matrix1 = new math.Tensor([
	[1],
	[2]
]);
console.table(matrix0.Kronecker(matrix1).Raw());