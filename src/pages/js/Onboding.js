import { themeColors } from '../js/config';

// Onboding Chart Start
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const onbodingchart = {
  chart: {
    type: 'radialBar',
    height: 300,
    sparkline: { enabled: false },
  },
  series: [75],
  plotOptions: {
    radialBar: {
      hollow: { 
        size: '65%'  // reduced from 80%
      },
      track: {
        background: hexToRgba(themeColors.themeprimary, 0.2),        
        margin: 0,
      },
      dataLabels: {
        show: true,
        name: { show: false },
        value: {
          fontSize: '32px',
          fontWeight: 600,
          offsetY: 5,
          color: '#333',
          formatter: (val) => `${val}%`,
        }
      }
    }
  },
  colors: [themeColors.themeprimary],  // single color for one series
  labels: ['Primary'],
  legend: { show: false },
};
// Onboding Chart End
