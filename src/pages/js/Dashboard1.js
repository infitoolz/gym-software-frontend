import { themeColors } from '../js/config';

// Water Chart Start
export const waterGaugeOptions = (value = 2.25, max = 3) => ({
  series: [
    {
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      min: 0,
      max: max,
      progress: {
        show: true,
        width: 14,
        itemStyle: {
          color: '#fff'
        }
      },
      axisLine: {
        lineStyle: {
          width: 14,
          color: [[1, 'rgba(255, 255, 255, 0.2)']]
        }
      },
      pointer: {
        show: false
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 16,
        fontWeight: 'normal',
        offsetCenter: [0, 0],
        formatter: (val) => `${val}\nLiters`,
        color: '#fff'
      },
      data: [{ value }]
    }
  ]
});
// Water Chart End


// calories start
export const calories = {
  tooltip: {
    formatter: "{a} <br/>{b} : {c}%",
  },
  series: [
    {
      name: "Today",
      type: "gauge",
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      radius: "90%",
      axisLine: {
        lineStyle: {
          width: 15,
          color: [
            [0.6, "rgba(255, 255, 255, 1)"],
            [1, "rgba(255, 255, 255, 0.2)"],
          ],
        },
      },
      pointer: {
        length: "60%",
        width: 4,
        itemStyle: {
          color: "black",
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { show: false },
      data: [{ value: 60, name: "" }],
    },
  ],
  graphic: [
    {
      type: "text",
      left: "center",
      top: "65%",
      style: {
        text: "Today",
        font: "bold 14px sans-serif",
        fill: "#fff",
      },
    },
    {
      type: "text",
      left: "center",
      top: "75%",
      style: {
        text: "Under",
        font: "14px sans-serif",
        fill: "#fff",
      },
    },
  ],
};
// calories end

// Heartrate Start
export const heartrate = {
  backgroundColor: '#f45b85',
  grid: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['0', '1', '2', '3', '4', '5', '6'],
    show: false,
  },
  yAxis: {
    type: 'value',
    show: false,
  },
  series: [
    {
      data: [60, 90, 50, 100, 60, 95, 80],
      type: 'line',
      smooth: false,
      lineStyle: {
        width: 4,
        color: 'rgba(255, 255, 255, 0.7)',
      },
      symbol: 'none',
    },
  ],
  graphic: {
    type: 'text',
    left: '10',
    bottom: '10',
    style: {
      text: '110 Bpm',
      font: 'bold 20px sans-serif',
      fill: '#fff',
    },
  },
};
// Heartrate End

// Activity Chart Start
export const activitychart = {
  series: [     
  {     
    name: 'Blance Flow',
    data: [20, 40, 30, 45, 60, 40, 25]
  }
  ],
  chart: {
    width: "100%",
    height: 270,
    type: 'bar',
    parentHeightOffset: 0,
    parentWidthOffset: 0,  
    toolbar:{
      show: false
    },       
},
labels: ['Mon','Tue','Wed', 'Thu','Fri','Sat','Sun'],
colors: [themeColors.themeprimary], 
plotOptions: {
  bar: {
    columnWidth: '30px',
    distributed: true,
    borderRadius: 5,
    endingShape: 'rounded'
  }
},
dataLabels: {
  enabled: false
},
legend: {
  show: false
},       
 grid:{     
  borderColor: '#edeeef',
  strokeDashArray: 3,
  padding:{
    top: 0,
    bottom:0,
    left:0,
    right: 0
  },     
  xaxis: {
    lines: {
      show: true
    }
  }
},
 yaxis:{
  labels:{
    show: false,
    offsetX:-20,  
  },
  axisTicks: {
    show:false
    },
    axisBorder:{
      show:false
    },
},
xaxis:{
  labels:{
    show: true,
    style: {
      colors: '#8392a5',
      fontSize: '14px',
      fontWeight: 500, 
      fontFamily: 'DM Sans , sans-serif'
    }   
  },
  axisTicks: {
    show:false
    },
    axisBorder:{
      show:false
    },
},    
};
// Activity Chart End


// Progress Chart Start
export const progresschart = {
  chart: {
    type: 'donut',
    height: 280,
  },
  states: {
    normal: {
      filter: {
        type: 'darken',
        value: 1,
      }
    },
    hover: {
      filter: {
        type: 'darken',
        value: 1,
      }
    },
    active: {
      allowMultipleDataPointsSelection: true,
      filter: {
        type: 'darken',
        value: 1,
      }
    },
  },
  stroke: {
    width: 0,
  },
  series: [30, 40, 30, 20],
  labels: ['Cardio', 'Stretching', 'Treadmill', 'Strength'],
  colors: ['#00BFA5', '#FF7043', '#F06292', '#7E57C2'],
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '75%',
        labels: {
          show: true,
          name: {
            show: true,
            offsetY: -10,
            color: '#999',
            fontSize: '14px',
          },
          value: {
            show: true,
            fontSize: '20px',
            fontWeight: 600,
            color: '#333',
            offsetY: 10,
          },
          total: { show: false }
        }
      }
    }
  },
  tooltip: {
    enabled: false
  }
};
// Progress Chart End