function topStockPrices(stocks, prices) {
  const result = {};
  stocks.forEach((element, index) => {
    const average =
      prices[index].reduce((arr, va) => arr + va, 0) / prices[index].length;
    result[element] = average;
  });
  console.log("result: ", result);

  let values = Object.values(result);
  values = values.sort((a, b) => b - a);
  // console.log("values: ", values);
  const finalResult = [];
  const keys = Object.keys(result).forEach((value) => {
    if (
      result[value] == values[0] ||
      result[value] == values[1] ||
      result[value] == values[2]
    ) {
      finalResult.unshift(value);
    }
  });

  // console.log("final: ", finalResult);
  return finalResult;
}
console.log(
  "topStocks: ",
  topStockPrices(
    ["AZ", "PP", "AA", "EE", "OL"],
    [
      [34, 12, 43, 54, 34],
      [13, 53, 55, 23, 11],
      [10, 1, 44, 22, 42],
      [55, 90, 64, 36, 33],
      [64, 77, 89, 75, 77],
    ]
  )
);
