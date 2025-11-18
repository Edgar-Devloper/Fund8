import React, { Component } from "react";
import { Polar } from "react-chartjs-2";

class PolarChart extends Component {
   render() {
		const data = {
			//labels: ["Mon", "Tue", "Wed", "Thu"],
			datasets: [{
				backgroundColor: [
					"#496ecc",
					"#68e365",
					"#ffa755",
					"#c8c8c8"
				],
				data: [40, 35, 30, 20]
			}]
		};
		const options = {
			maintainAspectRatio: false,
			scale: {
				scaleShowLine:false,
				display:false,
				pointLabels:{
					fontSize: 0       
				},
			},
			tooltips:{
				enabled:false,
			}
		};

		return (
			<>
				<Polar data={data} height={200} options={options} />
			</>
		);
   }
}

export default PolarChart;
