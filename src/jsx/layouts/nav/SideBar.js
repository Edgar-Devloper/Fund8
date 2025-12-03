import React, { Component, useContext, useEffect, useReducer, useState } from "react";
import { useTranslation } from 'react-i18next';

import PerfectScrollbar from "react-perfect-scrollbar";
//  import Collapse from 'react-bootstrap/Collapse';
import {Collapse, Dropdown} from 'react-bootstrap';

/// Link
import { Link } from "react-router-dom";

import {MenuList} from './Menu';
import {useScrollPosition} from "@n8tb1t/use-scroll-position";
import { ThemeContext } from "../../../context/ThemeContext";
import LogoutPage from './Logout';

import profile from "../../../images/profile/pic1.jpg";

const reducer = (previousState, updatedState) => {
  return {
    ...previousState,
    ...updatedState,
  };
};

const initialState = {
  active : "",
  activeSubmenu : "",
}



const SideBar = () => {
  const { t } = useTranslation();
  var d  = new Date();
  
	const {
		iconHover,
		sidebarposition,
		headerposition,
		sidebarLayout,
    ChangeIconSidebar,
  
	} = useContext(ThemeContext);

  const [state, setState] = useReducer(reducer, initialState);	
	//useEffect(() => {			
	//}, []);
 //For scroll
 
 
	  let handleheartBlast = document.querySelector('.heart');
	  function heartBlast(){
		return handleheartBlast.classList.toggle("heart-blast");
	  }
  
 	const [hideOnScroll, setHideOnScroll] = useState(true)
	useScrollPosition(
		({ prevPos, currPos }) => {
		  const isShow = currPos.y > prevPos.y
		  if (isShow !== hideOnScroll) setHideOnScroll(isShow)
		},
		[hideOnScroll]
	)

 
	const handleMenuActive = (status) => {
		if(state.active === status){
			setState({active : ""});
		} else {
			setState({active : status});
		}   
	}
	const handleSubmenuActive = (status) => {		
		if(state.activeSubmenu === status){
			setState({activeSubmenu : ""})			
		} else {
			setState({activeSubmenu : status})
		}    
	}
	// Menu dropdown list End

  /// Path
  let path = window.location.pathname;
  path = path.split("/");
  path = path[path.length - 1];
  	
  return (
    <div 
      onMouseEnter={()=>ChangeIconSidebar(true)}
      onMouseLeave={()=>ChangeIconSidebar(false)}
      className={`deznav  border-right ${iconHover} ${
        sidebarposition.value === "fixed" &&
        sidebarLayout.value === "horizontal" &&
        headerposition.value === "static"
          ? hideOnScroll > 120
            ? "fixed"
            : ""
          : ""
      }`}
      style={{
        cursor: 'default',
        pointerEvents: 'auto',
        zIndex: 100
      }}
    >
      <div 
        style={{ 
          height: '100%',
          overflow: 'auto',
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 100
        }}
        className="deznav-scroll"
      >         
          <ul 
            className="metismenu" 
            id="menu" 
            style={{ 
              pointerEvents: 'auto', 
              position: 'relative', 
              zIndex: 101,
              touchAction: 'auto'
            }}
          >
              <Dropdown as="li" className="nav-item dropdown header-profile">
                <Dropdown.Toggle
                  variant=""
                  as="a"
                  className="nav-link i-false c-pointer"
                  // href="#"
                  role="button"
                  data-toggle="dropdown"
                >
                  <img src={profile} width={20} alt="" />
                  <div className="header-info ms-3">
						        <span className="font-w600 ">Hi,<b>William</b></span>
						        <small className="text-end font-w400">william@example.com</small>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end" className=" dropdown-menu dropdown-menu-end">
                  <Link to="/app-profile" className="dropdown-item ai-icon">
                    <svg
                      id="icon-user1" xmlns="http://www.w3.org/2000/svg" className="text-primary"
                      width={18} height={18} viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx={12} cy={7} r={4} />
                    </svg>
                    <span className="ms-2">Profile </span>
                  </Link>
                  <Link to="/email-inbox" className="dropdown-item ai-icon">
                    <svg
                      id="icon-inbox" xmlns="http://www.w3.org/2000/svg" className="text-success" width={18}
                      height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span className="ms-2">Inbox </span>
                  </Link>
				          <LogoutPage />
                </Dropdown.Menu>
              </Dropdown>
              {MenuList.map((data, index)=>{
                let menuClass = data.classsChange;
                  if(menuClass === "menu-title"){
                    return(
                        <li className={menuClass}  key={index} >{t(data.title)}</li>
                    )
                  }else{
                    return(				
                      <li className={` ${ state.active === data.title ? 'mm-active' : ''}`}
                        key={index} 
                      >
                        
                        {data.content && data.content.length > 0 ? (
                            <div 
                              className={`sidebar-menu-item ${state.active === data.title ? 'active' : ''} ${data.title === 'nav.trader' ? 'sidebar-menu-item-trader' : ''}`}
                              data-menu-title={data.title}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMenuActive(data.title);
                              }}
                              style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.75rem 1.5rem',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                borderRadius: '0.5rem',
                                margin: '0.25rem 0.5rem',
                                pointerEvents: 'auto',
                                userSelect: 'none'
                              }}
                            >								
                              <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>
                                {data.iconStyle}
                              </span>
                              <span className="nav-text" style={{ flex: 1 }}>
                                {t(data.title)}
                              </span>
                              <span 
                                style={{
                                  fontSize: '0.75rem',
                                  transition: 'transform 0.3s ease',
                                  transform: state.active === data.title ? 'rotate(180deg)' : 'rotate(0deg)',
                                  opacity: 0.7,
                                  marginLeft: '0.5rem'
                                }}
                              >
                                ▼
                              </span>
                            </div>
                        ) : (
                          <Link to={data.to} className="sidebar-menu-item" style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            margin: '0.25rem 0.5rem',
                            textDecoration: 'none'
                          }}>
                              <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>
                                {data.iconStyle}
                              </span>
                              <span className="nav-text">{t(data.title)}</span>
                          </Link>
                        )}
                        {data.content && data.content.length > 0 && (
                          <div
                            style={{
                              maxHeight: state.active === data.title ? '1000px' : '0',
                              overflow: 'hidden',
                              transition: 'max-height 0.3s ease, opacity 0.3s ease',
                              opacity: state.active === data.title ? 1 : 0,
                              marginLeft: '1rem'
                            }}
                          >
                            <ul className={`${menuClass === "mm-collapse" ? "mm-show" : ""}`} style={{padding: '0.5rem 0'}}>
                            {data.content && data.content.map((data,index) => {									
                              return(	
                                  <li key={index}
                                    className={`${ state.activeSubmenu === data.title ? "mm-active" : ""}`}                                    
                                  >
                                    {data.content && data.content.length > 0 ?
                                        <>
                                          <Link to={data.to} className={data.hasMenu ? 'has-arrow' : ''}
                                            onClick={() => { handleSubmenuActive(data.title)}}
                                          >
                                            {t(data.title)}
                                          </Link>
                                          <ul className={`${menuClass === "mm-collapse" ? "mm-show" : ""} ${state.activeSubmenu === data.title ? "mm-show" : ""}`} style={{display: state.activeSubmenu === data.title ? 'block' : 'none'}}>
                                            {data.content && data.content.map((data,index) => {
                                              return(	
                                                  <li key={index}>
                                                    <Link className={`${path === data.to ? "mm-active" : ""}`} to={data.to}>{t(data.title)}</Link>
                                                  </li>
                                              )
                                            })}
                                          </ul>
                                        </>
                                      :
                                      <Link to={data.to}>
                                        {t(data.title)}
                                      </Link>
                                    }
                                    
                                  </li>
                                
                              )
                            })}
                            </ul>
                          </div>
                        )}
                      </li>	
                    )
                }
              })}          
          </ul>		
          <div className="copyright">
            <p><strong>Fund8-Tradin Panel</strong> © {d.getFullYear()} All Rights Reserved</p>
            <p className="fs-12">Made with <span className="heart" onClick={()=>heartBlast()}></span> by AmoDevelopers</p>
          </div>  
        </div>
      </div>
    );
};

export default SideBar;