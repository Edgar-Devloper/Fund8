import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import { TabContent, TabPane, } from 'reactstrap';
import classnames from 'classnames';

import {TransactionsData, TransactionsData2, TransactionsData3} from './TabContent';

const PreviousTab = () =>{
	const [activeTab, setActiveTab] = useState('1');
    const toggle = tab => {
        if (activeTab !== tab) setActiveTab(tab);
    }
	return(
		<>
			<div className="col-xl-6 col-xxl-12">
				<div className="card">
					<div className="card-header d-block d-sm-flex border-0">
						<div className="me-3">
							<h4 className="card-title mb-2">Previous Transactions</h4>
							<span className="fs-12">Lorem ipsum dolor sit amet, consectetur</span>
						</div>
						<div className="card-tabs mt-3 mt-sm-0">
							<ul className="nav nav-tabs" role="tablist">
								<li className="nav-item">
									<Link to ={"#"} 
										className= {classnames({ active : activeTab === '1'}) + ' nav-link'} 
										onClick={() => { toggle('1'); }}
									>
										Monthly
									</Link>
								</li>
								<li className="nav-item">
									<Link to ={"#"} 
										className= {classnames({ active : activeTab === '2'}) + ' nav-link'} 
										onClick={() => { toggle('2'); }}
									>
										Weekly
									</Link>
								</li>
								<li className="nav-item">
									<Link to ={"#"} 
										className= {classnames({ active : activeTab === '3'}) + ' nav-link'} 
										onClick={() => { toggle('3'); }}
									>
										Today
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className="card-body tab-content p-0">
						<div className="tab-pane active show fade" id="monthly" role="tabpanel">
							<TabContent activeTab={activeTab}>
								<TabPane tabId="1">
									<div className="table-responsive">
										<table className="table table-responsive-md card-table transactions-table">
											<tbody>
												{TransactionsData.map((item)=>(
													<tr>
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
								</TabPane>	
								<TabPane tabId="2">	
									<div className="table-responsive">
										<table className="table table-responsive-md card-table transactions-table">
											<tbody>
												{TransactionsData2.map((item)=>(
													<tr>
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
								</TabPane>	
								<TabPane tabId="3">	
									<div className="table-responsive">
										<table className="table table-responsive-md card-table transactions-table">
											<tbody>
												{TransactionsData3.map((item)=>(
													<tr>
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
								</TabPane>	
							</TabContent>		
						</div>
					</div>
				</div>
			</div>
		</>
	)
} 
export default PreviousTab;