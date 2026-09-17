// Heart Chart Start
export const heartchart = {
   chart: {
      type: 'bar',
      height: 200,
      stacked: false,
      parentHeightOffset: 0,
      parentWidthOffset: 0,  
      toolbar:{
        show: false
      },       
    },
    series: [
      {
        name: 'Faded',
        data: [60, 140, 100, 120, 130],
        color: 'rgba(255, 195, 0, 0.3)'
      },
      {
        name: 'Actual',
        data: [40, 130, 90, 110, 120],
        color: '#FFC300'
      }
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        endingShape: 'flat',
        grouped: false
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: false
    },
    grid: {
      show: true,
      borderColor: '#eee',
      strokeDashArray: 1,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    xaxis: {
      categories: ['00:00', '14:41', '29:11', '44:08', '58:56'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 50,
      max: 180,
      tickAmount: 4,
      labels: {       
        style: {
          fontSize: '14px'
        }
      }
    }
};
// Heart Chart End