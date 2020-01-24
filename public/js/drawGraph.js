let dates = ['2013-10-04', '2013-11-04', '2013-12-04','2013-12-20'];
  let tickets = [1, 3, 6, 8];
  var data = [
  {
    x: dates,
    y: tickets,
    type: 'scatter'
  }
];

Plotly.newPlot('myDiv', data);
