import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {Tab, Nav} from 'react-bootstrap';

import {TransactionsData, TransactionsData2, TransactionsData3} from './TabContent';

const PreviousTab = () =>{
	
	return(
		<>
			<div className="col-xl-6 col-xxl-12">
				<Tab.Container defaultActiveKey="Monthly">
					<div className="card">
						<div className="card-header d-block d-sm-flex flex-wrap border-0">
							<div className="mb-3">
								<h4 className="fs-20 text-black">Recent Trading Activities</h4>
								<p className="mb-0 fs-12">Lorem ipsum dolor sit amet, consectetur</p>
							</div>
							<div className="card-action card-tabs mb-3 style-1">
								<Nav as="ul" className="nav nav-tabs" role="tablist">
									<Nav.Item as="li">
										<Nav.Link  eventKey="Monthly">Monthly</Nav.Link>
									</Nav.Item>
									<Nav.Item as="li" >
										<Nav.Link   eventKey="Weekly">Weekly</Nav.Link>
									</Nav.Item>
									<Nav.Item as="li" >
										<Nav.Link   eventKey="Today">Today</Nav.Link>
									</Nav.Item>
								</Nav>
							</div>
						</div>
						<div className="card-body py-0 px-3">
							<div className="tab-content">
								<div className="tab-pane active show fade" id="monthly" role="tabpanel">
									<Tab.Content>
										<Tab.Pane eventKey="Monthly">
											<div className="table-responsive">
												<table className="table border-hover tr-rounded card-table cardtbl-link">
													<tbody>
														{TransactionsData.map((item, index)=>(
															<tr key={index}>
																<td>
																	{item.icons}
																</td>
																<td className="wspace-no">
																	{item.title}
																</td>
																<td>
																	<span className="text-black">06:24:45 AM</span>
																</td>
																<td><span className="font-w600 text-black">{item.price}</span></td>
																<td>{item.status}</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</Tab.Pane>	
										<Tab.Pane eventKey="Weekly">	
											<div className="table-responsive">
												<table className="table table-responsive-md card-table transactions-table">
													<tbody>
														{TransactionsData2.map((item, index)=>(
															<tr key={index}>
																<td>
																	{item.icons}
																</td>
																<td>
																	<h6 className="fs-16 font-w600 mb-0"><Link to={"#"} className="text-black">{item.title}</Link></h6>
																	<span className="fs-14">{item.subtitle}</span>
																</td>
																<td>
																	<h6 className="fs-16 text-black font-w600 mb-0">{item.date}</h6>
																	<span className="fs-14">05:34:45 AM</span>
																</td>
																<td><span className="fs-16 text-black font-w600">{item.price}</span></td>
																<td>{item.status}</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</Tab.Pane>	
										<Tab.Pane eventKey="Today">	
											<div className="table-responsive">
												<table className="table table-responsive-md card-table transactions-table">
													<tbody>
														{TransactionsData3.map((item, index)=>(
															<tr key={index}>
																<td>
																	{item.icons}
																</td>
																<td>
																	<h6 className="fs-16 font-w600 mb-0"><Link to={"#"}  className="text-black">{item.title}</Link></h6>
																	<span className="fs-14">{item.subtitle}</span>
																</td>
																<td>
																	<h6 className="fs-16 text-black font-w600 mb-0">{item.date}</h6>
																	<span className="fs-14">05:34:45 AM</span>
																</td>
																<td><span className="fs-16 text-black font-w600">{item.price}</span></td>
																<td>{item.status}</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</Tab.Pane>	
									</Tab.Content>		
								</div>
							</div>	
						</div>
					</div>
				</Tab.Container>	
			</div>
		</>
	)
} 
export default PreviousTab;