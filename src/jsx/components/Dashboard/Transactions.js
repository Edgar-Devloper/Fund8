import React,{Fragment,useState, useRef, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Dropdown} from 'react-bootstrap';
import {ArrowUp,ArrowDown, CoinIcon1, 
	CoinIcon2, CoinIcon3, CoinIcon4	} 
from "../Boltz/Transactions/TableData";
// images
import table1 from "../../../images/table/pic-1.jpg";
import table2 from "../../../images/table/pic-2.jpg";
import table3 from "../../../images/table/pic-3.jpg";
import table4 from "../../../images/table/pic-4.jpg";
import table5 from "../../../images/table/pic-5.jpg";
import table6 from "../../../images/table/pic-6.jpg";
import table7 from "../../../images/table/pic-7.jpg";
import table8 from "../../../images/table/pic-8.jpg";
import table9 from "../../../images/table/pic-9.jpg";
import table10 from "../../../images/table/pic-10.jpg";


const Transactions = () => {
	const [country1, setCountry1] = useState("Medan, IDN");	
	const [data, setData] = useState( document.querySelectorAll("#transaction_table tbody tr"));
	const sort = 8;
	const activePag = useRef(0);
	const [test, settest] = useState(0);

	  // Active data
	const chageData = (frist, sec) => {
		for (var i = 0; i < data.length; ++i) {
			 if (i >= frist && i < sec) {
				data[i].classList.remove("d-none");
			} else {
				data[i].classList.add("d-none");
			}
		}
	};
	  // use effect
	useEffect(() => {
		setData(document.querySelectorAll("#transaction_table tbody tr"));
	}, [test]);

	// Active pagginarion
		activePag.current === 0 && chageData(0, sort);
	// paggination
		let paggination = Array(Math.ceil(data.length / sort))
			.fill()
			.map((_, i) => i + 1);

	  // Active paggination & chage data
	const onClick = (i) => {
		activePag.current = i;
		chageData(activePag.current * sort, (activePag.current + 1) * sort);
		settest(i);
	};
	return(
		<Fragment>
			<div className="mb-sm-5 mb-3 d-flex flex-wrap align-items-center text-head">
				<h2 className="font-w600 mb-2 me-auto">Transactions List</h2>
				<Dropdown className=" weather-btn mb-2">
					<span className="fs-22 font-w600 d-flex"><i className="fa fa-cloud me-3 ms-3"></i>21</span>
					<Dropdown.Toggle variant="" as="div" className="form-control style-3 default-select">{country1} </Dropdown.Toggle>
					<Dropdown.Menu >
						<Dropdown.Item onClick={() => setCountry1("Medan, IDN")}>Medan, IDN</Dropdown.Item>
						<Dropdown.Item onClick={() => setCountry1("Jakarta, IDN<")}>Jakarta, IDN</Dropdown.Item>
						<Dropdown.Item onClick={() => setCountry1("Surabaya, IDN")}>Surabaya, IDN</Dropdown.Item>
					 </Dropdown.Menu>
				</Dropdown>
				<Link to={"#"} className="btn btn-primary mb-2 rounded"><i className="las la-calendar scale5 me-3"></i>Filter Periode</Link>
			</div>
			<div className="row">
				<div className="col-xl-12">
					<div className="table-responsive table-hover fs-14">
						<div id="example5_wrapper" className="dataTables_wrapper no-footer">
							<table className="table display mb-4 dataTablesCard short-one card-table text-black tbl-link dataTable no-footer" id="transaction_table"
								>
								<thead>
									<tr role="row">
										<th className="sorting_asc">
											<div className="checkbox me-0 align-self-center">
												<div className="form-check me-0 custom-checkbox ">
													<input type="checkbox" className="form-check-input" id="checkAll" required/>
													<label className="form-check-label" htmlFor="checkAll"/>
												</div>
											</div>
										</th>
										<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1} 
											> Transaction ID
										</th>
										<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1} 
											>Date
										</th>
										<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1} 
											 >From
										</th>
										<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1} 
											> To
										</th>
										<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1} 
											>Coin
										</th>
										<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1} 
											 >Amount
										</th>
										<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1} 
											>Note
										</th>
										<th className="sorting" tabIndex={0}  rowSpan={1} colSpan={1} 
											>Status
										</th>
									</tr>
								</thead>
								<tbody>
									<tr role="row" className="odd">
										<td className="pe-0 sorting_1"><ArrowUp /></td>
										<td>#12415346563475</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table1} alt="" className="rounded-circle me-2 width36 height36"/><span>Samuel</span></div></td>
										<td className="wspace-no"><CoinIcon4 /></td>
										<td><span className="text-black font-w600">+$5,553</span></td>
										<td><p className="mb-0 wspace-no"> Lorem ipsum dol</p></td>
										<td><Link to="/transactions" className="btn-link text-danger float-end">CANCELED</Link></td>
									</tr>
									<tr role="row" className="even">
										<td className="pe-0 sorting_1"><ArrowDown /></td>
										<td>#987654123564892</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table2} alt="" className="rounded-circle me-2 width36 height36"/><span>Cindy</span></div></td>
										<td className="wspace-no"><CoinIcon2 /></td>
										<td><span className="text-black font-w700">-$12,768</span></td>
										<td><p className="mb-0 wspace-no">Lorem ipsum dol</p></td>
										<td><Link to="/transactions" className="btn-link text-success float-end">COMPLETED</Link></td>
									</tr>
									<tr role="row" className="odd">
										<td className="pe-0 sorting_1"><ArrowDown /></td>
										<td>#124153465125511</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table3} alt="" className="rounded-circle me-2 width36 height36"/><span>Marquezz</span></div></td>
										<td className="wspace-no"><CoinIcon1 /></td>
										<td> <span className="text-black font-w700">-$455</span></td>
										<td><p className="mb-0"> Lorem ipsum dol</p></td>
										<td> <Link to="/transactions" className="btn-link text-success float-end">COMPLETED</Link></td>
									</tr>
									<tr role="row" className="even">
										<td className="pe-0 sorting_1"><ArrowUp /></td>
										<td>#987654123564892</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table4} alt="" className="rounded-circle me-2 width36 height36" /> <span>David</span></div></td>
										<td className="wspace-no"> <CoinIcon3 /></td>
										<td><span className="text-black font-w700">+$5,553</span></td>
										<td><p className="mb-0">None</p></td>
										<td> <Link to="/transactions" className="btn-link text-light float-end">PENDING</Link></td>
									</tr>
									<tr role="row" className="odd">
										<td className="pe-0 sorting_1"><ArrowDown /></td>
										<td>#12415346563475</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Thomas</td>
										<td><div className="d-flex align-items-center"><img src={table5} alt="" className="rounded-circle me-2 width36 height36"/><span>Cindy</span></div></td>
										<td className="wspace-no"><CoinIcon4 /></td>
										<td><span className="text-black font-w700">+$5,553</span></td>
										<td><p className="mb-0">Lorem ipsum dol</p></td>
										<td><Link to="/transactions" className="btn-link text-success float-end">COMPLETED</Link></td>
									</tr>
									<tr role="row" className="even">
										<td className="pe-0 sorting_1"><ArrowUp /></td>
										<td>#987654123564892</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table6} alt="" className="rounded-circle me-2 width36 height36"/><span>Samuel</span></div></td>
										<td className="wspace-no"><CoinIcon2 /></td>
										<td><span className="text-black font-w700">-$12,768</span></td>
										<td><p className="mb-0 ">None</p></td>
										<td><Link to="/transactions" className="btn-link text-light float-end"> PENDING</Link></td>
									</tr>
									<tr role="row" className="odd">
										<td className="pe-0 sorting_1"><ArrowDown /></td>
										<td>#124153465125511</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table7} alt="" className="rounded-circle me-2 width36 height36"/><span>Samuel</span></div></td>
										<td className="wspace-no"> <CoinIcon1 /></td>
										<td><span className="text-black font-w700">-$455</span></td>
										<td><p className="mb-0">Lorem ipsum dol</p></td>
										<td><Link to="/transactions" className="btn-link text-danger float-end">CANCELED</Link></td>
									</tr>
									<tr role="row" className="odd">
										<td className="pe-0 sorting_1"><ArrowDown /></td>
										<td>#987654123564892</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table8} alt="" className="rounded-circle me-2 width36 height36"/><span>David</span></div></td>
										<td className="wspace-no"> <CoinIcon4 /></td>
										<td><span className="text-black font-w700">-$455</span></td>
										<td><p className="mb-0">Lorem ipsum dol</p></td>
										<td><Link to="/transactions" className="btn-link text-light float-end">PENDING</Link></td>
									</tr>
								  
									<tr role="row" className="odd">
										<td className="pe-0 sorting_1"><ArrowUp /></td>
										<td>#12415346563475</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table9} alt="" className="rounded-circle me-2 width36 height36"/><span>Lucyana</span></div></td>
										<td className="wspace-no"><CoinIcon4 /></td>
										<td><span className="text-black font-w700">+$5,553</span></td>
										<td><p className="mb-0">Lorem ipsum dol</p></td>
										<td><Link to="/transactions" className="btn-link text-success float-end"> COMPLETED</Link></td>
									</tr>
									<tr role="row" className="even">
										<td className="pe-0 sorting_1"><ArrowDown /></td>
										<td>#987654123564892</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table10} alt="" className="rounded-circle me-2 width36 height36"/><span>Cindy</span></div></td>
										<td className="wspace-no"><CoinIcon3 /></td>
										<td><span className="text-black font-w700">-$12,768</span></td>
										<td><p className="mb-0 text-dark">Lorem ipsum dol</p></td>
										<td><Link to="/transactions" className="btn-link text-success float-end">COMPLETED</Link></td>
									</tr>
									<tr role="row" className="odd">
										<td><ArrowUp /></td>
										<td>#12415346563475</td>
										<td>2/5/2020 06:24 AM</td>
										<td>Marquezz</td>
										<td><div className="d-flex align-items-center"><img src={table1} alt="" className="rounded-circle me-2 width36 height36"/><span>Lucyana</span></div></td>
										<td className="wspace-no"><CoinIcon4 /></td>
										<td><span className="text-black font-w700">+$5,553</span></td>
										<td><p className="mb-0">Lorem ipsum dol</p></td>
										<td><Link to="/transactions" className="btn-link text-success float-end">COMPLETED</Link></td>
									</tr>
								</tbody>
							</table>
							<div className="d-sm-flex text-center justify-content-between align-items-center mt-3">
								<div className="dataTables_info">
									Showing {activePag.current * sort + 1} to{" "}
									{data.length > (activePag.current + 1) * sort
									? (activePag.current + 1) * sort
									: data.length}{" "}
									of {data.length} entries
								</div>
								<div className="dataTables_paginate paging_simple_numbers" id="example5_paginate">
									<Link className="paginate_button previous disabled" to="/transactions" onClick={() => activePag.current > 0 && onClick(activePag.current - 1)}>
										Previous
									</Link>
									<span>
										{paggination.map((number, i) => (
											<Link key={i} to="/transactions" className={`paginate_button  ${ activePag.current === i ? "current" : ""} `} 
												onClick={() => onClick(i)}style={{ display: "inline-block" }}>{number}
											</Link>
										))}
									</span>
									<Link className="paginate_button next" to="/transactions" onClick={() => activePag.current + 1 < paggination.length && onClick(activePag.current + 1)}>
										Next
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	)
} 
export default Transactions;