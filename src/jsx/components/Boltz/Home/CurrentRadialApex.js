import React from "react";
import ReactApexChart from "react-apexcharts";

class CurrentRadialApex extends React.Component {
  constructor(props) {
    super(props);

    const incomePercent = props.incomePercent || 0;
    const spendsPercent = props.spendsPercent || 0;
    const feesPercent = props.feesPercent || 0;
    const investPercent = props.investPercent || 0;

    this.state = {
	    series: [incomePercent, spendsPercent, feesPercent, investPercent],
		options: {
			chart: {
				height: 350,
				type: "radialBar",
			},
			plotOptions: {
				radialBar: {
					startAngle:-90,
					endAngle: 90,
					dataLabels: {
						name: {
							fontSize: '22px',
						},
						value: {
							fontSize: '16px',
						},
					},
				},
			},
			stroke:{
				lineCap: 'round',
			},
			labels: ['Income', 'Spends', 'Fees', 'Invest'],
			colors:['#FFAF65', '#4441DE','#60C695','#F34F80'],
		},
      
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.incomePercent !== this.props.incomePercent ||
        prevProps.spendsPercent !== this.props.spendsPercent ||
        prevProps.feesPercent !== this.props.feesPercent ||
        prevProps.investPercent !== this.props.investPercent) {
      const incomePercent = this.props.incomePercent || 0;
      const spendsPercent = this.props.spendsPercent || 0;
      const feesPercent = this.props.feesPercent || 0;
      const investPercent = this.props.investPercent || 0;
      
      this.setState({
        series: [incomePercent, spendsPercent, feesPercent, investPercent]
      });
    }
  }

	render() {
		return (
			<div id="chart" >
				<ReactApexChart
				  options={this.state.options}
				  series={this.state.series}
				  type="radialBar"
				  height={350}
				/>
			</div>
		);
	}
}

export default CurrentRadialApex;